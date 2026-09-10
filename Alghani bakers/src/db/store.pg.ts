import { eq, and, or, ilike, asc, desc, count, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from './client';
import * as schema from './schema';
import type { Category, Product, ProductVariant, Order, OrderItem, StoreSettings, HeroSlide, ProductReview } from '@/lib/types';
import { paginate, DEFAULT_PAGE_SIZE, type PaginatedResult } from '@/lib/pagination';

// -----------------------------------------------------------------------------
// POSTGRES STORE
// -----------------------------------------------------------------------------
// Every function here has a matching entry in src/db/store.ts, which
// dispatches to it automatically when `db` (from src/db/client.ts) is
// non-null. Nothing in this file is used unless DATABASE_URL is set — see
// docs/postgres-migration.md for the cutover checklist.
//
// The one function that got the most scrutiny is createOrderPg(): it
// performs the order insert AND every stock decrement inside a single
// database transaction with row-level locking (`SELECT ... FOR UPDATE`),
// so it stays correct even under 200+ concurrent checkouts across multiple
// server instances — the exact scenario the JSON file store's
// single-process assumption can't survive (see decrementStock()'s comment
// in store.ts). Every other function here is a more mechanical translation
// of its store.ts counterpart.
//
// IMPORTANT: none of this has been run against a live database from the
// environment that wrote it (no network access there) — see
// docs/postgres-migration.md's "Known gaps" section before trusting it in
// production.
// -----------------------------------------------------------------------------

function assertDb() {
  if (!db) {
    throw new Error(
      'DATABASE_URL is not set — store.pg.ts functions require a live Postgres connection. ' +
        'Fall back to src/db/store.ts (the JSON store) when db is null.'
    );
  }
  return db;
}

// --- Public catalog reads --------------------------------------------------

export async function getSettingsPg(): Promise<StoreSettings> {
  const conn = assertDb();
  const rows = await conn.select().from(schema.settings).where(eq(schema.settings.key, 'store_settings'));
  if (rows.length === 0) {
    throw new Error('No row with key "store_settings" found — run the migration script first.');
  }
  return JSON.parse(rows[0].value) as StoreSettings;
}

export async function saveSettingsPg(settings: StoreSettings): Promise<StoreSettings> {
  const conn = assertDb();
  await conn
    .insert(schema.settings)
    .values({ key: 'store_settings', value: JSON.stringify(settings), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: JSON.stringify(settings), updatedAt: new Date() },
    });
  return settings;
}

export async function getCategoriesPg(): Promise<Category[]> {
  const conn = assertDb();
  const [categoryRows, subcategoryRows] = await Promise.all([
    conn.select().from(schema.categories),
    conn.select().from(schema.subcategories),
  ]);

  return categoryRows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? undefined,
      bannerUrl: c.bannerUrl ?? undefined,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      subcategories: subcategoryRows
        .filter((s) => s.categoryId === c.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
          id: s.id,
          categoryId: s.categoryId!,
          name: s.name,
          slug: s.slug,
          bannerUrl: s.bannerUrl ?? undefined,
          sortOrder: s.sortOrder,
          isActive: s.isActive,
        })),
    }));
}

/** Shared row->Product mapper used by both getProductsPg and getProductByIdPg. */
function mapProductRow(p: typeof schema.products.$inferSelect, variantRows: (typeof schema.productVariants.$inferSelect)[]): Product {
  return {
    id: p.id,
    categoryId: p.categoryId ?? '',
    subcategoryId: p.subcategoryId ?? undefined,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription ?? undefined,
    fullDescription: p.fullDescription ?? undefined,
    pricingType: p.pricingType as Product['pricingType'],
    basePrice: p.basePrice,
    packInfo: p.packInfo ?? undefined,
    images: JSON.parse(p.images) as string[],
    imageScale: p.imageScale,
    isCustomizable: p.isCustomizable,
    isFeatured: p.isFeatured,
    isPopular: p.isPopular,
    isAvailable: p.isAvailable,
    sortOrder: p.sortOrder,
    stock: p.stock ?? undefined,
    variants: variantRows
      .filter((v) => v.productId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (v): ProductVariant => ({
          id: v.id,
          productId: v.productId!,
          name: v.name,
          price: v.price,
          isDefault: v.isDefault,
          sortOrder: v.sortOrder,
        })
      ),
    // customizationSteps intentionally omitted from Phase 1 — see TODO list.
  };
}

export async function getProductsPg(): Promise<Product[]> {
  const conn = assertDb();
  const [productRows, variantRows] = await Promise.all([
    conn.select().from(schema.products),
    conn.select().from(schema.productVariants),
  ]);
  return productRows.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => mapProductRow(p, variantRows));
}

export async function getProductByIdPg(id: string): Promise<Product | null> {
  const conn = assertDb();
  const [productRows, variantRows] = await Promise.all([
    conn.select().from(schema.products).where(eq(schema.products.id, id)),
    conn.select().from(schema.productVariants).where(eq(schema.productVariants.productId, id)),
  ]);
  if (productRows.length === 0) return null;
  return mapProductRow(productRows[0], variantRows);
}

/**
 * Batched product lookup — Finding 3-A. Fetches every requested product (and
 * its variants) in ONE round trip each, instead of the caller looping and
 * calling getProductByIdPg() once per cart line item. Used by checkout to
 * verify a whole cart's worth of products without N sequential network
 * round trips to the database.
 */
export async function getProductsByIdsPg(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const conn = assertDb();
  const uniqueIds = [...new Set(ids)];
  const [productRows, variantRows] = await Promise.all([
    conn.select().from(schema.products).where(inArray(schema.products.id, uniqueIds)),
    conn.select().from(schema.productVariants).where(inArray(schema.productVariants.productId, uniqueIds)),
  ]);
  return productRows.map((p) => mapProductRow(p, variantRows));
}

// --- The checkout transaction (the critical path) ---------------------------

export interface CreateOrderPgInput extends Omit<Order, 'createdAt' | 'updatedAt' | 'isViewedByAdmin' | 'items'> {
  items: Omit<OrderItem, 'id' | 'orderId'>[];
}

export type CreateOrderPgResult = { success: true; order: Order } | { success: false; error: string };

/**
 * Inserts the order + every order_item AND decrements stock for every
 * tracked product, all inside one Postgres transaction. If ANY item is out
 * of stock, the whole transaction rolls back — no order is created and no
 * stock is touched, exactly mirroring src/lib/stock.ts's
 * "verify everything or commit nothing" guarantee, but now enforced by the
 * database itself instead of by single-process JavaScript execution. That's
 * what makes this safe across multiple concurrent server instances, which
 * the JSON file store fundamentally cannot be.
 *
 * The row-level lock comes from `SELECT ... FOR UPDATE`: it blocks any other
 * transaction from reading the same product row for stock-checking purposes
 * until this transaction commits or rolls back, so two simultaneous
 * checkouts for the last unit of an item can never both succeed.
 */
export async function createOrderPg(input: CreateOrderPgInput): Promise<CreateOrderPgResult> {
  const conn = assertDb();

  try {
    const order = await conn.transaction(async (tx) => {
      // 1. Lock + verify stock for every tracked line item BEFORE writing
      //    anything. `FOR UPDATE` holds the lock until the transaction ends.
      for (const item of input.items) {
        if (!item.productId) continue; // custom/one-off line item with no catalog product
        const rows = await tx.execute(
          sql`SELECT id, name, stock FROM ${schema.products} WHERE id = ${item.productId} FOR UPDATE`
        );
        // NOTE: `.rows` matches drizzle-orm's neon-serverless result shape at
        // the time this was written (mirrors node-postgres's QueryResult).
        // This hasn't been run against a live database in this environment —
        // if your installed drizzle-orm/@neondatabase/serverless versions
        // return a different shape, adjust this line accordingly (check
        // `console.log(rows)` once against a real DB before relying on it).
        const row = (rows as unknown as { rows: { id: string; name: string; stock: number | null }[] }).rows[0];
        if (!row) throw new Error(`Product ${item.productId} not found`);
        if (row.stock !== null && row.stock < item.quantity) {
          throw new Error(`"${row.name}" only has ${row.stock} left in stock`);
        }
      }

      // 2. Every lock acquired and every check passed — commit every
      //    decrement. The `WHERE stock >= qty` guard is redundant given the
      //    lock above, but kept as defense in depth (matches the exact
      //    pattern requested in Section 4.2 of the spec).
      for (const item of input.items) {
        if (!item.productId) continue;
        await tx.execute(
          sql`UPDATE ${schema.products} SET stock = stock - ${item.quantity}
              WHERE id = ${item.productId} AND (stock IS NULL OR stock >= ${item.quantity})`
        );
      }

      // 3. Insert the order row.
      const now = new Date();
      await tx.insert(schema.orders).values({
        id: input.id,
        customerTitle: input.customerTitle,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        alternatePhone: input.alternatePhone,
        customerEmail: input.customerEmail,
        orderType: input.orderType,
        deliveryAddress: input.deliveryAddress,
        nearestLandmark: input.nearestLandmark,
        deliveryInstructions: input.deliveryInstructions,
        subtotal: input.subtotal,
        taxAmount: input.taxAmount,
        deliveryFee: input.deliveryFee,
        discountAmount: input.discountAmount,
        grandTotal: input.grandTotal,
        containsCustomizedCake: input.containsCustomizedCake,
        advancePercentage: input.advancePercentage,
        advanceRequired: input.advanceRequired,
        advancePaid: input.advancePaid,
        balanceDue: input.balanceDue,
        advanceConfirmed: input.advanceConfirmed,
        advanceConfirmedAt: input.advanceConfirmedAt ? new Date(input.advanceConfirmedAt) : undefined,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        paymentReference: input.paymentReference,
        changeRequest: input.changeRequest,
        orderStatus: input.orderStatus,
        isViewedByAdmin: false,
        internalNotes: input.internalNotes,
        createdAt: now,
        updatedAt: now,
      });

      // 4. Insert every order_item, tied to the order above.
      if (input.items.length > 0) {
        await tx.insert(schema.orderItems).values(
          input.items.map((item, idx) => ({
            id: `${input.id}-item-${idx + 1}`,
            orderId: input.id,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            variantName: item.variantName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            specialInstructions: item.specialInstructions,
            isCustomized: item.isCustomized,
            customizationDetails: item.customizationDetails ? JSON.stringify(item.customizationDetails) : undefined,
          }))
        );
      }

      const fullOrder: Order = {
        ...input,
        isViewedByAdmin: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        items: input.items.map((item, idx) => ({ ...item, id: `${input.id}-item-${idx + 1}`, orderId: input.id })),
      };
      return fullOrder;
    });

    return { success: true, order };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Order could not be placed' };
  }
}

// --- Admin category/product CRUD --------------------------------------------

export async function getAllCategoriesAdminPg(): Promise<Category[]> {
  const conn = assertDb();
  const [categoryRows, subcategoryRows] = await Promise.all([
    conn.select().from(schema.categories),
    conn.select().from(schema.subcategories),
  ]);
  return categoryRows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? undefined,
      bannerUrl: c.bannerUrl ?? undefined,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      subcategories: subcategoryRows
        .filter((s) => s.categoryId === c.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
          id: s.id,
          categoryId: s.categoryId!,
          name: s.name,
          slug: s.slug,
          bannerUrl: s.bannerUrl ?? undefined,
          sortOrder: s.sortOrder,
          isActive: s.isActive,
        })),
    }));
}

/** Upserts a category AND its full subcategory list in one transaction —
 *  deletes any subcategory rows no longer present in `category.subcategories`
 *  so the admin's "remove a subcategory" action is reflected correctly. */
export async function saveCategoryPg(category: Category): Promise<Category> {
  const conn = assertDb();
  await conn.transaction(async (tx) => {
    await tx
      .insert(schema.categories)
      .values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        bannerUrl: category.bannerUrl,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      })
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          bannerUrl: category.bannerUrl,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
      });

    const incomingSubIds = (category.subcategories || []).map((s) => s.id);
    if (incomingSubIds.length > 0) {
      await tx
        .delete(schema.subcategories)
        .where(and(eq(schema.subcategories.categoryId, category.id), notInArray(schema.subcategories.id, incomingSubIds)));
    } else {
      await tx.delete(schema.subcategories).where(eq(schema.subcategories.categoryId, category.id));
    }

    for (const sub of category.subcategories || []) {
      await tx
        .insert(schema.subcategories)
        .values({
          id: sub.id,
          categoryId: category.id,
          name: sub.name,
          slug: sub.slug,
          bannerUrl: sub.bannerUrl,
          sortOrder: sub.sortOrder,
          isActive: sub.isActive,
        })
        .onConflictDoUpdate({
          target: schema.subcategories.id,
          set: { name: sub.name, slug: sub.slug, bannerUrl: sub.bannerUrl, sortOrder: sub.sortOrder, isActive: sub.isActive },
        });
    }
  });
  return category;
}

export async function deleteCategoryPg(id: string): Promise<boolean> {
  const conn = assertDb();
  await conn.transaction(async (tx) => {
    // products.categoryId has no onDelete cascade in the schema, so products
    // under a deleted category are cleared out explicitly here to mirror
    // store.ts's JSON behavior (which also deletes them, not just orphans).
    await tx.delete(schema.products).where(eq(schema.products.categoryId, id));
    await tx.delete(schema.categories).where(eq(schema.categories.id, id));
  });
  return true;
}

export async function getAllProductsAdminPg(): Promise<Product[]> {
  const conn = assertDb();
  const [productRows, variantRows] = await Promise.all([
    conn.select().from(schema.products),
    conn.select().from(schema.productVariants),
  ]);
  return productRows.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => mapProductRow(p, variantRows));
}

/** Upserts a product AND its variant list in one transaction, replacing the
 *  variant set wholesale (simplest correct behavior for an admin edit form
 *  that always submits the full variant list, not a diff). */
export async function saveProductPg(product: Product): Promise<Product> {
  const conn = assertDb();
  await conn.transaction(async (tx) => {
    await tx
      .insert(schema.products)
      .values({
        id: product.id,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        fullDescription: product.fullDescription,
        pricingType: product.pricingType,
        basePrice: product.basePrice,
        packInfo: product.packInfo,
        images: JSON.stringify(product.images),
        imageScale: product.imageScale ?? 100,
        isCustomizable: product.isCustomizable,
        isFeatured: product.isFeatured,
        isPopular: product.isPopular,
        isAvailable: product.isAvailable,
        sortOrder: product.sortOrder,
        stock: product.stock ?? null,
      })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          fullDescription: product.fullDescription,
          pricingType: product.pricingType,
          basePrice: product.basePrice,
          packInfo: product.packInfo,
          images: JSON.stringify(product.images),
          imageScale: product.imageScale ?? 100,
          isCustomizable: product.isCustomizable,
          isFeatured: product.isFeatured,
          isPopular: product.isPopular,
          isAvailable: product.isAvailable,
          sortOrder: product.sortOrder,
          stock: product.stock ?? null,
        },
      });

    await tx.delete(schema.productVariants).where(eq(schema.productVariants.productId, product.id));
    for (const v of product.variants || []) {
      await tx.insert(schema.productVariants).values({
        id: v.id,
        productId: product.id,
        name: v.name,
        price: v.price,
        isDefault: v.isDefault ?? false,
        sortOrder: v.sortOrder,
      });
    }
  });
  return product;
}

export async function deleteProductPg(id: string): Promise<boolean> {
  const conn = assertDb();
  await conn.delete(schema.products).where(eq(schema.products.id, id));
  return true;
}

// --- Orders (admin/read side — the write/checkout side is createOrderPg above) --

function mapOrderRow(
  o: typeof schema.orders.$inferSelect,
  itemRows: (typeof schema.orderItems.$inferSelect)[]
): Order {
  return {
    id: o.id,
    customerTitle: o.customerTitle ?? undefined,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    alternatePhone: o.alternatePhone ?? undefined,
    customerEmail: o.customerEmail ?? undefined,
    orderType: o.orderType as Order['orderType'],
    deliveryAddress: o.deliveryAddress,
    nearestLandmark: o.nearestLandmark ?? undefined,
    deliveryInstructions: o.deliveryInstructions ?? undefined,
    subtotal: o.subtotal,
    taxAmount: o.taxAmount,
    deliveryFee: o.deliveryFee,
    discountAmount: o.discountAmount,
    grandTotal: o.grandTotal,
    containsCustomizedCake: o.containsCustomizedCake,
    advancePercentage: o.advancePercentage,
    advanceRequired: o.advanceRequired,
    advancePaid: o.advancePaid,
    balanceDue: o.balanceDue,
    advanceConfirmed: o.advanceConfirmed,
    advanceConfirmedAt: o.advanceConfirmedAt?.toISOString(),
    paymentMethod: o.paymentMethod as Order['paymentMethod'],
    paymentStatus: o.paymentStatus as Order['paymentStatus'],
    paymentReference: o.paymentReference ?? undefined,
    changeRequest: o.changeRequest ?? undefined,
    orderStatus: o.orderStatus as Order['orderStatus'],
    isViewedByAdmin: o.isViewedByAdmin,
    internalNotes: o.internalNotes ?? undefined,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: itemRows
      .filter((i) => i.orderId === o.id)
      .map(
        (i): OrderItem => ({
          id: i.id,
          orderId: i.orderId!,
          productId: i.productId ?? undefined,
          productName: i.productName,
          productImage: i.productImage ?? undefined,
          variantName: i.variantName ?? undefined,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
          specialInstructions: i.specialInstructions ?? undefined,
          isCustomized: i.isCustomized,
          customizationDetails: i.customizationDetails ? JSON.parse(i.customizationDetails) : undefined,
        })
      ),
  };
}

export interface OrderQueryOptions {
  status?: string;
  paymentMethod?: string;
  containsCustomizedCake?: boolean;
  search?: string;
  sortField?: 'createdAt' | 'grandTotal' | 'id';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function getOrdersPg(options?: OrderQueryOptions): Promise<PaginatedResult<Order>> {
  const conn = assertDb();
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = options || {};

  const conditions = [];
  if (options?.status && options.status !== 'ALL') conditions.push(eq(schema.orders.orderStatus, options.status));
  if (options?.paymentMethod && options.paymentMethod !== 'ALL') conditions.push(eq(schema.orders.paymentMethod, options.paymentMethod));
  if (options?.containsCustomizedCake !== undefined) conditions.push(eq(schema.orders.containsCustomizedCake, options.containsCustomizedCake));
  if (options?.search) {
    const q = `%${options.search}%`;
    conditions.push(
      or(ilike(schema.orders.id, q), ilike(schema.orders.customerName, q), ilike(schema.orders.customerPhone, q))
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn =
    options?.sortField === 'grandTotal'
      ? schema.orders.grandTotal
      : options?.sortField === 'id'
      ? schema.orders.id
      : schema.orders.createdAt;
  const orderByClause = options?.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Real DB-level pagination: only the requested page's order rows and a
  // COUNT are fetched here, not the whole table — see Finding 8-A. Order
  // items are then fetched only for the order IDs actually returned on
  // this page (not the entire order_items table), addressing the related
  // inefficiency flagged as Finding 4-B in the audit.
  const [countResult, orderRows] = await Promise.all([
    conn.select({ value: count() }).from(schema.orders).where(whereClause),
    conn
      .select()
      .from(schema.orders)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const totalItems = countResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const orderIds = orderRows.map((o) => o.id);
  const itemRows = orderIds.length > 0 ? await conn.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orderIds)) : [];

  return {
    data: orderRows.map((o) => mapOrderRow(o, itemRows)),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export async function getOrderByIdPg(id: string): Promise<Order | null> {
  const conn = assertDb();
  const [orderRows, itemRows] = await Promise.all([
    conn.select().from(schema.orders).where(eq(schema.orders.id, id)),
    conn.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id)),
  ]);
  if (orderRows.length === 0) return null;

  // Mark as viewed, mirroring store.ts's getOrderById side effect.
  if (!orderRows[0].isViewedByAdmin) {
    await conn.update(schema.orders).set({ isViewedByAdmin: true }).where(eq(schema.orders.id, id));
    orderRows[0] = { ...orderRows[0], isViewedByAdmin: true };
  }
  return mapOrderRow(orderRows[0], itemRows);
}

export async function updateOrderStatusPg(id: string, status: string, internalNotes?: string): Promise<Order | null> {
  const conn = assertDb();
  const set: Partial<typeof schema.orders.$inferInsert> = { orderStatus: status, updatedAt: new Date() };
  if (internalNotes !== undefined) set.internalNotes = internalNotes;
  const rows = await conn.update(schema.orders).set(set).where(eq(schema.orders.id, id)).returning();
  if (rows.length === 0) return null;
  const itemRows = await conn.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return mapOrderRow(rows[0], itemRows);
}

export async function confirmOrderAdvancePg(id: string): Promise<Order | null> {
  const conn = assertDb();
  const rows = await conn
    .update(schema.orders)
    .set({ advanceConfirmed: true, advanceConfirmedAt: new Date(), paymentStatus: 'ADVANCE_PAID', updatedAt: new Date() })
    .where(eq(schema.orders.id, id))
    .returning();
  if (rows.length === 0) return null;
  const itemRows = await conn.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return mapOrderRow(rows[0], itemRows);
}

export async function confirmOrderPaymentPg(id: string): Promise<Order | null> {
  const conn = assertDb();
  const existing = await conn.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (existing.length === 0) return null;
  const rows = await conn
    .update(schema.orders)
    .set({ paymentStatus: 'PAID', advancePaid: existing[0].grandTotal, updatedAt: new Date() })
    .where(eq(schema.orders.id, id))
    .returning();
  const itemRows = await conn.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return mapOrderRow(rows[0], itemRows);
}

export async function markOrderPaymentFailedPg(id: string): Promise<Order | null> {
  const conn = assertDb();
  const rows = await conn
    .update(schema.orders)
    .set({ paymentStatus: 'FAILED', updatedAt: new Date() })
    .where(eq(schema.orders.id, id))
    .returning();
  if (rows.length === 0) return null;
  const itemRows = await conn.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return mapOrderRow(rows[0], itemRows);
}

export async function getCustomerOrderHistoryPg(phone: string): Promise<Order[]> {
  const conn = assertDb();
  const [orderRows, itemRows] = await Promise.all([
    conn.select().from(schema.orders).where(eq(schema.orders.customerPhone, phone)),
    conn.select().from(schema.orderItems),
  ]);
  return orderRows.map((o) => mapOrderRow(o, itemRows));
}

export async function getDashboardStatsPg() {
  const conn = assertDb();
  const orderRows = await conn.select().from(schema.orders);
  const today = new Date().toISOString().slice(0, 10);

  const todayOrders = orderRows.filter((o) => o.createdAt.toISOString().startsWith(today));
  const pendingAction = orderRows.filter((o) => o.orderStatus === 'PENDING');
  const customizedPendingAdvance = orderRows.filter(
    (o) => o.containsCustomizedCake && !o.advanceConfirmed && o.orderStatus !== 'CANCELLED'
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  return {
    todayOrdersCount: todayOrders.length,
    pendingActionCount: pendingAction.length,
    todayRevenue,
    customizedPendingAdvanceCount: customizedPendingAdvance.length,
    totalOrdersCount: orderRows.length,
  };
}

// --- Admin auth ---------------------------------------------------------

type AdminRow = typeof schema.admins.$inferSelect;

export async function getAdminByEmailPg(email: string): Promise<AdminRow | null> {
  const conn = assertDb();
  const rows = await conn.select().from(schema.admins).where(sql`lower(${schema.admins.email}) = lower(${email})`);
  return rows[0] ?? null;
}

export async function getAdminByIdPg(id: string): Promise<AdminRow | null> {
  const conn = assertDb();
  const rows = await conn.select().from(schema.admins).where(eq(schema.admins.id, id));
  return rows[0] ?? null;
}

export async function updateAdminCredentialsPg(
  adminId: string,
  updates: { email?: string; name?: string; passwordHash?: string }
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const conn = assertDb();
  const updateData: Record<string, any> = {};
  if (updates.email) updateData.email = updates.email;
  if (updates.name) updateData.name = updates.name;
  if (updates.passwordHash) updateData.passwordHash = updates.passwordHash;

  const [row] = await conn
    .update(schema.admins)
    .set(updateData)
    .where(or(eq(schema.admins.id, adminId), sql`lower(${schema.admins.email}) = lower(${adminId})`))
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

export async function registerInitialAdminPg(email: string, passwordHash: string, name: string): Promise<AdminRow> {
  const conn = assertDb();
  const [row] = await conn
    .insert(schema.admins)
    .values({ id: `admin-${Date.now()}`, email, passwordHash, name, role: 'SUPER_ADMIN', isActive: true })
    .returning();
  return row;
}

export async function createPasswordResetTokenPg(email: string): Promise<string | null> {
  const conn = assertDb();
  const admin = await getAdminByEmailPg(email);
  if (!admin) return null;

  const { generateResetToken } = await import('@/lib/tokens');
  const { token, tokenHash, expiresAt } = generateResetToken();
  await conn
    .update(schema.admins)
    .set({ resetTokenHash: tokenHash, resetTokenExpiresAt: new Date(expiresAt) })
    .where(eq(schema.admins.id, admin.id));
  return token;
}

export async function consumePasswordResetTokenPg(email: string, token: string, newPasswordHash: string): Promise<boolean> {
  const conn = assertDb();
  const admin = await getAdminByEmailPg(email);
  if (!admin) return false;

  const { verifyResetToken } = await import('@/lib/tokens');
  const isValid = verifyResetToken({
    submittedToken: token,
    storedTokenHash: admin.resetTokenHash ?? undefined,
    storedExpiresAt: admin.resetTokenExpiresAt?.toISOString(),
  });
  if (!isValid) return false;

  await conn
    .update(schema.admins)
    .set({ passwordHash: newPasswordHash, resetTokenHash: null, resetTokenExpiresAt: null })
    .where(eq(schema.admins.id, admin.id));
  return true;
}

// --- Product reviews ------------------------------------------------------

export async function getReviewsForProductPg(productId: string): Promise<ProductReview[]> {
  const conn = assertDb();
  const rows = await conn
    .select()
    .from(schema.productReviews)
    .where(and(eq(schema.productReviews.productId, productId), eq(schema.productReviews.isApproved, true)));
  return rows
    .map(
      (r): ProductReview => ({
        id: r.id,
        productId: r.productId!,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        isApproved: r.isApproved,
      })
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getReviewSummaryPg(productId: string): Promise<{ average: number; count: number }> {
  const reviews = await getReviewsForProductPg(productId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}

export async function addReviewPg(review: { productId: string; customerName: string; rating: number; comment: string }): Promise<ProductReview> {
  const conn = assertDb();
  const [row] = await conn
    .insert(schema.productReviews)
    .values({
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: review.productId,
      customerName: review.customerName,
      rating: Math.max(1, Math.min(5, Math.round(review.rating))),
      comment: review.comment,
      isApproved: true,
    })
    .returning();
  return {
    id: row.id,
    productId: row.productId!,
    customerName: row.customerName,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    isApproved: row.isApproved,
  };
}

export async function getAllReviewsAdminPg(pagination?: { page?: number; pageSize?: number }): Promise<PaginatedResult<ProductReview>> {
  const conn = assertDb();
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;

  const [countResult, rows] = await Promise.all([
    conn.select({ value: count() }).from(schema.productReviews),
    conn
      .select()
      .from(schema.productReviews)
      .orderBy(desc(schema.productReviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const totalItems = countResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const data = rows.map(
    (r): ProductReview => ({
      id: r.id,
      productId: r.productId!,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      isApproved: r.isApproved,
    })
  );

  return { data, page, pageSize, totalItems, totalPages };
}

export async function deleteReviewPg(id: string): Promise<boolean> {
  const conn = assertDb();
  const rows = await conn.delete(schema.productReviews).where(eq(schema.productReviews.id, id)).returning();
  return rows.length > 0;
}

// --- Hero slides ------------------------------------------------------------

export async function getHeroSlidesPg(): Promise<HeroSlide[]> {
  const conn = assertDb();
  const rows = await conn.select().from(schema.heroSlides).where(eq(schema.heroSlides.isActive, true));
  return rows
    .map(
      (s): HeroSlide => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle ?? undefined,
        imageUrl: s.imageUrl,
        actionLink: s.actionLink ?? undefined,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
      })
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Replaces the entire hero-slides set — mirrors store.ts's saveHeroSlides,
 *  which also always overwrites the full list rather than diffing it. */
export async function saveHeroSlidesPg(slides: HeroSlide[]): Promise<HeroSlide[]> {
  const conn = assertDb();
  await conn.transaction(async (tx) => {
    await tx.delete(schema.heroSlides);
    for (const s of slides) {
      await tx.insert(schema.heroSlides).values({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        imageUrl: s.imageUrl,
        actionLink: s.actionLink,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
      });
    }
  });
  return slides;
}
