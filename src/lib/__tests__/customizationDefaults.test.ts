import { describe, it, expect } from 'vitest';
import {
  parseWeightLbs,
  filterWeightOptionsMin3Lb,
  getWeightOptionsForProduct,
} from '../customizationDefaults';
import type { Product } from '../types';

describe('parseWeightLbs', () => {
  it('correctly parses weight in LBS from variant names', () => {
    expect(parseWeightLbs('3 LBS')).toBe(3);
    expect(parseWeightLbs('4 lbs')).toBe(4);
    expect(parseWeightLbs('5.5 LB')).toBe(5.5);
    expect(parseWeightLbs('8 LBS - Extra Large')).toBe(8);
  });

  it('returns null for names without an explicit weight in LBS', () => {
    expect(parseWeightLbs('Standard Box')).toBeNull();
    expect(parseWeightLbs('Royal Cake')).toBeNull();
  });
});

describe('filterWeightOptionsMin3Lb', () => {
  it('filters out weight options below 3 LBS', () => {
    const options = [
      { id: 'w-1', stepId: 's-w', name: '1 LB', priceModifier: 1500, sortOrder: 1 },
      { id: 'w-2', stepId: 's-w', name: '2 LBS', priceModifier: 3000, sortOrder: 2 },
      { id: 'w-3', stepId: 's-w', name: '3 LBS', priceModifier: 4500, sortOrder: 3 },
      { id: 'w-4', stepId: 's-w', name: '4 LBS', priceModifier: 6000, sortOrder: 4 },
    ];
    const filtered = filterWeightOptionsMin3Lb(options);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((o) => o.name)).toEqual(['3 LBS', '4 LBS']);
  });
});

describe('getWeightOptionsForProduct', () => {
  it('pulls dynamic variant options and prices directly from product.variants', () => {
    const product: Product = {
      id: 'custom-nikkah-cake',
      categoryId: 'customized-cakes',
      name: 'Nikkah Cake',
      slug: 'nikkah-cake',
      pricingType: 'VARIANT',
      basePrice: 4500,
      images: ['/images/nikkah.jpg'],
      isCustomizable: true,
      isFeatured: true,
      isPopular: true,
      isAvailable: true,
      sortOrder: 1,
      variants: [
        { id: 'v-3lb', productId: 'custom-nikkah-cake', name: '3 LBS', price: 4500, isDefault: true, sortOrder: 1 },
        { id: 'v-4lb', productId: 'custom-nikkah-cake', name: '4 LBS', price: 6000, sortOrder: 2 },
        { id: 'v-8lb', productId: 'custom-nikkah-cake', name: '8 LBS', price: 11000, sortOrder: 3 },
      ],
    };

    const weightOpts = getWeightOptionsForProduct(product);
    expect(weightOpts).toHaveLength(3);
    expect(weightOpts[0]).toMatchObject({ id: 'v-3lb', name: '3 LBS', priceModifier: 4500 });
    expect(weightOpts[1]).toMatchObject({ id: 'v-4lb', name: '4 LBS', priceModifier: 6000 });
    expect(weightOpts[2]).toMatchObject({ id: 'v-8lb', name: '8 LBS', priceModifier: 11000 });
  });

  it('filters out variants under 3 LBS if an admin configured 1 LB or 2 LBS', () => {
    const product: Product = {
      id: 'custom-small-cake',
      categoryId: 'customized-cakes',
      name: 'Small Custom Cake',
      slug: 'small-custom-cake',
      pricingType: 'VARIANT',
      basePrice: 4000,
      images: ['/images/small.jpg'],
      isCustomizable: true,
      isFeatured: false,
      isPopular: false,
      isAvailable: true,
      sortOrder: 1,
      variants: [
        { id: 'v-2lb', productId: 'custom-small-cake', name: '2 LBS', price: 2800, sortOrder: 1 },
        { id: 'v-3lb', productId: 'custom-small-cake', name: '3 LBS', price: 4000, sortOrder: 2 },
        { id: 'v-5lb', productId: 'custom-small-cake', name: '5 LBS', price: 6500, sortOrder: 3 },
      ],
    };

    const weightOpts = getWeightOptionsForProduct(product);
    expect(weightOpts).toHaveLength(2);
    expect(weightOpts.map((o) => o.name)).toEqual(['3 LBS', '5 LBS']);
    expect(weightOpts[0].priceModifier).toBe(4000);
  });
});
