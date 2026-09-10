'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CartItem, CartCustomization } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  grandTotal: number;
  containsCustomizedCake: boolean;
  advancePercentage: number;
  advanceRequired: number;
  balanceDue: number;
  minOrderValue: number;
  minOrderRemaining: number;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
  /** Sum of quantities already in the cart for a given productId, across
   *  every variant/customization. Purely a read of local state — used for
   *  optimistic, client-only "only N left" stock UI (see ProductCard) so a
   *  shopper never has to wait on a network round trip to see it. */
  getQuantityInCart: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TAX_RATE = 0.18; // 18% Tax
const BASE_DELIVERY_FEE = 150;
const MIN_ORDER_VALUE = 500;
const ADVANCE_PERCENTAGE = 30;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alghani_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('alghani_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [items, isHydrated]);

  const addItem = (newItem: Omit<CartItem, 'id' | 'lineTotal'>) => {
    // Generate a unique ID based on product, variant, and customized details
    const customKey = newItem.customizationDetails
      ? JSON.stringify(newItem.customizationDetails)
      : '';
    const uniqueId = `${newItem.productId}-${newItem.variantId || 'base'}-${encodeURIComponent(customKey)}`;

    setItems(prevItems => {
      const existingIdx = prevItems.findIndex(i => i.id === uniqueId);
      if (existingIdx >= 0) {
        const updated = [...prevItems];
        const current = updated[existingIdx];
        const newQty = current.quantity + (newItem.quantity || 1);
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          lineTotal: current.unitPrice * newQty,
          specialInstructions: newItem.specialInstructions || current.specialInstructions,
        };
        return updated;
      } else {
        const qty = newItem.quantity || 1;
        return [
          ...prevItems,
          {
            ...newItem,
            id: uniqueId,
            quantity: qty,
            lineTotal: newItem.unitPrice * qty,
          }
        ];
      }
    });

    // Auto open cart drawer
    setIsCartDrawerOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prevItems => {
      return prevItems
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculations
  const totalItemsCount = useMemo(() => {
    return items.reduce((acc, i) => acc + i.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, i) => acc + i.lineTotal, 0);
  }, [items]);

  const containsCustomizedCake = useMemo(() => {
    return items.some(i => i.requiresAdvance || i.isCustomized);
  }, [items]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * TAX_RATE);
  }, [subtotal]);

  const deliveryFee = useMemo(() => {
    return items.length > 0 ? BASE_DELIVERY_FEE : 0;
  }, [items]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount + deliveryFee;
  }, [subtotal, taxAmount, deliveryFee]);

  const advanceRequired = useMemo(() => {
    if (!containsCustomizedCake) return 0;
    // Section 7.1 rule: 30% of grand total
    return Math.round((grandTotal * ADVANCE_PERCENTAGE) / 100);
  }, [containsCustomizedCake, grandTotal]);

  const balanceDue = useMemo(() => {
    if (!containsCustomizedCake) return grandTotal;
    return grandTotal - advanceRequired;
  }, [containsCustomizedCake, grandTotal, advanceRequired]);

  const minOrderRemaining = useMemo(() => {
    return Math.max(0, MIN_ORDER_VALUE - subtotal);
  }, [subtotal]);

  const getQuantityInCart = (productId: string): number => {
    return items.filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItemsCount,
        subtotal,
        taxAmount,
        deliveryFee,
        grandTotal,
        containsCustomizedCake,
        advancePercentage: ADVANCE_PERCENTAGE,
        advanceRequired,
        balanceDue,
        minOrderValue: MIN_ORDER_VALUE,
        minOrderRemaining,
        isCartDrawerOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        toggleCartDrawer: () => setIsCartDrawerOpen(prev => !prev),
        getQuantityInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
