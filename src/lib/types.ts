export type PricingType = 'FIXED' | 'VARIANT' | 'PACKAGED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  bannerUrl?: string;
  sortOrder: number;
  isActive: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  bannerUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  isDefault?: boolean;
  sortOrder: number;
}

export interface CustomizationOption {
  id: string;
  stepId: string;
  name: string;
  priceModifier: number;
  isDefault?: boolean;
  sortOrder: number;
}

export interface CustomizationStep {
  id: string;
  productId: string;
  title: string;
  stepType: 'RADIO' | 'SELECT' | 'TEXT' | 'DATE';
  isRequired: boolean;
  sortOrder: number;
  options?: CustomizationOption[];
}

export interface Product {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  pricingType: PricingType;
  basePrice: number;
  packInfo?: string;
  images: string[];
  imageScale?: number;
  isCustomizable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isAvailable: boolean;
  sortOrder: number;
  /** Tracked inventory count. `undefined` (the default for every existing
   *  product) means "made-to-order / unlimited" — no stock check is ever
   *  applied to it. Only set this for items you actually want to run out
   *  (e.g. a limited-batch item) — see decrementStock() in src/db/store.ts. */
  stock?: number;
  tags?: string[];
  variants?: ProductVariant[];
  customizationSteps?: CustomizationStep[];
}

export interface CartCustomization {
  weight?: string;
  flavor?: string;
  message?: string;
  icingColor?: string;
  deliveryDate?: string;
  [key: string]: any;
}

export interface CartItem {
  id: string; // unique item id (productId + variantId + customizations hash)
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  variantId?: string;
  variantName?: string;
  specialInstructions?: string;
  isCustomized?: boolean;
  customizationDetails?: CartCustomization;
  requiresAdvance?: boolean;
}

export type PaymentMethod = 'COD' | 'ONLINE_CARD' | 'JAZZCASH' | 'EASYPAISA' | 'MEEZAN_BANK';
export type PaymentStatus = 'PENDING' | 'PENDING_VERIFICATION' | 'ADVANCE_PAID' | 'PAID' | 'FAILED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerTitle?: string;
  customerName: string;
  customerPhone: string;
  alternatePhone?: string;
  customerEmail?: string;
  orderType: 'DELIVERY' | 'PICKUP';
  deliveryAddress: string;
  nearestLandmark?: string;
  deliveryInstructions?: string;
  
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;

  containsCustomizedCake: boolean;
  advancePercentage: number;
  advanceRequired: number;
  advancePaid: number;
  balanceDue: number;
  advanceConfirmed: boolean;
  advanceConfirmedAt?: string;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  changeRequest?: string;

  orderStatus: OrderStatus;
  isViewedByAdmin: boolean;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productImage?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  specialInstructions?: string;
  isCustomized: boolean;
  customizationDetails?: CartCustomization;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  actionLink?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  isApproved: boolean;
}

export interface Complaint {
  id: string;
  customerPhone: string;
  customerName?: string;
  description: string;
  imageUrl?: string;
  status: 'NEW' | 'REVIEWED' | 'RESOLVED';
  adminNotes?: string;
  createdAt: string;
}

export interface StoreSettings {
  minOrderValue: number;
  taxPercentage: number;
  deliveryFee: number;
  additionalDeliveryFee: number;
  advancePercentage: number;
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  aboutText: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  // Payment Accounts & Bank Settings
  easypaisaTitle?: string;
  easypaisaNumber?: string;
  jazzcashTitle?: string;
  jazzcashNumber?: string;
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  paymentInstructions?: string;
}

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: string;
}
