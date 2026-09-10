import { describe, it, expect } from 'vitest';
import { filterByCategory } from '../utils';
import { initialProducts } from '../../db/seed-data';

interface TestProduct {
  id: string;
  categoryId?: string;
  subcategoryId?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
}

const sample: TestProduct[] = [
  { id: 'a', categoryId: 'cakes', subcategoryId: 'sub-classic-cakes' },
  { id: 'b', categoryId: 'cakes', subcategoryId: 'sub-dry-cakes' },
  { id: 'c', categoryId: 'sweets', subcategoryId: 'sub-traditional-sweets', isPopular: true },
  { id: 'd', categoryId: 'fast-food', subcategoryId: 'sub-pizza', isFeatured: true },
];

describe('filterByCategory', () => {
  it('only returns products with the exact categoryId requested', () => {
    const result = filterByCategory(sample, 'cakes');
    expect(result.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('further narrows by subcategoryId when a list is provided', () => {
    const result = filterByCategory(sample, 'cakes', ['sub-dry-cakes']);
    expect(result.map((p) => p.id)).toEqual(['b']);
  });

  it('never lets a popular/featured product from another category leak in', () => {
    // Regression test for the exact bug described in SCALING.md → "Known
    // past bugs": isPopular/isFeatured must never act as a fallback filter.
    const result = filterByCategory(sample, 'cakes');
    expect(result.some((p) => p.id === 'c')).toBe(false); // popular sweet
    expect(result.some((p) => p.id === 'd')).toBe(false); // featured fast-food
  });

  it('returns an empty array for a categoryId with no matches', () => {
    expect(filterByCategory(sample, 'nonexistent-category')).toEqual([]);
  });
});

describe('dedicated category pages — real seed data leakage guard', () => {
  // Mirrors the exact filters used in src/app/cakes/page.tsx,
  // /fast-food/page.tsx, /biscuits-cookies/page.tsx, and
  // /gift-essentials/page.tsx. If a product is ever miscategorized in
  // seed-data.ts (or a future edit loosens a filter back to
  // isPopular/isFeatured), one of these assertions fails.
  const pages: { categoryId: string; subcategoryIds: string[] }[] = [
    { categoryId: 'cakes', subcategoryIds: ['sub-classic-cakes', 'sub-premium-cakes', 'sub-dry-cakes', 'sub-dream-cakes'] },
    { categoryId: 'fast-food', subcategoryIds: ['sub-sandwiches', 'sub-wraps', 'sub-burgers', 'sub-pizza', 'sub-sides'] },
    { categoryId: 'biscuits', subcategoryIds: ['sub-fresh-biscuits', 'sub-special-cookies'] },
    { categoryId: 'deals-treasure', subcategoryIds: ['sub-gift-hampers', 'sub-sweet-boxes', 'sub-combo-deals', 'sub-tea-deals'] },
  ];

  it.each(pages)('every product shown on the $categoryId page actually has that categoryId', ({ categoryId, subcategoryIds }) => {
    const shown = filterByCategory(initialProducts, categoryId, subcategoryIds);
    for (const product of shown) {
      expect(product.categoryId).toBe(categoryId);
    }
  });

  it('the /cakes page never shows a Traditional Sweets/Mithai item', () => {
    const shown = filterByCategory(initialProducts, 'cakes', [
      'sub-classic-cakes',
      'sub-premium-cakes',
      'sub-dry-cakes',
      'sub-dream-cakes',
    ]);
    const mithaiNames = ['gulab jamun', 'cham cham', 'barfi'];
    for (const product of shown) {
      const nameLower = product.name.toLowerCase();
      expect(mithaiNames.some((m) => nameLower.includes(m))).toBe(false);
    }
  });

  it('no product appears on more than one of the four dedicated category pages', () => {
    const seen = new Map<string, string>();
    for (const { categoryId, subcategoryIds } of pages) {
      for (const product of filterByCategory(initialProducts, categoryId, subcategoryIds)) {
        const prior = seen.get(product.id);
        expect(prior, `product ${product.id} appeared on both ${prior} and ${categoryId}`).toBeUndefined();
        seen.set(product.id, categoryId);
      }
    }
  });
});
