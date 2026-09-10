import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rs. 0';
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateShort(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `AGB-${dateStr}-${randomNum}`;
}

// Fallback image for a product that has no photo of its own. Uses the
// product's own category/subcategory banner instead of a hardcoded image
// from another category — so a Fast Food item missing a photo never shows
// a cake, and vice versa. Falls back to a neutral generic placeholder only
// if no banner can be found at all.
const GENERIC_PLACEHOLDER = '/images/placeholder-product.svg';

// Strict category filter used by every dedicated category page (/cakes,
// /fast-food, /biscuits-cookies, /gift-essentials). Filters ONLY on
// categoryId (optionally narrowed further by subcategoryId) — never on
// isPopular/isFeatured. See SCALING.md → "Known past bugs" for why: an
// earlier version filtered loosely and let e.g. a popular sweet leak into
// the Fast Food page. Kept here as one shared, testable function so every
// dedicated page filters identically instead of re-implementing the same
// predicate (and risking it drifting per-page).
export function filterByCategory<T extends { categoryId?: string; subcategoryId?: string }>(
  products: T[],
  categoryId: string,
  subcategoryIds?: string[]
): T[] {
  return products.filter((p) => {
    if (p.categoryId !== categoryId) return false;
    if (subcategoryIds && subcategoryIds.length > 0) {
      return !!p.subcategoryId && subcategoryIds.includes(p.subcategoryId);
    }
    return true;
  });
}

export function getProductFallbackImage(
  categoryId: string | undefined,
  subcategoryId: string | undefined,
  categories: import('./types').Category[]
): string {
  const category = categories.find((c) => c.id === categoryId);
  const subcategory = category?.subcategories?.find((s) => s.id === subcategoryId);
  return subcategory?.bannerUrl || category?.bannerUrl || GENERIC_PLACEHOLDER;
}
