import { describe, it, expect } from 'vitest';
import { applyStockDecrement, StockRecord } from '../stock';

function makeProducts(): StockRecord[] {
  return [
    { id: 'p-tracked', name: 'Limited Eid Special Cake', stock: 5 },
    { id: 'p-unlimited', name: 'Classic Sponge Cake', stock: undefined },
    { id: 'p-zero', name: 'Sold Out Item', stock: 0 },
  ];
}

describe('applyStockDecrement', () => {
  it('decrements a tracked product with enough stock', () => {
    const products = makeProducts();
    const result = applyStockDecrement(products, [{ productId: 'p-tracked', quantity: 2 }]);
    expect(result.success).toBe(true);
    expect(products.find((p) => p.id === 'p-tracked')!.stock).toBe(3);
  });

  it('never touches stock for an untracked (made-to-order) product', () => {
    const products = makeProducts();
    const result = applyStockDecrement(products, [{ productId: 'p-unlimited', quantity: 1000 }]);
    expect(result.success).toBe(true);
    expect(products.find((p) => p.id === 'p-unlimited')!.stock).toBeUndefined();
  });

  it('fails when the requested quantity exceeds available stock', () => {
    const products = makeProducts();
    const result = applyStockDecrement(products, [{ productId: 'p-tracked', quantity: 6 }]);
    expect(result.success).toBe(false);
    // Failure must leave stock completely untouched.
    expect(products.find((p) => p.id === 'p-tracked')!.stock).toBe(5);
  });

  it('fails immediately for a sold-out (stock: 0) product', () => {
    const products = makeProducts();
    const result = applyStockDecrement(products, [{ productId: 'p-zero', quantity: 1 }]);
    expect(result.success).toBe(false);
  });

  it('fails for an unknown productId without throwing', () => {
    const products = makeProducts();
    const result = applyStockDecrement(products, [{ productId: 'does-not-exist', quantity: 1 }]);
    expect(result.success).toBe(false);
  });

  it('never partially commits: if ANY item in the order fails, NONE are decremented', () => {
    const products = makeProducts();
    const result = applyStockDecrement(products, [
      { productId: 'p-tracked', quantity: 2 }, // would succeed alone
      { productId: 'p-zero', quantity: 1 }, // fails -> whole batch must fail
    ]);
    expect(result.success).toBe(false);
    // p-tracked must be untouched even though its own check passed —
    // this is the exact bug class ("check both, but only roll back one")
    // that leads to a negative-stock / oversold race under concurrency.
    expect(products.find((p) => p.id === 'p-tracked')!.stock).toBe(5);
  });

  it('handles two different line items for the same tracked product by treating quantities independently', () => {
    // Mirrors a cart with the same product added as two separate line items
    // (e.g. different customization notes) — both draw from the same pool.
    const products = makeProducts();
    const result = applyStockDecrement(products, [
      { productId: 'p-tracked', quantity: 3 },
      { productId: 'p-tracked', quantity: 2 },
    ]);
    expect(result.success).toBe(true);
    expect(products.find((p) => p.id === 'p-tracked')!.stock).toBe(0);
  });

  it('simulates two concurrent checkouts racing for the last unit — only one may succeed', () => {
    // Because applyStockDecrement is synchronous end-to-end, "concurrency"
    // here just means calling it twice in a row against the same array
    // before either commits elsewhere — which is exactly the guarantee
    // Node's single-threaded execution gives store.ts's decrementStock().
    const products: StockRecord[] = [{ id: 'p-last-one', name: 'Last Slice', stock: 1 }];

    const first = applyStockDecrement(products, [{ productId: 'p-last-one', quantity: 1 }]);
    const second = applyStockDecrement(products, [{ productId: 'p-last-one', quantity: 1 }]);

    expect(first.success).toBe(true);
    expect(second.success).toBe(false); // must NOT go negative
    expect(products.find((p) => p.id === 'p-last-one')!.stock).toBe(0);
  });
});
