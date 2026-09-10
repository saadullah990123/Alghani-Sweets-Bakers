'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Order, OrderStatus } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/utils';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Phone,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  ChefHat,
  XCircle,
} from 'lucide-react';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'PENDING', label: 'Order Received', desc: 'Awaiting confirmation', icon: Clock },
  { status: 'PREPARING', label: 'Preparing', desc: 'Fresh baking in progress', icon: ChefHat },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider on the way', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your fresh treats!', icon: Package },
];

function getStatusIndex(status: OrderStatus): number {
  if (status === 'CANCELLED') return -1;
  const idx = STATUS_STEPS.findIndex((s) => s.status === status);
  return idx !== -1 ? idx : 0;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [orderIdInput, setOrderIdInput] = useState(initialId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchOrder = async (idToSearch: string) => {
    const clean = idToSearch.trim();
    if (!clean) {
      setError('Please enter your Order ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else if (res.status === 404) {
        setOrder(null);
        setError('No order found with this Reference ID. Please check the ID and try again.');
      } else {
        throw new Error('Failed to fetch order');
      }
    } catch (err) {
      setOrder(null);
      setError('Could not fetch order status. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchOrder(initialId);
    }
  }, [initialId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderIdInput);
  };

  const currentIndex = order ? getStatusIndex(order.orderStatus) : 0;
  const isCancelled = order?.orderStatus === 'CANCELLED';

  return (
    <div className="min-h-screen bg-brand-50/30 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Search Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Package className="w-7 h-7 stroke-[2]" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900">
              Track Your Order
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Enter the Order Reference ID you received on checkout (e.g., <span className="font-mono font-bold text-gray-700">AGB-20260908-3093</span> or <span className="font-mono font-bold text-gray-700">3093</span>).
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter Order Reference ID..."
                className="w-full text-sm pl-10 pr-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white font-mono font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition shrink-0 disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-2xl flex items-center gap-2 text-left animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Details Card */}
        {order && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-8 animate-fadeIn">
            {/* Top Order Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
              <div>
                <span className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider">
                  Order Status
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5">
                  Reference: <span className="font-mono text-brand-600">{order.id}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    order.orderStatus === 'DELIVERED'
                      ? 'bg-green-100 text-green-800'
                      : order.orderStatus === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : order.orderStatus === 'OUT_FOR_DELIVERY'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Visual Timeline Tracker */}
            {isCancelled ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Order Cancelled</p>
                  <p className="text-xs text-red-600">This order was cancelled. Please contact support on WhatsApp if you need help.</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isPassed = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div
                        key={step.status}
                        className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1.5 ${
                          isCurrent
                            ? 'bg-brand-50 border-brand-500 shadow-sm ring-2 ring-brand-400/30'
                            : isPassed
                            ? 'bg-green-50/60 border-green-200 text-green-800'
                            : 'bg-gray-50 border-gray-200/60 text-gray-400 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            isCurrent
                              ? 'bg-brand-500 text-white shadow'
                              : isPassed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-xs text-gray-900 leading-tight">
                          {step.label}
                        </p>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery & Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-gray-50/70 rounded-2xl border border-gray-200/70 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  Customer & Contact
                </span>
                <p className="font-extrabold text-sm text-gray-900">
                  {order.customerTitle} {order.customerName}
                </p>
                <p className="text-gray-600 font-mono font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {order.customerPhone}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  Delivery Address ({order.orderType})
                </span>
                <p className="text-gray-900 font-semibold flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress || 'Store Pickup'}</span>
                </p>
                {order.nearestLandmark && (
                  <p className="text-gray-500 text-[11px]">Landmark: {order.nearestLandmark}</p>
                )}
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-600" />
                <span>Ordered Items ({order.items.length})</span>
              </h3>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3">
                      {item.productImage ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/60">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">
                          Qty: <span className="font-bold text-gray-800">{item.quantity}</span> × {formatPKR(item.unitPrice)}
                        </p>
                        {item.variantName && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-md">
                            {item.variantName}
                          </span>
                        )}
                        {item.customizationDetails?.cakeMessage && (
                          <p className="text-[11px] text-amber-700 font-medium italic mt-0.5">
                            Msg: "{item.customizationDetails.cakeMessage}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-sm text-brand-600">{formatPKR(item.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-4 bg-brand-50/40 rounded-2xl border border-brand-200/60 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-bold text-gray-900">{formatPKR(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sales Tax</span>
                <span className="font-bold text-gray-900">{formatPKR(order.taxAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Discount</span>
                  <span>- {formatPKR(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-brand-200/80 pt-2 flex justify-between text-sm font-extrabold text-gray-900">
                <span>Grand Total</span>
                <span className="text-base text-brand-600">{formatPKR(order.grandTotal)}</span>
              </div>
              {order.containsCustomizedCake && order.advanceRequired > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed border-amber-300 text-amber-900 flex justify-between font-bold">
                  <span>Advance Paid ({order.advancePercentage}%): {formatPKR(order.advancePaid)}</span>
                  <span>Balance Due on Delivery: {formatPKR(order.balanceDue)}</span>
                </div>
              )}
            </div>

            {/* Quick Action Support Button */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
              <Link
                href="/"
                className="w-full sm:w-auto text-center px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Back to Shop
              </Link>

              <a
                href={`https://wa.me/923001234567?text=${encodeURIComponent(`Hi Al-Ghani Bakers, I would like to inquire about my order #${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Bakery Support</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
