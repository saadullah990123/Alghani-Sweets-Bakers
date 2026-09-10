'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProductReview } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';
import { Star, Trash2, Check, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Server-driven pagination (Finding 8-A) — the API returns only the
  // current page of reviews plus totals, instead of the entire ever-growing
  // review history being fetched at once.
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: String(currentPage), pageSize: String(PAGE_SIZE) });
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('The server returned an error while loading reviews.');
      const result = await res.json();
      setReviews(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
      if (result.page !== currentPage) setCurrentPage(result.page);
    } catch (e) {
      console.error('Failed to load reviews:', e);
      setLoadError('Could not load reviews. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this review? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback('Review removed.');
        setTimeout(() => setFeedback(''), 3000);
        // Re-fetch the current page rather than just splicing it out of
        // local state, since removing the last row on a page should pull
        // in the next row from the server (or fall back a page) instead of
        // leaving a visibly shorter page than PAGE_SIZE.
        fetchReviews();
      }
    } catch (e) {
      console.error('Failed to delete review:', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Customer Feedback
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Product Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {totalItems} {totalItems === 1 ? 'review' : 'reviews'} submitted across all products.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{feedback}</span>
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} onRetry={fetchReviews} />}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500 mt-2">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 && !loadError ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200/80">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-semibold">No reviews have been submitted yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">{review.customerName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">{review.productId}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{review.comment}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{formatDate(review.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition shrink-0"
                  aria-label="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Bar — server-driven, matches the pattern used on the
              admin orders page. */}
          {totalPages > 1 && (
            <div className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page {currentPage} of {totalPages} &middot; {totalItems} total
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
