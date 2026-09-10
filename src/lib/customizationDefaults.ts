import { CustomizationOption } from '@/lib/types';

// Default weight/flavor pricing for customized cakes that don't define their
// own `customizationSteps`. This is the single source of truth for custom
// cake pricing — it is imported by CustomizedCakeModal.tsx (for display) and
// by /api/orders (to independently recompute the price server-side, so a
// customer can never submit an arbitrary price for a customized cake).
export const DEFAULT_CAKE_WEIGHT_OPTIONS: CustomizationOption[] = [
  { id: 'w-3', stepId: 's-w', name: '3 LBS', priceModifier: 4200, sortOrder: 1 },
  { id: 'w-4', stepId: 's-w', name: '4 LBS', priceModifier: 5600, sortOrder: 2 },
  { id: 'w-5', stepId: 's-w', name: '5 LBS', priceModifier: 7000, sortOrder: 3 },
];

export const DEFAULT_CAKE_FLAVOR_OPTIONS: CustomizationOption[] = [
  { id: 'f-fudge', stepId: 's-f', name: 'Chocolate Fudge Royale', priceModifier: 0, sortOrder: 1 },
  { id: 'f-bf', stepId: 's-f', name: 'Black Forest Classic', priceModifier: 0, sortOrder: 2 },
  { id: 'f-lotus', stepId: 's-f', name: 'Lotus Biscoff Crunch', priceModifier: 0, sortOrder: 3 },
  { id: 'f-velvet', stepId: 's-f', name: 'Red Velvet Cream Cheese', priceModifier: 0, sortOrder: 4 },
  { id: 'f-vanilla', stepId: 's-f', name: 'Vanilla Buttercream', priceModifier: 0, sortOrder: 5 },
];
