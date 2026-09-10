import fs from 'fs';
import path from 'path';
import { initialCategories, initialProducts, initialHeroSlides, initialSettings } from './seed-data';
import { Category, Product, HeroSlide, StoreSettings, Order, AdminUser, OrderStatus, ProductReview, Complaint } from '@/lib/types';
import { hashPassword } from '@/lib/auth';
import { generateResetToken, verifyResetToken } from '@/lib/tokens';
import { applyStockDecrement, OutOfStockError } from '@/lib/stock';
import { paginate, DEFAULT_PAGE_SIZE, type PaginatedResult } from '@/lib/pagination';
import { db } from './client';
import * as pg from './store.pg';
import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// DUAL-MODE DATA LAYER
// -----------------------------------------------------------------------------
// Every exported function below checks `db` (set when DATABASE_URL is
// configured — see src/db/client.ts) and delegates to its Postgres
// counterpart in store.pg.ts when it's available, falling back to the JSON
// file logic otherwise. This is what lets every route/page keep importing
// from '@/db/store' unchanged regardless of which backend is active — see
// docs/postgres-migration.md for the full cutover checklist (schema push +
// one-time data migration) before setting DATABASE_URL in production.
// -----------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const runningOnVercel = process.env.VERCEL === '1';

export interface StoreData {
  categories: Category[];
  products: Product[];
  heroSlides: HeroSlide[];
  settings: StoreSettings;
  orders: Order[];
  admins: (AdminUser & { passwordHash: string; resetTokenHash?: string; resetTokenExpiresAt?: string })[];
  reviews: ProductReview[];
  complaints: Complaint[];
}

// -----------------------------------------------------------------------------
// L1 IN-MEMORY CACHE — Performance + Scalability Audit Finding 4-A / 15-A
// -----------------------------------------------------------------------------
// ensureDataFile() used to run fs.readFileSync + JSON.parse over the ENTIRE
// store file on every single call — including read-only calls like
// getSettings() that only ever need one small slice of it. As `orders`
// grows (Finding 33-A), every page load paid the cost of parsing the full
// order history even though it never touched it, and that parsing is fully
// synchronous (blocks the Node event loop for its duration).
//
// The parsed StoreData is now kept in this module-level variable and only
// actually read from disk once per process — after that, every read comes
// straight from memory. This is "write-invalidated" in the sense that a
// write is what keeps the cache correct: saveData() below writes the SAME
// object it's given into `cachedData` as part of persisting it, so the
// cache is always exactly what was last written, never stale from another
// write. This works because every mutating function in this file already
// follows one pattern — call ensureDataFile(), mutate the returned object
// in place, then immediately call saveData(that same object) — with
// nothing else happening in between. No function here ever mutates the
// data without persisting it in the same breath, which is what makes
// caching the exact object reference safe.
//
// This is only correct for a single Node process holding this module in
// memory, matching the JSON store's existing single-process assumption
// (see decrementStock()'s comment further down, and SCALING.md). Multiple
// processes/instances each get their own independent cache and could
// disagree — that's an existing limitation of the JSON store, not a new
// one introduced by caching, and it's exactly what the Postgres migration
// (already built, see docs/postgres-migration.md) resolves properly.
let cachedData: StoreData | null = null;

function ensureDataFile(): StoreData {
  if (runningOnVercel && !db) {
    throw new Error(
      'Persistent database is not configured on Vercel. Set DATABASE_URL in the Vercel project environment variables.'
    );
  }

  if (cachedData) return cachedData;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content) as StoreData;   // add the `as StoreData` cast
      if (!Array.isArray(parsed.reviews)) {
        parsed.reviews = [];
      }
      if (!Array.isArray(parsed.complaints)) {
        parsed.complaints = [];
      }
      // Ensure any new setting fields (e.g. payment account details) exist
      parsed.settings = { ...initialSettings, ...parsed.settings };
      cachedData = parsed;
      return parsed;   // return parsed, not cachedData
    }
  } catch (err) {
    console.error('Error reading store file, initializing defaults:', err);
  }

  // Generate initial salt hash for default admin:
  // Default: admin@alghanisweets.com / admin12345
  const defaultAdmin: AdminUser & { passwordHash: string } = {
    id: 'admin-1',
    email: process.env.ADMIN_INITIAL_EMAIL || 'admin@alghanisweets.com',
    passwordHash: '$2a$10$BjaWSzC7zhNctcASkjkJSunUYMerTDfWeD6lubkdx/CCybC2GJDMy', // hashed 'admin12345'
    name: 'Al-Ghani Store Manager',
    role: 'SUPER_ADMIN',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
  };

  const initialStore: StoreData = {
    categories: initialCategories,
    products: initialProducts,
    heroSlides: initialHeroSlides,
    settings: initialSettings,
    orders: [
      {
        id: 'AGB-20260905-101',
        customerTitle: 'Mr.',
        customerName: 'Muhammad Hamza',
        customerPhone: '03001234567',
        alternatePhone: '03217654321',
        customerEmail: 'hamza@example.com',
        orderType: 'DELIVERY',
        deliveryAddress: 'House 45, Street 12, Sector C, Gulberg III, Lahore',
        nearestLandmark: 'Near Siddique Trade Center',
        deliveryInstructions: 'Ring doorbell twice, please handle cake carefully.',
        subtotal: 5350,
        taxAmount: 963,
        deliveryFee: 150,
        discountAmount: 0,
        grandTotal: 6463,
        containsCustomizedCake: true,
        advancePercentage: 30,
        advanceRequired: 1938.9,
        advancePaid: 1938.9,
        balanceDue: 4524.1,
        advanceConfirmed: false,
        paymentMethod: 'JAZZCASH',
        paymentStatus: 'ADVANCE_PAID',
        paymentReference: 'JC-98421054',
        orderStatus: 'PENDING',
        isViewedByAdmin: false,
        internalNotes: 'Customized Nikkah cake with gold message requested.',
        createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        items: [
          {
            id: 'item-1',
            orderId: 'AGB-20260905-101',
            productId: 'custom-nikkah-elegance',
            productName: 'Royal Nikkah Celebration Cake',
            productImage: '/images/customize-cake/nikkah.jpg',
            variantName: '3 LBS',
            unitPrice: 4500,
            quantity: 1,
            lineTotal: 4500,
            isCustomized: true,
            customizationDetails: {
              weight: '3 LBS',
              flavor: 'Chocolate Fudge Royale',
              message: 'Mubarak Ali & Fatima',
              deliveryDate: '2026-09-08',
            }
          },
          {
            id: 'item-2',
            orderId: 'AGB-20260905-101',
            productId: 'sweets-gulab-jamun',
            productName: 'Royal Shahi Gulab Jamun',
            productImage: '/images/sweets/gulab_jamun.jpg',
            variantName: '500 G',
            unitPrice: 850,
            quantity: 1,
            lineTotal: 850,
            isCustomized: false,
          }
        ]
      },
      {
        id: 'AGB-20260905-102',
        customerTitle: 'Mrs.',
        customerName: 'Ayesha Siddiqui',
        customerPhone: '03334567890',
        orderType: 'DELIVERY',
        deliveryAddress: 'Flat 4B, Al-Hafeez Heights, Ghalib Rd, Lahore',
        deliveryInstructions: 'Call before arriving',
        subtotal: 1900,
        taxAmount: 342,
        deliveryFee: 150,
        discountAmount: 0,
        grandTotal: 2392,
        containsCustomizedCake: false,
        advancePercentage: 30,
        advanceRequired: 0,
        advancePaid: 0,
        balanceDue: 2392,
        advanceConfirmed: false,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        changeRequest: 'Need change for Rs. 5000',
        orderStatus: 'PREPARING',
        isViewedByAdmin: true,
        internalNotes: 'Regular customer, extra garlic dip added.',
        createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        items: [
          {
            id: 'item-3',
            orderId: 'AGB-20260905-102',
            productId: 'ff-creamy-tikka-pizza',
            productName: 'Creamy Tikka Melt Pizza',
            productImage: '/images/fastfood/creamytikkapizza.jpg',
            variantName: 'Large (13")',
            unitPrice: 1900,
            quantity: 1,
            lineTotal: 1900,
            isCustomized: false,
          }
        ]
      }
    ],
    admins: [defaultAdmin],
    reviews: [],
    complaints: [],
  };

  saveData(initialStore);
  return (cachedData = initialStore);
}

function saveData(data: StoreData) {
  // Update the in-memory cache first so it's never possible to observe a
  // state where the disk write happened but the cache wasn't updated (or
  // vice versa) — they're set together, right here.
  cachedData = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing store file:', err);
  }
}

// -----------------------------------------------------------------------------
// PUBLIC STORE API
// -----------------------------------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  if (db) return (await pg.getCategoriesPg()).filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const data = ensureDataFile();
  return data.categories.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  if (db) return pg.getAllCategoriesAdminPg();
  const data = ensureDataFile();
  return data.categories.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveCategory(category: Category): Promise<Category> {
  if (db) return pg.saveCategoryPg(category);
  const data = ensureDataFile();
  const existingIdx = data.categories.findIndex(c => c.id === category.id);
  if (existingIdx >= 0) {
    data.categories[existingIdx] = category;
  } else {
    data.categories.push(category);
  }
  saveData(data);
  return category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (db) return pg.deleteCategoryPg(id);
  const data = ensureDataFile();
  data.categories = data.categories.filter(c => c.id !== id);
  data.products = data.products.filter(p => p.categoryId !== id);
  saveData(data);
  return true;
}

export async function getProducts(categoryId?: string, subcategoryId?: string): Promise<Product[]> {
  if (db) {
    let list = (await pg.getProductsPg()).filter((p) => p.isAvailable);
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    if (subcategoryId) list = list.filter((p) => p.subcategoryId === subcategoryId);
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const data = ensureDataFile();
  let list = data.products.filter(p => p.isAvailable);
  if (categoryId) {
    list = list.filter(p => p.categoryId === categoryId);
  }
  if (subcategoryId) {
    list = list.filter(p => p.subcategoryId === subcategoryId);
  }
  return list.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  if (db) return (await pg.getAllProductsAdminPg()).sort((a, b) => a.sortOrder - b.sortOrder);
  const data = ensureDataFile();
  return data.products.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (db) {
    // Pg lookup is by id only; fall back to a full-table scan for the
    // slug case, mirroring the JSON store's "id OR slug" behavior.
    const byId = await pg.getProductByIdPg(id);
    if (byId) return byId;
    const all = await pg.getProductsPg();
    return all.find((p) => p.slug === id) || null;
  }
  const data = ensureDataFile();
  return data.products.find(p => p.id === id || p.slug === id) || null;
}

/**
 * Batched product lookup — Finding 3-A. Fetches every requested product in
 * ONE call, instead of a caller looping and calling getProductById() once
 * per id. In Postgres mode this is a single `WHERE id IN (...)` query
 * rather than N sequential round trips; in JSON mode it's already an
 * in-memory filter either way, so this mainly exists so callers (like
 * checkout) don't need an `if (db)` branch of their own.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    const uniqueIds = [...new Set(ids)];
    const [
      { data: productRows, error: productError },
      { data: variantRows, error: variantError },
      { data: customizationStepRows, error: customizationStepError },
      { data: customizationOptionRows, error: customizationOptionError },
    ] = await Promise.all([
      supabase.from('products').select('*').in('id', uniqueIds),
      supabase.from('product_variants').select('*').in('product_id', uniqueIds),
      supabase.from('customization_steps').select('*').in('product_id', uniqueIds),
      supabase.from('customization_options').select('*'),
    ]);

    if (!productError && !variantError && !customizationStepError && !customizationOptionError && productRows) {
      return (productRows as any[]).map((row) => ({
        id: row.id,
        categoryId: row.category_id ?? row.categoryId ?? '',
        subcategoryId: row.subcategory_id ?? row.subcategoryId ?? undefined,
        name: row.name,
        slug: row.slug,
        shortDescription: row.short_description ?? row.shortDescription ?? undefined,
        fullDescription: row.full_description ?? row.fullDescription ?? undefined,
        pricingType: row.pricing_type ?? row.pricingType ?? 'FIXED',
        basePrice: row.base_price ?? row.basePrice ?? 0,
        packInfo: row.pack_info ?? row.packInfo ?? undefined,
        images: Array.isArray(row.images) ? row.images : JSON.parse(row.images || '[]'),
        imageScale: row.image_scale ?? row.imageScale ?? undefined,
        isCustomizable: row.is_customizable ?? row.isCustomizable ?? false,
        isFeatured: row.is_featured ?? row.isFeatured ?? false,
        isPopular: row.is_popular ?? row.isPopular ?? false,
        isAvailable: row.is_available ?? row.isAvailable ?? true,
        sortOrder: row.sort_order ?? row.sortOrder ?? 0,
        stock: row.stock ?? undefined,
        variants: (variantRows || [])
          .filter((variant: any) => variant.product_id === row.id || variant.productId === row.id)
          .map((variant: any) => ({
            id: variant.id,
            productId: variant.product_id ?? variant.productId,
            name: variant.name,
            price: variant.price,
            isDefault: variant.is_default ?? variant.isDefault,
            sortOrder: variant.sort_order ?? variant.sortOrder ?? 0,
          })),
        customizationSteps: (customizationStepRows || [])
          .filter((step: any) => step.product_id === row.id || step.productId === row.id)
          .sort((a: any, b: any) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0))
          .map((step: any) => ({
            id: step.id,
            productId: step.product_id ?? step.productId,
            title: step.title,
            stepType: step.step_type ?? step.stepType,
            isRequired: step.is_required ?? step.isRequired ?? true,
            sortOrder: step.sort_order ?? step.sortOrder ?? 0,
            options: (customizationOptionRows || [])
              .filter((option: any) => option.step_id === step.id || option.stepId === step.id)
              .sort((a: any, b: any) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0))
              .map((option: any) => ({
                id: option.id,
                stepId: option.step_id ?? option.stepId,
                name: option.name,
                priceModifier: option.price_modifier ?? option.priceModifier ?? 0,
                isDefault: option.is_default ?? option.isDefault,
                sortOrder: option.sort_order ?? option.sortOrder ?? 0,
              })),
          })),
      })) as Product[];
    }

    console.error(
      'Supabase product lookup failed:',
      productError || variantError || customizationStepError || customizationOptionError
    );
  }

  if (db) return pg.getProductsByIdsPg(ids);
  const data = ensureDataFile();
  const idSet = new Set(ids);
  return data.products.filter(p => idSet.has(p.id));
}

export async function saveProduct(product: Product): Promise<Product> {
  if (db) return pg.saveProductPg(product);
  const data = ensureDataFile();
  const existingIdx = data.products.findIndex(p => p.id === product.id);
  if (existingIdx >= 0) {
    data.products[existingIdx] = product;
  } else {
    data.products.push(product);
  }
  saveData(data);
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (db) return pg.deleteProductPg(id);
  const data = ensureDataFile();
  data.products = data.products.filter(p => p.id !== id);
  saveData(data);
  return true;
}

// -----------------------------------------------------------------------------
// ATOMIC STOCK DECREMENT (race-condition prevention)
// -----------------------------------------------------------------------------
// Only products with a numeric `stock` set are tracked at all (see the
// `stock` field comment on Product in src/lib/types.ts) — most menu items
// are made-to-order and never touch this path.
//
// Why this is safe from the classic "read stock, check it, then write it
// back" race even with two checkouts hitting the server at the same
// instant: every read/write here uses the synchronous fs.readFileSync/
// writeFileSync (via ensureDataFile/saveData) and this function contains
// no `await` between reading the file and saving it back. Node runs
// JavaScript on a single thread, so a synchronous block like this one can
// never be interleaved with another request's code — the entire
// check-then-decrement is a single atomic step for as long as this stays
// one Node process.
//
// That guarantee stops holding the moment you run more than one server
// instance (multiple Vercel/serverless instances, or a second app server)
// — at that point two processes really can race on the same
// `.data/store.json` on disk. That's exactly the trigger condition
// SCALING.md's "Migrating off the JSON file store" section calls out. The
// Postgres equivalent of this function does the same two checks as a
// single SQL statement instead of two JS passes:
//
//   UPDATE products SET stock = stock - $qty
//   WHERE id = $productId AND stock >= $qty
//
// ...and the caller checks `rowCount === 0` to know it was rejected — see
// src/db/store.pg.ts for the transactional version used once DATABASE_URL
// is set.
export async function decrementStock(
  items: { productId: string; quantity: number }[]
): Promise<{ success: true } | { success: false; error: string }> {
  if (db) {
    // Postgres mode: the real atomic check + decrement happens together
    // with the order insert inside createOrder() below, using a single
    // transaction with row-level locks (see createOrderPg in store.pg.ts).
    // Calling this separately here is deliberately a no-op so the API
    // route doesn't need to special-case which backend is active — it's
    // still fully checked, just one step later, atomically with the write.
    return { success: true };
  }

  const data = ensureDataFile();

  // The actual verify-then-commit logic lives in src/lib/stock.ts
  // (applyStockDecrement) so it can be unit tested in isolation — see
  // src/lib/__tests__/stock.test.ts. It mutates data.products in place and
  // only ever does so after confirming every item can be fulfilled, so a
  // failed result here never leaves a partial write.
  const result = applyStockDecrement(data.products, items);
  if (!result.success) return result;

  saveData(data);
  return result;
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  if (db) return (await pg.getHeroSlidesPg()).sort((a, b) => a.sortOrder - b.sortOrder);
  const data = ensureDataFile();
  return data.heroSlides.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
  if (db) return pg.saveHeroSlidesPg(slides);
  const data = ensureDataFile();
  data.heroSlides = slides;
  saveData(data);
  return slides;
}

export async function getSettings(): Promise<StoreSettings> {
  if (db) return pg.getSettingsPg();
  const data = ensureDataFile();
  return data.settings;
}

export async function saveSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  if (db) {
    const current = await pg.getSettingsPg();
    const merged = { ...current, ...settings };
    return pg.saveSettingsPg(merged);
  }
  const data = ensureDataFile();
  data.settings = { ...data.settings, ...settings };
  saveData(data);
  return data.settings;
}

// -----------------------------------------------------------------------------
// ORDERS API
// -----------------------------------------------------------------------------
export async function createOrder(orderData: Omit<Order, 'createdAt' | 'updatedAt' | 'isViewedByAdmin'>): Promise<Order> {
  if (db) {
    const result = await pg.createOrderPg({
      ...orderData,
      items: orderData.items.map(({ id, orderId, ...rest }) => rest),
    });
    if (!result.success) {
      // Distinguishes "sold out" from a genuine server error so the API
      // route can return 409 instead of 500 — see OutOfStockError's doc
      // comment in src/lib/stock.ts.
      throw new OutOfStockError(result.error);
    }
    return result.order;
  }

  const data = ensureDataFile();
  const newOrder: Order = {
    ...orderData,
    isViewedByAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.orders.unshift(newOrder); // Newest first
  saveData(data);
  return newOrder;
}

export async function getOrders(options?: pg.OrderQueryOptions): Promise<PaginatedResult<Order>> {
  if (db) return pg.getOrdersPg(options);

  const data = ensureDataFile();
  let list = [...data.orders];

  if (options?.status && options.status !== 'ALL') {
    list = list.filter(o => o.orderStatus === options.status);
  }

  if (options?.paymentMethod && options.paymentMethod !== 'ALL') {
    list = list.filter(o => o.paymentMethod === options.paymentMethod);
  }

  if (options?.containsCustomizedCake !== undefined) {
    list = list.filter(o => o.containsCustomizedCake === options.containsCustomizedCake);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }

  const sortField = options?.sortField || 'createdAt';
  const sortDir = options?.sortOrder || 'desc';
  list.sort((a, b) => {
    let cmp: number;
    if (sortField === 'grandTotal') {
      cmp = a.grandTotal - b.grandTotal;
    } else if (sortField === 'id') {
      cmp = a.id.localeCompare(b.id);
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return paginate(list, { page: options?.page ?? 1, pageSize: options?.pageSize ?? DEFAULT_PAGE_SIZE });
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (db) return pg.getOrderByIdPg(id);
  const data = ensureDataFile();
  const cleanId = id.trim().toLowerCase();
  const numericOnly = cleanId.replace(/[^0-9]/g, '');

  const order = data.orders.find((o) => {
    const oId = o.id.toLowerCase();
    if (oId === cleanId) return true;
    if (oId.endsWith(cleanId)) return true;
    if (cleanId.length >= 4 && oId.includes(cleanId)) return true;
    // Match numeric suffix like "3093"
    if (numericOnly && numericOnly.length >= 3 && oId.replace(/[^0-9]/g, '').endsWith(numericOnly)) return true;
    return false;
  });

  return order || null;
}

export async function updateOrderStatus(id: string, status: OrderStatus, internalNotes?: string): Promise<Order | null> {
  if (db) return pg.updateOrderStatusPg(id, status, internalNotes);
  const data = ensureDataFile();
  const order = data.orders.find(o => o.id === id);
  if (!order) return null;

  order.orderStatus = status;
  if (internalNotes !== undefined) {
    order.internalNotes = internalNotes;
  }
  order.updatedAt = new Date().toISOString();
  saveData(data);
  return order;
}

export async function confirmOrderAdvance(id: string): Promise<Order | null> {
  if (db) return pg.confirmOrderAdvancePg(id);
  const data = ensureDataFile();
  const order = data.orders.find(o => o.id === id);
  if (!order) return null;

  order.advanceConfirmed = true;
  order.advanceConfirmedAt = new Date().toISOString();
  order.paymentStatus = 'ADVANCE_PAID';
  order.updatedAt = new Date().toISOString();
  saveData(data);
  return order;
}

// Admin manually checked the actual JazzCash/Easypaisa/bank/card transaction
// and confirms it matches the order total — moves a PENDING_VERIFICATION
// order to PAID. This is the only way an order can become PAID; it is never
// set automatically at checkout.
export async function confirmOrderPayment(id: string): Promise<Order | null> {
  if (db) return pg.confirmOrderPaymentPg(id);
  const data = ensureDataFile();
  const order = data.orders.find(o => o.id === id);
  if (!order) return null;

  order.paymentStatus = 'PAID';
  order.advancePaid = order.grandTotal;
  order.updatedAt = new Date().toISOString();
  saveData(data);
  return order;
}

// Admin determined the submitted payment proof/reference does not check out.
export async function markOrderPaymentFailed(id: string): Promise<Order | null> {
  if (db) return pg.markOrderPaymentFailedPg(id);
  const data = ensureDataFile();
  const order = data.orders.find(o => o.id === id);
  if (!order) return null;

  order.paymentStatus = 'FAILED';
  order.updatedAt = new Date().toISOString();
  saveData(data);
  return order;
}

export async function getCustomerOrderHistory(phone: string): Promise<Order[]> {
  if (db) return pg.getCustomerOrderHistoryPg(phone);
  const data = ensureDataFile();
  return data.orders.filter(o => o.customerPhone === phone);
}

export async function getDashboardStats() {
  if (db) return pg.getDashboardStatsPg();
  const data = ensureDataFile();
  const today = new Date().toISOString().slice(0, 10);

  const todayOrders = data.orders.filter(o => o.createdAt.startsWith(today));
  const pendingAction = data.orders.filter(o => o.orderStatus === 'PENDING');
  const customizedPendingAdvance = data.orders.filter(
    o => o.containsCustomizedCake && !o.advanceConfirmed && o.orderStatus !== 'CANCELLED'
  );

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  return {
    todayOrdersCount: todayOrders.length,
    pendingActionCount: pendingAction.length,
    todayRevenue,
    customizedPendingAdvanceCount: customizedPendingAdvance.length,
    totalOrdersCount: data.orders.length,
  };
}

// -----------------------------------------------------------------------------
// ADMIN AUTH STORE API
// -----------------------------------------------------------------------------
export async function getAdminByEmail(email: string) {
  if (db) return pg.getAdminByEmailPg(email);
  const data = ensureDataFile();
  return data.admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getAdminById(id: string) {
  if (db) return pg.getAdminByIdPg(id);
  const data = ensureDataFile();
  return data.admins.find(a => a.id === id) || null;
}

export async function updateAdminCredentials(
  adminId: string,
  updates: { email?: string; name?: string; newPasswordPlain?: string }
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const newPasswordHash = updates.newPasswordPlain ? await hashPassword(updates.newPasswordPlain) : undefined;
  if (db) return pg.updateAdminCredentialsPg(adminId, { email: updates.email, name: updates.name, passwordHash: newPasswordHash });

  const data = ensureDataFile();
  const admin = data.admins.find(a => a.id === adminId || a.email.toLowerCase() === adminId.toLowerCase());
  if (!admin) return null;

  if (updates.email) {
    // Check if new email is already taken by another admin
    const conflict = data.admins.find(a => a.id !== admin.id && a.email.toLowerCase() === updates.email!.toLowerCase());
    if (conflict) {
      throw new Error('This email address is already in use by another admin.');
    }
    admin.email = updates.email.trim();
  }

  if (updates.name) {
    admin.name = updates.name.trim();
  }

  if (newPasswordHash) {
    admin.passwordHash = newPasswordHash;
  }

  saveData(data);
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

export async function registerInitialAdmin(email: string, passwordPlain: string, name: string) {
  const passwordHash = await hashPassword(passwordPlain);
  if (db) return pg.registerInitialAdminPg(email, passwordHash, name);
  const data = ensureDataFile();
  const admin: AdminUser & { passwordHash: string } = {
    id: `admin-${Date.now()}`,
    email,
    passwordHash,
    name,
    role: 'SUPER_ADMIN',
    isActive: true,
  };
  data.admins.push(admin);
  saveData(data);
  return admin;
}

// -----------------------------------------------------------------------------
// ADMIN PASSWORD RESET
// -----------------------------------------------------------------------------
// The reset token is a one-time, time-limited secret. We only ever store a
// SHA-256 hash of it (never the plaintext), the same pattern used for
// passwords, so a leaked store.json/database row can't be used to reset an
// account.
export async function createPasswordResetToken(email: string): Promise<string | null> {
  if (db) return pg.createPasswordResetTokenPg(email);
  const data = ensureDataFile();
  const admin = data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!admin) return null;

  const { token, tokenHash, expiresAt } = generateResetToken();
  admin.resetTokenHash = tokenHash;
  admin.resetTokenExpiresAt = expiresAt;
  saveData(data);

  return token;
}

export async function consumePasswordResetToken(
  email: string,
  token: string,
  newPasswordPlain: string
): Promise<boolean> {
  const newPasswordHash = await hashPassword(newPasswordPlain);
  if (db) return pg.consumePasswordResetTokenPg(email, token, newPasswordHash);

  const data = ensureDataFile();
  const admin = data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!admin) return false;

  const isValid = verifyResetToken({
    submittedToken: token,
    storedTokenHash: admin.resetTokenHash,
    storedExpiresAt: admin.resetTokenExpiresAt,
  });
  if (!isValid) return false;

  admin.passwordHash = newPasswordHash;
  delete admin.resetTokenHash;
  delete admin.resetTokenExpiresAt;
  saveData(data);
  return true;
}

// -----------------------------------------------------------------------------
// PRODUCT REVIEWS
// -----------------------------------------------------------------------------
export async function getReviewsForProduct(productId: string): Promise<ProductReview[]> {
  if (db) return pg.getReviewsForProductPg(productId);
  const data = ensureDataFile();
  return data.reviews
    .filter((r) => r.productId === productId && r.isApproved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getReviewSummary(productId: string): Promise<{ average: number; count: number }> {
  if (db) return pg.getReviewSummaryPg(productId);
  const data = ensureDataFile();
  const approved = data.reviews.filter((r) => r.productId === productId && r.isApproved);
  if (approved.length === 0) return { average: 0, count: 0 };
  const average = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
  return { average: Math.round(average * 10) / 10, count: approved.length };
}

export async function addReview(review: {
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
}): Promise<ProductReview> {
  if (db) return pg.addReviewPg(review);
  const data = ensureDataFile();
  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: review.productId,
    customerName: review.customerName,
    rating: Math.max(1, Math.min(5, Math.round(review.rating))),
    comment: review.comment,
    createdAt: new Date().toISOString(),
    // Auto-approved for now (no moderation queue requested); admins can
    // still remove inappropriate reviews from /admin/reviews.
    isApproved: true,
  };
  data.reviews.unshift(newReview);
  saveData(data);
  return newReview;
}

export async function getAllReviewsAdmin(pagination?: { page?: number; pageSize?: number }): Promise<PaginatedResult<ProductReview>> {
  if (db) return pg.getAllReviewsAdminPg(pagination);
  const data = ensureDataFile();
  const sorted = [...data.reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return paginate(sorted, { page: pagination?.page ?? 1, pageSize: pagination?.pageSize ?? DEFAULT_PAGE_SIZE });
}

export async function deleteReview(id: string): Promise<boolean> {
  if (db) return pg.deleteReviewPg(id);
  const data = ensureDataFile();
  const before = data.reviews.length;
  data.reviews = data.reviews.filter((r) => r.id !== id);
  saveData(data);
  return data.reviews.length < before;
}

// -----------------------------------------------------------------------------
// COMPLAINTS
// -----------------------------------------------------------------------------
export async function createComplaint(complaint: {
  customerPhone: string;
  customerName?: string;
  description: string;
  imageUrl?: string;
}): Promise<Complaint> {
  const data = ensureDataFile();
  const newComplaint: Complaint = {
    id: `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customerPhone: complaint.customerPhone,
    customerName: complaint.customerName,
    description: complaint.description,
    imageUrl: complaint.imageUrl,
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };
  data.complaints.unshift(newComplaint);
  saveData(data);
  return newComplaint;
}

export async function getComplaints(): Promise<Complaint[]> {
  const data = ensureDataFile();
  return [...data.complaints].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateComplaintStatus(
  id: string,
  status: Complaint['status'],
  adminNotes?: string
): Promise<Complaint | null> {
  const data = ensureDataFile();
  const complaint = data.complaints.find((c) => c.id === id);
  if (!complaint) return null;
  complaint.status = status;
  if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
  saveData(data);
  return complaint;
}
