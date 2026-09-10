import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
import { sql } from 'drizzle-orm';
import type { StoreData } from '../src/db/store';

async function main() {
  const { db } = await import('../src/db/client');
  const schema = await import('../src/db/schema');
  if (!db) {
    console.error('DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  const dataFile = path.join(process.cwd(), '.data', 'store.json');
  if (!fs.existsSync(dataFile)) {
    console.error(`No JSON store found at ${dataFile}.`);
    process.exit(1);
  }
  const data: StoreData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  // 1. Categories
  console.log(`Migrating ${data.categories.length} categories...`);
  const catValues = data.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    bannerUrl: cat.bannerUrl,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
  }));
  if (catValues.length > 0) {
    await db
      .insert(schema.categories)
      .values(catValues)
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          name: sql`EXCLUDED.name`,
          slug: sql`EXCLUDED.slug`,
          icon: sql`EXCLUDED.icon`,
          bannerUrl: sql`EXCLUDED.banner_url`,
          sortOrder: sql`EXCLUDED.sort_order`,
          isActive: sql`EXCLUDED.is_active`,
        },
      });
  }

  // 1b. Subcategories
  const subValues = data.categories.flatMap((cat) =>
    (cat.subcategories || []).map((sub) => ({
      id: sub.id,
      categoryId: cat.id,
      name: sub.name,
      slug: sub.slug,
      bannerUrl: sub.bannerUrl,
      sortOrder: sub.sortOrder,
      isActive: sub.isActive,
    }))
  );
  if (subValues.length > 0) {
    await db
      .insert(schema.subcategories)
      .values(subValues)
      .onConflictDoUpdate({
        target: schema.subcategories.id,
        set: {
          name: sql`EXCLUDED.name`,
          slug: sql`EXCLUDED.slug`,
          bannerUrl: sql`EXCLUDED.banner_url`,
          sortOrder: sql`EXCLUDED.sort_order`,
          isActive: sql`EXCLUDED.is_active`,
        },
      });
  }

  // 2. Products (in chunks of 25 to stay well under query size limits)
  console.log(`Migrating ${data.products.length} products...`);
  const prodValues = data.products.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    subcategoryId: p.subcategoryId,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    pricingType: p.pricingType,
    basePrice: p.basePrice,
    packInfo: p.packInfo,
    images: JSON.stringify(p.images),
    imageScale: p.imageScale ?? 100,
    isCustomizable: p.isCustomizable,
    isFeatured: p.isFeatured,
    isPopular: p.isPopular,
    isAvailable: p.isAvailable,
    sortOrder: p.sortOrder,
    stock: p.stock ?? null,
  }));

  const CHUNK_SIZE = 25;
  for (let i = 0; i < prodValues.length; i += CHUNK_SIZE) {
    const chunk = prodValues.slice(i, i + CHUNK_SIZE);
    await db
      .insert(schema.products)
      .values(chunk)
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          name: sql`EXCLUDED.name`,
          basePrice: sql`EXCLUDED.base_price`,
          images: sql`EXCLUDED.images`,
          imageScale: sql`EXCLUDED.image_scale`,
          isAvailable: sql`EXCLUDED.is_available`,
          stock: sql`EXCLUDED.stock`,
        },
      });
  }

  // 2b. Product Variants
  const variantValues = data.products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      id: v.id,
      productId: p.id,
      name: v.name,
      price: v.price,
      isDefault: v.isDefault ?? false,
      sortOrder: v.sortOrder,
    }))
  );
  for (let i = 0; i < variantValues.length; i += CHUNK_SIZE * 2) {
    const chunk = variantValues.slice(i, i + CHUNK_SIZE * 2);
    await db
      .insert(schema.productVariants)
      .values(chunk)
      .onConflictDoUpdate({
        target: schema.productVariants.id,
        set: {
          name: sql`EXCLUDED.name`,
          price: sql`EXCLUDED.price`,
          isDefault: sql`EXCLUDED.is_default`,
          sortOrder: sql`EXCLUDED.sort_order`,
        },
      });
  }

  // 3. Settings
  console.log('Migrating settings...');
  await db
    .insert(schema.settings)
    .values({ key: 'store_settings', value: JSON.stringify(data.settings), updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: JSON.stringify(data.settings), updatedAt: new Date() } });

  const validProductIds = new Set(data.products.map((p) => p.id));

  // 4. Historical Orders
  console.log(`Migrating ${data.orders.length} orders...`);
  for (const o of data.orders) {
    await db
      .insert(schema.orders)
      .values({
        id: o.id,
        customerTitle: o.customerTitle,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        alternatePhone: o.alternatePhone,
        customerEmail: o.customerEmail,
        orderType: o.orderType,
        deliveryAddress: o.deliveryAddress,
        nearestLandmark: o.nearestLandmark,
        deliveryInstructions: o.deliveryInstructions,
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
        advanceConfirmedAt: o.advanceConfirmedAt ? new Date(o.advanceConfirmedAt) : undefined,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        paymentReference: o.paymentReference,
        changeRequest: o.changeRequest,
        orderStatus: o.orderStatus,
        isViewedByAdmin: o.isViewedByAdmin,
        internalNotes: o.internalNotes,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
      })
      .onConflictDoNothing({ target: schema.orders.id });

    if (o.items && o.items.length > 0) {
      const itemValues = o.items.map((item) => ({
        id: item.id,
        orderId: o.id,
        productId: item.productId && validProductIds.has(item.productId) ? item.productId : null,
        productName: item.productName,
        productImage: item.productImage,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        specialInstructions: item.specialInstructions,
        isCustomized: item.isCustomized,
        customizationDetails: item.customizationDetails ? JSON.stringify(item.customizationDetails) : undefined,
      }));
      await db.insert(schema.orderItems).values(itemValues).onConflictDoNothing({ target: schema.orderItems.id });
    }
  }

  // 5. Admins
  console.log(`Migrating ${data.admins.length} admins...`);
  const adminValues = data.admins.map((a) => ({
    id: a.id,
    email: a.email,
    passwordHash: a.passwordHash,
    name: a.name,
    role: a.role,
    isActive: a.isActive,
    lastLoginAt: a.lastLoginAt ? new Date(a.lastLoginAt) : undefined,
    resetTokenHash: a.resetTokenHash,
    resetTokenExpiresAt: a.resetTokenExpiresAt ? new Date(a.resetTokenExpiresAt) : undefined,
  }));
  if (adminValues.length > 0) {
    await db
      .insert(schema.admins)
      .values(adminValues)
      .onConflictDoUpdate({
        target: schema.admins.id,
        set: {
          passwordHash: sql`EXCLUDED.password_hash`,
          name: sql`EXCLUDED.name`,
          role: sql`EXCLUDED.role`,
          isActive: sql`EXCLUDED.is_active`,
        },
      });
  }

  // 6. Hero slides
  console.log(`Migrating ${data.heroSlides.length} hero slides...`);
  const slideValues = data.heroSlides.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    imageUrl: s.imageUrl,
    actionLink: s.actionLink,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
  }));
  if (slideValues.length > 0) {
    await db
      .insert(schema.heroSlides)
      .values(slideValues)
      .onConflictDoUpdate({
        target: schema.heroSlides.id,
        set: {
          title: sql`EXCLUDED.title`,
          subtitle: sql`EXCLUDED.subtitle`,
          imageUrl: sql`EXCLUDED.image_url`,
          actionLink: sql`EXCLUDED.action_link`,
          sortOrder: sql`EXCLUDED.sort_order`,
          isActive: sql`EXCLUDED.is_active`,
        },
      });
  }

  // 7. Product reviews
  if (data.reviews && data.reviews.length > 0) {
    console.log(`Migrating ${data.reviews.length} reviews...`);
    const reviewValues = data.reviews.map((r) => ({
      id: r.id,
      productId: r.productId && validProductIds.has(r.productId) ? r.productId : null,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.isApproved,
      createdAt: new Date(r.createdAt),
    }));
    await db.insert(schema.productReviews).values(reviewValues).onConflictDoNothing({ target: schema.productReviews.id });
  }

  console.log('✅ Migration complete! All data copied to Supabase successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
