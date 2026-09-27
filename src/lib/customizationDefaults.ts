import { CustomizationOption, Product } from '@/lib/types';

/**
 * Parses numeric weight in LBS from a variant or option name (e.g., "3 LBS" -> 3, "4.5 lbs" -> 4.5).
 * Returns null if no numeric weight pattern is detected.
 */
export function parseWeightLbs(name: string): number | null {
  if (!name) return null;
  const match = name.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pound|lb)/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Filters customization options / variants to enforce a minimum order requirement of 3 LBS.
 * Options without an explicit weight string in their name are retained.
 */
export function filterWeightOptionsMin3Lb(options: CustomizationOption[]): CustomizationOption[] {
  return options.filter((opt) => {
    const lbs = parseWeightLbs(opt.name);
    if (lbs !== null && lbs < 3) {
      return false; // Exclude anything below 3 LBS
    }
    return true;
  });
}

/**
 * Single source of truth for weight options for Customized Cakes.
 * Priority order:
 * 1. Admin-configured product.variants (dynamically mapped with exact variant prices)
 * 2. Admin-configured product.customizationSteps
 * 3. Dynamic fallback starting at 3 LBS based on product.basePrice
 */
export function getWeightOptionsForProduct(product: Product): CustomizationOption[] {
  // 1. Admin-configured product.variants
  if (product.variants && product.variants.length > 0) {
    const mapped: CustomizationOption[] = product.variants.map((v, idx) => ({
      id: v.id,
      stepId: 's-w',
      name: v.name,
      priceModifier: v.price,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder || idx + 1,
    }));
    const filtered = filterWeightOptionsMin3Lb(mapped);
    const optionsToUse = filtered.length > 0 ? filtered : mapped;

    optionsToUse.sort((a, b) => {
      const weightA = parseWeightLbs(a.name) ?? Infinity;
      const weightB = parseWeightLbs(b.name) ?? Infinity;
      if (weightA !== weightB) return weightA - weightB;
      return a.priceModifier - b.priceModifier;
    });
    return optionsToUse;
  }

  // 2. Admin-configured product.customizationSteps
  const weightStep = product.customizationSteps?.find(
    (s) => s.stepType === 'RADIO' && s.title.toLowerCase().includes('weight')
  );
  if (weightStep?.options && weightStep.options.length > 0) {
    const filtered = filterWeightOptionsMin3Lb(weightStep.options);
    if (filtered.length > 0) {
      return filtered;
    }
  }

  // 3. Dynamic fallback starting at 3 LBS using product.basePrice (or fallback starting price)
  const basePrice = Math.max(product.basePrice || 3500, 100);
  return [
    { id: 'w-3', stepId: 's-w', name: '3 LBS', priceModifier: basePrice, sortOrder: 1, isDefault: true },
    { id: 'w-4', stepId: 's-w', name: '4 LBS', priceModifier: Math.round(basePrice * (4 / 3)), sortOrder: 2 },
    { id: 'w-5', stepId: 's-w', name: '5 LBS', priceModifier: Math.round(basePrice * (5 / 3)), sortOrder: 3 },
  ];
}

export const DEFAULT_CAKE_WEIGHT_OPTIONS: CustomizationOption[] = [
  { id: 'w-3', stepId: 's-w', name: '3 LBS', priceModifier: 4200, sortOrder: 1, isDefault: true },
  { id: 'w-4', stepId: 's-w', name: '4 LBS', priceModifier: 5600, sortOrder: 2 },
  { id: 'w-5', stepId: 's-w', name: '5 LBS', priceModifier: 7000, sortOrder: 3 },
];

export const DEFAULT_CAKE_FLAVOR_OPTIONS: CustomizationOption[] = [
  { id: 'f-fudge', stepId: 's-f', name: 'Chocolate Fudge Royale', priceModifier: 0, sortOrder: 1, isDefault: true },
  { id: 'f-bf', stepId: 's-f', name: 'Black Forest Classic', priceModifier: 0, sortOrder: 2 },
  { id: 'f-lotus', stepId: 's-f', name: 'Lotus Biscoff Crunch', priceModifier: 0, sortOrder: 3 },
  { id: 'f-velvet', stepId: 's-f', name: 'Red Velvet Cream Cheese', priceModifier: 0, sortOrder: 4 },
  { id: 'f-vanilla', stepId: 's-f', name: 'Vanilla Buttercream', priceModifier: 0, sortOrder: 5 },
];