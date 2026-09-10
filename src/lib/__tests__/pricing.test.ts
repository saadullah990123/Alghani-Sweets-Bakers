import { describe, it, expect } from 'vitest';
import { calculateSubtotal, calculateDiscount, calculateOrderTotals } from '../pricing';
import type { StoreSettings } from '../types';

const baseSettings: Pick<StoreSettings, 'taxPercentage' | 'deliveryFee' | 'advancePercentage'> = {
  taxPercentage: 18,
  deliveryFee: 150,
  advancePercentage: 30,
};

describe('calculateSubtotal (cart math)', () => {
  it('sums unitPrice * quantity across line items', () => {
    const subtotal = calculateSubtotal([
      { unitPrice: 500, quantity: 2 }, // 1000
      { unitPrice: 850, quantity: 1 }, // 850
    ]);
    expect(subtotal).toBe(1850);
  });

  it('returns 0 for an empty cart', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it('never trusts a pre-summed lineTotal — only unitPrice and quantity matter', () => {
    // Even if a caller's object happens to carry an extra (tampered)
    // lineTotal field, calculateSubtotal must ignore it and recompute.
    const items = [{ unitPrice: 100, quantity: 3, lineTotal: 99999 } as any];
    expect(calculateSubtotal(items)).toBe(300);
  });

  it('handles fractional quantities correctly rejected upstream, but sums whole numbers precisely', () => {
    const subtotal = calculateSubtotal([
      { unitPrice: 1200, quantity: 3 },
      { unitPrice: 4500, quantity: 1 },
      { unitPrice: 850, quantity: 2 },
    ]);
    expect(subtotal).toBe(3600 + 4500 + 1700);
  });
});

describe('calculateDiscount (voucher)', () => {
  const vouchers = { ALGHANI10: 10 };

  it('applies a percentage discount for a recognized code', () => {
    expect(calculateDiscount(1000, 'ALGHANI10', vouchers)).toBe(100);
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(calculateDiscount(1000, '  alghani10 ', vouchers)).toBe(100);
  });

  it('returns 0 for an unrecognized or tampered code', () => {
    expect(calculateDiscount(1000, 'FAKE50', vouchers)).toBe(0);
    expect(calculateDiscount(1000, 'ALGHANI99', vouchers)).toBe(0);
  });

  it('returns 0 when no code is supplied', () => {
    expect(calculateDiscount(1000, undefined, vouchers)).toBe(0);
    expect(calculateDiscount(1000, '', vouchers)).toBe(0);
  });

  it('rounds to the nearest rupee', () => {
    // 999 * 10% = 99.9 -> rounds to 100
    expect(calculateDiscount(999, 'ALGHANI10', vouchers)).toBe(100);
  });
});

describe('calculateOrderTotals (tax/delivery/advance)', () => {
  it('calculates tax, delivery fee, and grand total for a standard delivery order', () => {
    const totals = calculateOrderTotals({
      subtotal: 1000,
      settings: baseSettings,
      orderType: 'DELIVERY',
    });
    expect(totals.taxAmount).toBe(180); // 18% of 1000
    expect(totals.deliveryFee).toBe(150);
    expect(totals.discountAmount).toBe(0);
    expect(totals.grandTotal).toBe(1330); // 1000 + 180 + 150
    expect(totals.advanceRequired).toBe(0);
    expect(totals.balanceDue).toBe(1330);
  });

  it('waives the delivery fee entirely for pickup orders', () => {
    const totals = calculateOrderTotals({
      subtotal: 1000,
      settings: baseSettings,
      orderType: 'PICKUP',
    });
    expect(totals.deliveryFee).toBe(0);
    expect(totals.grandTotal).toBe(1180); // 1000 + 180 + 0
  });

  it('subtracts a discount before computing the grand total', () => {
    const totals = calculateOrderTotals({
      subtotal: 1000,
      settings: baseSettings,
      orderType: 'DELIVERY',
      discountAmount: 100,
    });
    expect(totals.grandTotal).toBe(1230); // 1000 + 180 + 150 - 100
  });

  it('never lets the grand total go negative even with an oversized discount', () => {
    const totals = calculateOrderTotals({
      subtotal: 100,
      settings: baseSettings,
      orderType: 'PICKUP',
      discountAmount: 99999,
    });
    expect(totals.grandTotal).toBe(0);
  });

  it('ignores a negative discountAmount rather than adding to the total', () => {
    const totals = calculateOrderTotals({
      subtotal: 1000,
      settings: baseSettings,
      orderType: 'PICKUP',
      discountAmount: -500,
    });
    // discountAmount is clamped to >= 0, so this must NOT increase the total
    expect(totals.grandTotal).toBe(1180); // 1000 + 180 + 0 - 0
  });

  it('requires an advance percentage of the grand total only when a customized cake is present', () => {
    const totals = calculateOrderTotals({
      subtotal: 5000,
      settings: baseSettings,
      orderType: 'DELIVERY',
      containsCustomizedCake: true,
    });
    // subtotal 5000 + tax 900 + delivery 150 = 6050 grand total
    expect(totals.grandTotal).toBe(6050);
    expect(totals.advanceRequired).toBe(Math.round(6050 * 0.3)); // 1815
    expect(totals.balanceDue).toBe(6050 - Math.round(6050 * 0.3));
  });

  it('requires no advance at all for a non-customized order', () => {
    const totals = calculateOrderTotals({
      subtotal: 5000,
      settings: baseSettings,
      orderType: 'DELIVERY',
      containsCustomizedCake: false,
    });
    expect(totals.advanceRequired).toBe(0);
    expect(totals.balanceDue).toBe(totals.grandTotal);
  });

  it('respects a custom advance percentage from settings', () => {
    const totals = calculateOrderTotals({
      subtotal: 10000,
      settings: { ...baseSettings, advancePercentage: 50 },
      orderType: 'PICKUP',
      containsCustomizedCake: true,
    });
    // grand total = 10000 + 1800 + 0 = 11800
    expect(totals.advanceRequired).toBe(5900);
    expect(totals.balanceDue).toBe(5900);
  });

  it('handles a zero tax percentage without dividing by zero or erroring', () => {
    const totals = calculateOrderTotals({
      subtotal: 500,
      settings: { ...baseSettings, taxPercentage: 0 },
      orderType: 'PICKUP',
    });
    expect(totals.taxAmount).toBe(0);
    expect(totals.grandTotal).toBe(500);
  });
});
