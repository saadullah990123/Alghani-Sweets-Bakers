'use client';

import React, { useState, useMemo } from 'react';
import { Product, CustomizationOption, Category } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { formatPKR, getProductFallbackImage } from '@/lib/utils';
import ProductImage from '@/components/product/ProductImage';
import { DEFAULT_CAKE_WEIGHT_OPTIONS, DEFAULT_CAKE_FLAVOR_OPTIONS } from '@/lib/customizationDefaults';
import {
  X,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';

interface CustomizedCakeModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

export default function CustomizedCakeModal({
  product,
  categories,
  onClose,
}: CustomizedCakeModalProps) {
  const { addItem } = useCart();

  // Calculate minimum delivery date (24 to 48 hours notice for customized cakes)
  const minDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // 48h lead notice
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedWeightOpt, setSelectedWeightOpt] = useState<CustomizationOption | null>(null);
  const [selectedFlavorOpt, setSelectedFlavorOpt] = useState<CustomizationOption | null>(null);
  const [cakeMessage, setCakeMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(minDeliveryDate);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!product) return null;

  const fallbackImage = getProductFallbackImage(product.categoryId, product.subcategoryId, categories);

  const weightStep = product.customizationSteps?.find((s) => s.stepType === 'RADIO' && s.title.toLowerCase().includes('weight'));
  const flavorStep = product.customizationSteps?.find((s) => s.stepType === 'RADIO' && s.title.toLowerCase().includes('flavor'));

  // Default selections if not set
  const weightOptions = weightStep?.options || DEFAULT_CAKE_WEIGHT_OPTIONS;

  const flavorOptions = flavorStep?.options || DEFAULT_CAKE_FLAVOR_OPTIONS;

  const activeWeight = selectedWeightOpt || weightOptions[0];
  const activeFlavor = selectedFlavorOpt || flavorOptions[0];

  // Are all required steps answered?
  const isStep1Answered = !!activeWeight;
  const isStep2Answered = !!activeFlavor;
  const isDateSelected = !!deliveryDate;
  const isValidConfig = isStep1Answered && isStep2Answered && isDateSelected;

  // Live Unit Price:
  const unitPrice = (activeWeight?.priceModifier || product.basePrice) + (activeFlavor?.priceModifier || 0);
  const lineTotal = isValidConfig ? unitPrice * quantity : 0;
  const advanceRequiredAmount = Math.round(lineTotal * 0.3); // 30% advance

  const handleAddToCart = () => {
    if (!isValidConfig) return;

    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0] || fallbackImage,
      unitPrice,
      quantity,
      variantName: activeWeight?.name,
      isCustomized: true,
      requiresAdvance: true, // Section 7.1 hard rule
      customizationDetails: {
        weight: activeWeight?.name,
        flavor: activeFlavor?.name,
        message: cakeMessage.trim() || undefined,
        deliveryDate,
      },
      specialInstructions: specialInstructions.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-200 max-h-[92vh] flex flex-col animate-scaleUp">
        {/* Header with Background / Image */}
        <div className="relative h-44 sm:h-52 bg-brand-900 shrink-0 overflow-hidden">
          <ProductImage
            src={product.images[0]}
            fallbackSrc={fallbackImage}
            alt={product.name}
            imageScale={product.imageScale}
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 transition shadow-md z-20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Title */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-gradient-to-r from-amber-500 to-yellow-400 text-brand-dark shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Step Cake Configurator</span>
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold mt-1 leading-tight drop-shadow">
              {product.name}
            </h3>
            <p className="text-xs text-amber-100 font-medium line-clamp-1 mt-0.5">
              {product.shortDescription}
            </p>
          </div>
        </div>

        {/* Advance Notice Banner */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            Custom cakes require 48 hours notice & <strong>30% advance payment</strong> at checkout.
          </span>
        </div>

        {/* Scrollable Multi-Step Configurator Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* STEP 1 (Required): Weight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-gray-900">
                  Choose Cake Weight
                </h4>
              </div>
              {!isStep1Answered ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-200">
                  Required
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selected</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {weightOptions.map((opt) => {
                const isSelected = activeWeight?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedWeightOpt(opt)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 text-brand-900 ring-2 ring-brand-400/40 shadow-sm'
                        : 'border-gray-200 hover:border-brand-200 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-bold">{opt.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-brand-dark">
                      {formatPKR(opt.priceModifier)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2 (Required): Flavors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-gray-900">
                  Select Classic Gourmet Flavor
                </h4>
              </div>
              {!isStep2Answered ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-200">
                  Required
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selected</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {flavorOptions.map((f) => {
                const isSelected = activeFlavor?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFlavorOpt(f)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 text-brand-900 ring-2 ring-brand-400/40 shadow-sm'
                        : 'border-gray-200 hover:border-brand-200 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">{f.name}</span>
                    </div>
                    {f.priceModifier > 0 && (
                      <span className="text-xs font-bold text-brand-dark">
                        +{formatPKR(f.priceModifier)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3 (Optional): Message on Cake */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-sm font-bold text-gray-900">
                Message on Cake (Optional)
              </h4>
            </div>
            <input
              type="text"
              maxLength={80}
              value={cakeMessage}
              onChange={(e) => setCakeMessage(e.target.value)}
              placeholder="e.g. Happy 5th Birthday Zain / Mubarak Ali & Fatima"
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
          </div>

          {/* STEP 4: Choose Delivery Date (Required advance notice) */}
          <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-200 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h4 className="text-sm font-bold text-brand-900">
                Choose Delivery Date *
              </h4>
            </div>
            <p className="text-xs text-gray-600">
              Customized cakes are baked fresh from scratch and require at least 48 hours preparation lead time.
            </p>
            <input
              type="date"
              required
              min={minDeliveryDate}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 font-semibold text-gray-800"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Color or Decor Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Please use golden ribbon, light pink frosting..."
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Fixed Footer: Stepper & Add to Cart button */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-brand-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-gray-100 text-gray-600 transition"
              >
                {quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
              </button>
              <span className="px-3.5 text-sm font-bold text-gray-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 hover:bg-gray-100 text-gray-600 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[11px] text-gray-500 block">Line Total</span>
              <span className="text-lg font-extrabold text-brand-dark">
                {formatPKR(lineTotal)}
              </span>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={!isValidConfig}
            className={`w-full sm:w-auto flex-1 max-w-sm py-3.5 px-6 font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-between transition ${
              isValidConfig
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/30 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>{isValidConfig ? 'Add Customized Cake' : 'Complete Required Steps'}</span>
            <div className="flex items-center gap-1">
              <span>{isValidConfig ? formatPKR(lineTotal) : 'Rs. 0'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
