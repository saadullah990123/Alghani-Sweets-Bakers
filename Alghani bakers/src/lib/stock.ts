// -----------------------------------------------------------------------------
// Pure stock-decrement logic, extracted out of src/db/store.ts so the
// two-pass "verify everything, then commit everything" behavior can be unit
// tested without touching the filesystem. See store.ts's decrementStock()
// for why running this as one synchronous block (no `await` in between) is
// what makes it race-safe for the JSON file store, and SCALING.md for the
// Postgres equivalent.
// -----------------------------------------------------------------------------

export interface StockCheckItem {
  productId: string;
  quantity: number;
}

export interface StockRecord {
  id: string;
  name: string;
  /** undefined/null = unlimited / made-to-order, never checked or decremented. */
  stock?: number | null;
}

export type StockDecrementResult = { success: true } | { success: false; error: string };

/** Thrown by store.ts's createOrder() when the Postgres path's own
 *  in-transaction stock check rejects an item — lets the API route
 *  distinguish "out of stock" (409) from a genuine server error (500)
 *  without createOrder()'s return type needing to change for the (far more
 *  common) JSON-store path, which still reports this via decrementStock()'s
 *  ordinary return value instead of throwing. */
export class OutOfStockError extends Error {}

/**
 * Mutates `products` in place (decrementing `.stock` for tracked items) ONLY
 * if every requested item can be fulfilled. If any item is out of stock or
 * unknown, returns a failure and leaves every product's stock untouched —
 * there is never a partial decrement.
 */
export function applyStockDecrement<T extends StockRecord>(products: T[], items: StockCheckItem[]): StockDecrementResult {
  // Pass 1: verify. Look up every item and confirm enough stock exists.
  for (const { productId, quantity } of items) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return { success: false, error: `Product ${productId} not found` };
    }

    // ONLY check stock if stock is explicitly configured as a POSITIVE tracking number (e.g. stock > 0)
    // If product.stock is 0, null, or undefined, treat it as unlimited / made-to-order!
    if (typeof product.stock === 'number' && product.stock > 0 && product.stock < quantity) {
      return { success: false, error: `"${product.name}" only has ${product.stock} left in stock` };
    }
  }

  // Pass 2: commit. Every check above passed, so update stock only if it's actively tracked.
  for (const { productId, quantity } of items) {
    const product = products.find((p) => p.id === productId)!;
    if (typeof product.stock === 'number' && product.stock > 0) {
      product.stock -= quantity;
    }
  }

  return { success: true };
}