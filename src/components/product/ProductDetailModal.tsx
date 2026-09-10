'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, Category, ProductReview } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { formatPKR, formatDateShort, getProductFallbackImage } from '@/lib/utils';
import ProductImage from '@/components/product/ProductImage';
import {
  X,
  Share2,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  MessageSquare,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  categories,
  onClose,
}: ProductDetailModalProps) {
  const { addItem } = useCart();

  // All hooks must run every render regardless of `product` — the null
  // check happens further down, after every useState call.
  const variants = product?.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  // Reviews & Ratings
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [ratingSummary, setRatingSummary] = useState<{ average: number; count: number }>({
    average: 0,
    count: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    let cancelled = false;
    setReviewsLoading(true);
    fetch(`/api/reviews?productId=${product.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews || []);
        setRatingSummary(data.summary || { average: 0, count: 0 });
      })
      .catch((e) => console.error('Failed to load reviews:', e))
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setReviewError('');

    if (!reviewName.trim() || !reviewComment.trim()) {
      setReviewError('Please add your name and a short comment.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: reviewName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit review');

      setReviews((prev) => [data, ...prev]);
      setRatingSummary((prev) => ({
        average: Math.round((((prev.average * prev.count) + reviewRating) / (prev.count + 1)) * 10) / 10,
        count: prev.count + 1,
      }));
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      setReviewError(err.message || 'Could not submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!product) return null;

  const fallbackImage = getProductFallbackImage(product.categoryId, product.subcategoryId, categories);

  // Live Unit Price & Line Total Calculation (Section 4 requirement)
  const unitPrice =
    product.pricingType === 'VARIANT' && selectedVariant
      ? selectedVariant.price
      : product.basePrice;

  const lineTotal = unitPrice * quantity;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[activeImageIdx] || product.images[0] || fallbackImage,
      unitPrice,
      quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    onClose();
  };

  const images = product.images.length > 0 ? product.images : [fallbackImage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-100 flex flex-col md:flex-row max-h-[90vh] animate-scaleUp">
        {/* Left / Top Image Carousel Section */}
        <div className="relative w-full md:w-1/2 h-64 sm:h-80 md:h-auto bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
          <ProductImage
            src={images[activeImageIdx]}
            fallbackSrc={fallbackImage}
            alt={product.name}
            imageScale={product.imageScale}
            fill
            priority
            className="object-cover"
          />

          {/* Gradient Overlay for Tagline */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top Actions: Share & Close buttons */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md transition shadow-md"
              title="Share Link"
            >
              {copiedShare ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md transition shadow-md"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/60 hover:bg-white text-gray-800 backdrop-blur-md transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveImageIdx((prev) => (prev + 1) % images.length)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/60 hover:bg-white text-gray-800 backdrop-blur-md transition"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Overlaid Title & Tagline at bottom of image */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-20">
            <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight drop-shadow">
              {product.name}
            </h3>
            {product.packInfo && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-brand-dark">
                {product.packInfo}
              </span>
            )}
          </div>
        </div>

        {/* Right / Bottom Info Section (Scrollable) */}
        <div className="w-full md:w-1/2 flex flex-col justify-between overflow-y-auto bg-white">
          {/* Header Close button for desktop */}
          <div className="hidden md:flex justify-end p-4 border-b border-gray-100">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 flex-1">
            {/* Price Display */}
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
                {formatPKR(unitPrice)}
              </span>
              {selectedVariant && (
                <span className="ml-2 text-xs font-semibold text-gray-500">
                  ({selectedVariant.name})
                </span>
              )}
            </div>

            {/* Rating Summary */}
            {ratingSummary.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(ratingSummary.average) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-700">{ratingSummary.average.toFixed(1)}</span>
                <span className="text-xs text-gray-400">
                  ({ratingSummary.count} {ratingSummary.count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Description
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {product.fullDescription || product.shortDescription}
              </p>
            </div>

            {/* "Choose an option" Variant Selector (Section 4) */}
            {variants.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Choose an option
                  </h4>
                  <span className="text-[11px] text-brand-600 font-semibold">Select 1</span>
                </div>
                <div className="space-y-2">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-sm'
                            : 'border-gray-200 hover:border-brand-200 text-gray-700'
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
                          <span className="text-xs sm:text-sm font-semibold">{v.name}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-brand-dark">
                          {formatPKR(v.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Instructions with Character Counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Special Instructions
                </label>
                <span className="text-[11px] text-gray-400 font-medium">
                  {specialInstructions.length}/500
                </span>
              </div>
              <textarea
                maxLength={500}
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Less spicy, extra tissues, candle needed..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Reviews & Ratings */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  <span>Customer Reviews</span>
                </h4>
                {!showReviewForm && (
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700"
                  >
                    + Write a Review
                  </button>
                )}
              </div>

              {reviewSuccess && (
                <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Thanks for your review!</span>
                </div>
              )}

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                  {reviewError && (
                    <p className="text-[11px] text-red-600 font-semibold">{reviewError}</p>
                  )}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i + 1)}
                        aria-label={`Rate ${i + 1} star${i === 0 ? '' : 's'}`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            i < reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                  />
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell others what you thought..."
                    maxLength={1000}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-lg transition"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-3 py-2 bg-white border border-gray-300 text-gray-600 font-bold text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {reviewsLoading ? (
                <p className="text-[11px] text-gray-400">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-[11px] text-gray-400">No reviews yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-800">{r.customerName}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDateShort(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer: Quantity Stepper & Instant Recalculated Add to Cart Button */}
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-brand-50/30 flex items-center gap-3">
            {/* Stepper */}
            <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-gray-100 text-gray-600 transition"
                aria-label="Decrease Quantity"
              >
                {quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
              </button>
              <span className="px-3.5 text-sm font-bold text-gray-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 hover:bg-gray-100 text-gray-600 transition"
                aria-label="Increase Quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Full width button showing live total */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-between transition group"
            >
              <span>Add to Cart</span>
              <div className="flex items-center gap-1 font-bold">
                <span>{formatPKR(lineTotal)}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
