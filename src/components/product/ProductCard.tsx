'use client';

import React, { useState } from 'react';
import { Product, ProductVariant, Category } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { formatPKR, getProductFallbackImage } from '@/lib/utils';
import ProductImage from '@/components/product/ProductImage';
import { Plus, Sparkles, Check, ChevronRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  onOpenDetailModal: (product: Product) => void;
  onOpenCustomModal: (product: Product) => void;
}

export default function ProductCard({
  product,
  categories,
  onOpenDetailModal,
  onOpenCustomModal,
}: ProductCardProps) {
  const { addItem, getQuantityInCart } = useCart();
  const fallbackImage = getProductFallbackImage(product.categoryId, product.subcategoryId, categories);

  // For Type B Variant pricing pills on card:
  const variants = product.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);
  const [addedToast, setAddedToast] = useState(false);

  // Optimistic, client-only stock check — purely a read of local cart state
  // (no network round trip), so it updates the instant the shopper adds an
  // item. `undefined` means made-to-order/unlimited (the default for almost
  // every product), so most cards never show this at all.
  const remainingStock =
    typeof product.stock === 'number' ? product.stock - getQuantityInCart(product.id) : undefined;
  const isSoldOut = remainingStock !== undefined && remainingStock <= 0;
  const isLowStock = remainingStock !== undefined && remainingStock > 0 && remainingStock <= 3;

  // Determine current active price for card:
  const currentPrice =
    product.pricingType === 'VARIANT' && selectedVariant
      ? selectedVariant.price
      : product.basePrice;

  const handleCardClick = () => {
    if (product.isCustomizable) {
      onOpenCustomModal(product);
    } else {
      onOpenDetailModal(product);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSoldOut) return;

    if (product.isCustomizable) {
      onOpenCustomModal(product);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0] || fallbackImage,
      unitPrice: currentPrice,
      quantity: 1,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
    });

    // Show brief added feedback
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1200);
  };

  const handleVariantSelect = (e: React.MouseEvent, variant: ProductVariant) => {
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl overflow-hidden border border-brand-100/80 hover:border-brand-300 shadow-sm hover:shadow-elevated transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <ProductImage
          src={product.images[0]}
          fallbackSrc={fallbackImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out"
          imageScale={product.imageScale}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.isCustomizable && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Configurable</span>
            </span>
          )}
          {product.isPopular && !product.isCustomizable && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-400 text-brand-900 shadow-sm">
              Popular
            </span>
          )}
          {product.packInfo && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/80 text-amber-100 backdrop-blur-sm shadow-sm">
              {product.packInfo}
            </span>
          )}
          {isSoldOut && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-gray-800 text-white shadow-md">
              Sold Out
            </span>
          )}
          {isLowStock && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-500 text-white shadow-md">
              Only {remainingStock} left
            </span>
          )}
        </div>
      </div>

      {/* Product Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-brand-700 transition leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Type B Variant Selection Pills (Shown directly on card - Section 3) */}
        {product.pricingType === 'VARIANT' && variants.length > 0 && !product.isCustomizable && (
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={(e) => handleVariantSelect(e, v)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-dark text-white shadow-sm scale-105'
                        : 'bg-brand-50/80 text-brand-900 border border-brand-200 hover:bg-brand-100'
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price & Action Row */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">
              {product.pricingType === 'VARIANT' && !selectedVariant ? 'From' : 'Price'}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-brand-600 tracking-tight">
              {formatPKR(currentPrice)}
            </span>
          </div>

          {/* Action ADD Button */}
          <button
            onClick={handleQuickAdd}
            disabled={isSoldOut}
            className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
              isSoldOut
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : addedToast
                ? 'bg-green-600 text-white shadow-green-500/30 scale-105'
                : product.isCustomizable
                ? 'bg-purple-700 hover:bg-purple-800 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-md'
            }`}
          >
            {isSoldOut ? (
              <span>Sold Out</span>
            ) : addedToast ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : product.isCustomizable ? (
              <>
                <span>Customize</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>ADD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
