import { pgTable, varchar, text, integer, boolean, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// -----------------------------------------------------------------------------
// ADMINS TABLE
// -----------------------------------------------------------------------------
export const admins = pgTable('admins', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('ADMIN'), // SUPER_ADMIN, ADMIN, STAFF
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  // One-time password-reset token — only ever store its SHA-256 hash (see
  // src/lib/tokens.ts), never the plaintext.
  resetTokenHash: varchar('reset_token_hash', { length: 128 }),
  resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// CATEGORIES & SUBCATEGORIES
// -----------------------------------------------------------------------------
export const categories = pgTable('categories', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  icon: text('icon'), // Lucide icon identifier or image URL
  bannerUrl: text('banner_url'), // used as the image-fallback chain's category-level default (see src/lib/utils.ts getProductFallbackImage)
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subcategories = pgTable('subcategories', {
  id: varchar('id', { length: 64 }).primaryKey(),
  categoryId: varchar('category_id', { length: 64 }).references(() => categories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  bannerUrl: text('banner_url'), // subcategory-level fallback, takes priority over the category's
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// -----------------------------------------------------------------------------
// PRODUCTS & PRICING VARIANTS
// -----------------------------------------------------------------------------
export const products = pgTable('products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  categoryId: varchar('category_id', { length: 64 }).references(() => categories.id),
  subcategoryId: varchar('subcategory_id', { length: 64 }).references(() => subcategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  pricingType: varchar('pricing_type', { length: 32 }).notNull().default('FIXED'), // FIXED (Type A), VARIANT (Type B), PACKAGED (Type C)
  basePrice: doublePrecision('base_price').notNull().default(0),
  packInfo: varchar('pack_info', { length: 100 }), // e.g. "(24 PCS)", "1 Dozen"
  images: text('images').notNull(), // JSON array string of image paths
  imageScale: integer('image_scale').default(100).notNull(), // primary image display scale percentage
  isCustomizable: boolean('is_customizable').default(false).notNull(), // Section 7 multi-step configurator
  isFeatured: boolean('is_featured').default(false).notNull(),
  isPopular: boolean('is_popular').default(false).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  // NULL = made-to-order / unlimited stock (the default for almost every
  // product on this menu). Only items you want to be able to sell out
  // (e.g. a limited festive batch) should ever have this set. When set,
  // checkout must decrement it atomically — see
  // decrementStockAtomic() in src/db/store.ts and SCALING.md → "Race
  // condition prevention".
  stock: integer('stock'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productId: varchar('product_id', { length: 64 }).references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // e.g. "Small", "Medium", "Large", "250G", "500G", "1KG", "3 LBS"
  price: doublePrecision('price').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

// -----------------------------------------------------------------------------
// CUSTOMIZATION STEPS & OPTIONS (Customized Cake Flow)
// -----------------------------------------------------------------------------
export const customizationSteps = pgTable('customization_steps', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productId: varchar('product_id', { length: 64 }).references(() => products.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(), // e.g. "Choose Your Cake Weight", "Select Flavor"
  stepType: varchar('step_type', { length: 50 }).notNull(), // RADIO, SELECT, TEXT, DATE
  isRequired: boolean('is_required').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const customizationOptions = pgTable('customization_options', {
  id: varchar('id', { length: 64 }).primaryKey(),
  stepId: varchar('step_id', { length: 64 }).references(() => customizationSteps.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(), // e.g. "3 LBS", "Chocolate Fudge"
  priceModifier: doublePrecision('price_modifier').default(0).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

// -----------------------------------------------------------------------------
// ORDERS & ORDER ITEMS (Advance Payment & Order Management)
// -----------------------------------------------------------------------------
export const orders = pgTable('orders', {
  id: varchar('id', { length: 64 }).primaryKey(), // e.g. "AGB-20260905-101"
  customerTitle: varchar('customer_title', { length: 20 }), // Mr., Mrs., Ms.
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  alternatePhone: varchar('alternate_phone', { length: 50 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  orderType: varchar('order_type', { length: 50 }).default('DELIVERY').notNull(), // DELIVERY, PICKUP
  deliveryAddress: text('delivery_address').notNull(),
  nearestLandmark: text('nearest_landmark'),
  deliveryInstructions: text('delivery_instructions'),
  
  // Financial Calculations
  subtotal: doublePrecision('subtotal').notNull(),
  taxAmount: doublePrecision('tax_amount').default(0).notNull(), // 18% configurable
  deliveryFee: doublePrecision('delivery_fee').default(0).notNull(),
  discountAmount: doublePrecision('discount_amount').default(0).notNull(),
  grandTotal: doublePrecision('grand_total').notNull(),

  // Advance Payment Business Rule (Section 7.1)
  containsCustomizedCake: boolean('contains_customized_cake').default(false).notNull(),
  advancePercentage: doublePrecision('advance_percentage').default(30).notNull(),
  advanceRequired: doublePrecision('advance_required').default(0).notNull(),
  advancePaid: doublePrecision('advance_paid').default(0).notNull(),
  balanceDue: doublePrecision('balance_due').default(0).notNull(),
  advanceConfirmed: boolean('advance_confirmed').default(false).notNull(),
  advanceConfirmedAt: timestamp('advance_confirmed_at', { withTimezone: true }),

  // Payment Options
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // COD, ONLINE_CARD, JAZZCASH, EASYPAISA, MEEZAN_BANK
  paymentStatus: varchar('payment_status', { length: 50 }).default('PENDING').notNull(), // PENDING, ADVANCE_PAID, PAID, FAILED
  paymentReference: varchar('payment_reference', { length: 255 }),
  changeRequest: text('change_request'), // For COD e.g. "Need change for Rs. 5000"

  // Order Management Lifecycle
  orderStatus: varchar('order_status', { length: 50 }).default('PENDING').notNull(), // PENDING, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  isViewedByAdmin: boolean('is_viewed_by_admin').default(false).notNull(), // Triggers NEW badge
  internalNotes: text('internal_notes'), // Staff notes
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productImage: text('product_image'),
  variantName: varchar('variant_name', { length: 100 }),
  unitPrice: doublePrecision('unit_price').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  lineTotal: doublePrecision('line_total').notNull(),
  specialInstructions: text('special_instructions'),
  
  // Customization specifications
  isCustomized: boolean('is_customized').default(false).notNull(),
  customizationDetails: text('customization_details'), // JSON string: { weight: "3 LBS", flavor: "Chocolate Fudge", message: "...", deliveryDate: "..." }
});

// -----------------------------------------------------------------------------
// SETTINGS & HERO SLIDES
// -----------------------------------------------------------------------------
export const settings = pgTable('settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const heroSlides = pgTable('hero_slides', {
  id: varchar('id', { length: 64 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: text('subtitle'),
  imageUrl: text('image_url').notNull(),
  actionLink: text('action_link'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// -----------------------------------------------------------------------------
// PRODUCT REVIEWS
// -----------------------------------------------------------------------------
export const productReviews = pgTable('product_reviews', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productId: varchar('product_id', { length: 64 }).references(() => products.id, { onDelete: 'cascade' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment').notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
