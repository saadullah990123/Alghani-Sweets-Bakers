import { StoreSettings } from './types';

// -----------------------------------------------------------------------------
// PRICING — single source of truth for every money calculation at checkout.
// -----------------------------------------------------------------------------
// Extracted out of `src/app/api/orders/route.ts` so it can be unit tested in
// isolation (see `src/lib/__tests__/pricing.test.ts`) without spinning up a
// Next.js request. Per SCALING.md → "Testing strategy", checkout pricing is
// the single highest-leverage thing to test on a site handling real money —
// a bug here directly costs the business or the customer cash.
//
// IMPORTANT: this module must stay a pure function of its inputs. It must
// NEVER read `Date.now()`, environment variables, or trust anything the
// client sent directly — the caller (the API route) is responsible for
// re-deriving `subtotal` from the verified, server-side product catalog
// before calling this.

export interface OrderLineItem {
  unitPrice: number;
  quantity: number;
}

export interface VoucherTable {
  [code: string]: number; // percent off subtotal
}

export interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
  advanceRequired: number;
  balanceDue: number;
}

/** Cart math: sum of unitPrice * quantity across verified line items. Never
 *  trusts a client-submitted lineTotal — always recomputed from unit price
 *  and quantity so a tampered lineTotal can never slip through. */
export function calculateSubtotal(items: OrderLineItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/** Resolves a voucher code against the server-side voucher table. Returns 0
 *  for any code not in the table — an unrecognized/expired/tampered code
 *  never produces a discount. */
export function calculateDiscount(subtotal: number, voucherCode: string | undefined, voucherTable: VoucherTable): number {
  const code = (voucherCode || '').trim().toUpperCase();
  if (!code || !voucherTable[code]) return 0;
  return Math.round(subtotal * (voucherTable[code] / 100));
}

/**
 * Computes every order total server-side from a verified subtotal + store
 * settings. This is the exact calculation `POST /api/orders` uses so that a
 * client can never submit its own tax/delivery/total and have it trusted.
 */
export function calculateOrderTotals(params: {
  subtotal: number;
  settings: Pick<StoreSettings, 'taxPercentage' | 'deliveryFee' | 'advancePercentage'>;
  orderType: 'DELIVERY' | 'PICKUP';
  discountAmount?: number;
  containsCustomizedCake?: boolean;
}): OrderTotals {
  const { subtotal, settings, orderType, containsCustomizedCake = false } = params;
  const discountAmount = Math.max(0, params.discountAmount || 0);

  const taxAmount = Math.round(subtotal * (settings.taxPercentage / 100));
  const deliveryFee = orderType === 'PICKUP' ? 0 : settings.deliveryFee;
  const grandTotal = Math.max(0, subtotal + taxAmount + deliveryFee - discountAmount);

  const advancePercentage = settings.advancePercentage;
  const advanceRequired = containsCustomizedCake ? Math.round((grandTotal * advancePercentage) / 100) : 0;
  const balanceDue = containsCustomizedCake ? grandTotal - advanceRequired : grandTotal;

  return { subtotal, taxAmount, deliveryFee, discountAmount, grandTotal, advanceRequired, balanceDue };
}
