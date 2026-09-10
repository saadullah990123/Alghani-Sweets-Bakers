'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/utils';
import ProductImage from '@/components/product/ProductImage';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const upsellProducts = [
  {
    id: 'sweets-gulab-jamun',
    productId: 'sweets-gulab-jamun',
    name: 'Shahi Gulab Jamun (250G)',
    unitPrice: 420,
    image: '/images/sweets/gulab_jamun.jpg',
    variantName: '250 G',
  },
  {
    id: 'ff-regular-fries',
    productId: 'ff-regular-fries',
    name: 'Crispy Seasoned Fries',
    unitPrice: 200,
    image: '/images/fastfood/regularfries.jpg',
    variantName: 'Regular',
  },
  {
    id: 'biscuit-zeera-khatai',
    productId: 'biscuit-zeera-khatai',
    name: 'Crispy Zeera Biscuits (250G)',
    unitPrice: 350,
    image: '/images/biscuits/zeera_biscuits.jpg',
    variantName: '250 G',
  },
];

export default function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxAmount,
    deliveryFee,
    grandTotal,
    containsCustomizedCake,
    advancePercentage,
    advanceRequired,
    balanceDue,
    minOrderRemaining,
    isCartDrawerOpen,
    closeCartDrawer,
    addItem,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Dimmed backdrop */}
      <div
        onClick={closeCartDrawer}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-brand-100 animate-slideLeft">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-brand-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
                {items.length}
              </div>
              <h2 className="font-serif text-lg font-bold text-brand-dark">Your Cart</h2>
            </div>
            <button
              onClick={closeCartDrawer}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Minimum Order Nudge */}
            {items.length > 0 && minOrderRemaining > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Add <strong>{formatPKR(minOrderRemaining)}</strong> more to reach minimum order value.
                </span>
              </div>
            )}

            {/* Empty State */}
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Explore our oven-fresh cakes, sweets, and fast food!
                  </p>
                </div>
                <button
                  onClick={closeCartDrawer}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Line items list */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-3.5 flex gap-3 group">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                        <ProductImage
                          src={item.image}
                          fallbackSrc="/images/placeholder-product.svg"
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">
                              {item.name}
                            </h4>
                            <span className="text-sm font-bold text-brand-dark shrink-0">
                              {formatPKR(item.lineTotal)}
                            </span>
                          </div>

                          {/* Variant Badge */}
                          {item.variantName && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 text-[11px] font-semibold">
                              {item.variantName}
                            </span>
                          )}

                          {/* Customization Details preview */}
                          {item.isCustomized && item.customizationDetails && (
                            <div className="mt-1 text-[11px] text-gray-600 bg-amber-50/60 p-1.5 rounded-lg border border-amber-100 space-y-0.5">
                              {item.customizationDetails.flavor && (
                                <p><strong>Flavor:</strong> {item.customizationDetails.flavor}</p>
                              )}
                              {item.customizationDetails.message && (
                                <p><strong>Message:</strong> "{item.customizationDetails.message}"</p>
                              )}
                              {item.customizationDetails.deliveryDate && (
                                <p className="flex items-center gap-1 text-brand-700">
                                  <Calendar className="w-3 h-3" />
                                  <span>Delivery Date: {item.customizationDetails.deliveryDate}</span>
                                </p>
                              )}
                            </div>
                          )}

                          {item.specialInstructions && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-gray-200 text-gray-600 transition"
                              aria-label="Decrease quantity"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span className="px-3 text-xs font-bold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-gray-200 text-gray-600 transition"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-xs text-gray-400">
                            {formatPKR(item.unitPrice)} each
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Return to shop button */}
                <div className="pt-2 text-center">
                  <button
                    onClick={closeCartDrawer}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    + Add more items
                  </button>
                </div>

                {/* Upsell Row: "Popular with your order" */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                    Popular with your order
                  </h4>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {upsellProducts.map((upsell) => (
                      <div
                        key={upsell.id}
                        className="w-36 shrink-0 bg-brand-50/40 rounded-xl p-2.5 border border-brand-100 flex flex-col justify-between"
                      >
                        <div className="relative w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-gray-100">
                          <ProductImage
                            src={upsell.image}
                            fallbackSrc="/images/placeholder-product.svg"
                            alt={upsell.name}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </div>
                        <h5 className="text-xs font-bold text-gray-800 line-clamp-1">{upsell.name}</h5>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-brand-dark">
                            {formatPKR(upsell.unitPrice)}
                          </span>
                          <button
                            onClick={() =>
                              addItem({
                                productId: upsell.productId,
                                name: upsell.name,
                                image: upsell.image,
                                unitPrice: upsell.unitPrice,
                                quantity: 1,
                                variantName: upsell.variantName,
                              })
                            }
                            className="w-6 h-6 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-sm transition"
                            title="Quick Add"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer & Order Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-brand-50/30 space-y-3">
              {/* Summary Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span className="font-semibold text-gray-800">{formatPKR(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-gray-800">{formatPKR(deliveryFee)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-brand-dark">
                  <span>Grand Total</span>
                  <span>{formatPKR(grandTotal)}</span>
                </div>

                {/* 30% Advance Notice for Customized Cakes */}
                {containsCustomizedCake && (
                  <div className="mt-2 p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center gap-1 font-bold text-amber-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Customized Cake Order Notice:</span>
                    </div>
                    <div className="flex justify-between text-amber-800">
                      <span>Advance Due Online (30%):</span>
                      <span className="font-extrabold">{formatPKR(advanceRequired)}</span>
                    </div>
                    <div className="flex justify-between text-amber-800">
                      <span>Balance Due on Delivery (70%):</span>
                      <span className="font-extrabold">{formatPKR(balanceDue)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-between transition group"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-1">
                  <span>{formatPKR(containsCustomizedCake ? advanceRequired : grandTotal)}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
