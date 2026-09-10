'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Order, OrderStatus } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/utils';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  History,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerHistory, setCustomerHistory] = useState<Order[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`);
      if (!res.ok) throw new Error('The server returned an error while loading this order.');
      const data = await res.json();
      setOrder(data);
      setInternalNotes(data.internalNotes || '');
    } catch (e) {
      console.error('Failed to load order:', e);
      setLoadError('Could not load this order. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          action: 'UPDATE_STATUS',
          status: newStatus,
          internalNotes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setUpdateMsg(`Order status moved to ${newStatus}`);
        setTimeout(() => setUpdateMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmAdvance = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          action: 'CONFIRM_ADVANCE',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setUpdateMsg('30% Advance Payment confirmed and verified!');
        setTimeout(() => setUpdateMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to confirm advance:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, action: 'CONFIRM_PAYMENT' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setUpdateMsg('Payment confirmed as received and verified!');
        setTimeout(() => setUpdateMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to confirm payment:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkPaymentFailed = async () => {
    if (!order) return;
    if (!window.confirm('Mark this payment as failed? The customer will need to retry payment.')) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, action: 'MARK_PAYMENT_FAILED' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setUpdateMsg('Payment marked as failed.');
        setTimeout(() => setUpdateMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to mark payment failed:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          action: 'UPDATE_STATUS',
          status: order.orderStatus,
          internalNotes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setUpdateMsg('Internal staff notes saved successfully');
        setTimeout(() => setUpdateMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to save notes:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchCustomerHistory = async () => {
    if (!order?.customerPhone) return;
    try {
      const res = await fetch(`/api/admin/orders?customerPhone=${order.customerPhone}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerHistory(data);
        setShowHistoryModal(true);
      }
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  };

  const handlePrintKitchenSlip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-gray-500 mt-2">Loading Order Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {loadError ? (
          <AdminErrorBanner message={loadError} onRetry={fetchOrder} />
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Order Not Found</h2>
            <Link href="/admin/orders" className="text-brand-600 text-xs font-bold mt-2 inline-block">
              ← Back to Orders List
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Actions (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-extrabold text-brand-dark">
                {order.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                  order.orderStatus === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : order.orderStatus === 'DELIVERED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Direct Contact */}
          <a
            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Assalam o Alaikum ${order.customerTitle || ''} ${order.customerName}, this is Al-Ghani Sweets & Bakers regarding your order #${order.id}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Customer</span>
          </a>

          {/* Click to Call */}
          <a
            href={`tel:${order.customerPhone}`}
            className="px-4 py-2.5 bg-green-50 text-green-800 hover:bg-green-100 font-bold text-xs rounded-xl border border-green-200 flex items-center gap-1.5 transition"
          >
            <Phone className="w-4 h-4 text-green-600" />
            <span>Call</span>
          </a>

          {/* Print Slip */}
          <button
            onClick={handlePrintKitchenSlip}
            className="px-4 py-2.5 bg-brand-dark hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Packing Slip</span>
          </button>
        </div>
      </div>

      {/* Success / Alert Banner */}
      {updateMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span>{updateMsg}</span>
        </div>
      )}

      {/* Printable Kitchen Slip View */}
      <div id="printable-slip" className="space-y-6">
        {/* Slip Header (visible on print) */}
        <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">AL-GHANI SWEETS & BAKERS</h1>
              <p className="text-xs">Kitchen & Dispatch Packing Slip</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-mono font-bold text-sm">Order: {order.id}</p>
              <p>Time: {formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer Profile & Order Items (Section 9.1 B) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Customer Block */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-600" />
                  <span>Customer Details</span>
                </h3>

                {/* Customer History Lookup button (Section 9.1 C) */}
                <button
                  type="button"
                  onClick={fetchCustomerHistory}
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 transition no-print"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Customer History</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">
                    Full Name
                  </span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {order.customerTitle} {order.customerName}
                  </p>
                  <p className="text-gray-600 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    <span>{order.customerPhone}</span>
                  </p>
                  {order.alternatePhone && (
                    <p className="text-gray-500 text-xs mt-0.5">Alt: {order.alternatePhone}</p>
                  )}
                  {order.customerEmail && (
                    <p className="text-gray-500 text-xs mt-0.5">Email: {order.customerEmail}</p>
                  )}
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">
                    Delivery Address ({order.orderType})
                  </span>
                  <p className="font-semibold text-gray-800 mt-0.5 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                  {order.nearestLandmark && (
                    <p className="text-xs text-gray-500 mt-1">Landmark: {order.nearestLandmark}</p>
                  )}
                  {order.deliveryInstructions && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                      <strong>Customer Instructions:</strong> {order.deliveryInstructions}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Items Block (with detailed customized cake choices - Section 9.1 B) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Order Items ({order.items.length})
              </h3>

              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4 items-start justify-between">
                    <div className="flex gap-3 min-w-0">
                      <div className="relative w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                        <Image
                          src={item.productImage || '/images/placeholder-product.svg'}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900">{item.productName}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Qty: <strong>{item.quantity}</strong></span>
                          {item.variantName && <span>• Size: {item.variantName}</span>}
                          <span>• Unit: {formatPKR(item.unitPrice)}</span>
                        </div>

                        {/* CRITICAL: Full Customized Cake breakdown (Section 9.1 B) */}
                        {item.isCustomized && item.customizationDetails && (
                          <div className="mt-2 p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1">
                            <div className="font-bold text-purple-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                              <span>Custom Cake Specifications:</span>
                            </div>
                            {item.customizationDetails.weight && (
                              <p>• <strong>Weight:</strong> {item.customizationDetails.weight}</p>
                            )}
                            {item.customizationDetails.flavor && (
                              <p>• <strong>Flavor:</strong> {item.customizationDetails.flavor}</p>
                            )}
                            {item.customizationDetails.message && (
                              <p className="bg-white p-1.5 rounded-lg border border-purple-200 text-purple-900">
                                <strong>Message on Cake:</strong> "{item.customizationDetails.message}"
                              </p>
                            )}
                            {item.customizationDetails.deliveryDate && (
                              <p className="flex items-center gap-1 text-purple-800 font-bold">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Requested Delivery Date: {item.customizationDetails.deliveryDate}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="font-extrabold text-sm text-brand-dark shrink-0">
                      {formatPKR(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Internal Staff Notes (Section 9.1 B) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3 no-print">
              <h3 className="font-serif text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Internal Staff Notes (Staff Only)</span>
              </h3>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. Customer requested delivery after 6pm, extra napkins packed, payment verified with bank..."
                className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white text-gray-900"
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isUpdating}
                className="px-4 py-2 bg-brand-dark hover:bg-black text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>

          {/* Right Column: Order Status Progression & Payment Block */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status Control Buttons (Section 9.1 B) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4 no-print">
              <h3 className="font-serif text-base font-bold text-gray-900">
                Move Order Status
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('PENDING')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    order.orderStatus === 'PENDING'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <span>1. Pending Action</span>
                  {order.orderStatus === 'PENDING' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('PREPARING')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    order.orderStatus === 'PREPARING'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <span>2. Preparing in Kitchen</span>
                  {order.orderStatus === 'PREPARING' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('OUT_FOR_DELIVERY')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    order.orderStatus === 'OUT_FOR_DELIVERY'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  <span>3. Out for Delivery</span>
                  {order.orderStatus === 'OUT_FOR_DELIVERY' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('DELIVERED')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    order.orderStatus === 'DELIVERED'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-green-50 text-green-800 hover:bg-green-100'
                  }`}
                >
                  <span>4. Delivered & Completed</span>
                  {order.orderStatus === 'DELIVERED' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('CANCELLED')}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition ${
                    order.orderStatus === 'CANCELLED'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Payment & Advance Confirmation Block (Section 9.1 B) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-gray-900">
                  Payment Summary
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : order.paymentStatus === 'PENDING_VERIFICATION'
                      ? 'bg-orange-100 text-orange-800'
                      : order.paymentStatus === 'ADVANCE_PAID'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.paymentStatus.replace('_', ' ')}
                </span>
              </div>

              {/* Manual payment verification — required for every non-COD order
                  before it can move from PENDING_VERIFICATION to PAID. This is
                  the only path to PAID; nothing sets it automatically. */}
              {order.paymentMethod !== 'COD' && order.paymentStatus === 'PENDING_VERIFICATION' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-3 no-print">
                  <div className="flex items-center gap-2 text-orange-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>Action needed: verify this {order.paymentMethod} transaction</span>
                  </div>
                  <p className="text-[11px] text-orange-800">
                    Check the actual JazzCash/Easypaisa/bank/card transaction against the reference below
                    and the order's grand total, then confirm or reject it.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isUpdating}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Confirm Payment Received
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkPaymentFailed}
                      disabled={isUpdating}
                      className="flex-1 py-2.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 font-bold text-xs rounded-xl transition"
                    >
                      Mark as Failed
                    </button>
                  </div>
                </div>
              )}

              {order.paymentStatus === 'FAILED' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-center gap-2 no-print">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>This payment was marked as failed. The customer needs to retry with a valid transaction.</span>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Method</span>
                  <span className="font-bold text-gray-900 uppercase">{order.paymentMethod}</span>
                </div>

                {order.paymentReference && (
                  <div className="flex justify-between text-gray-600">
                    <span>Transaction TID</span>
                    <span className="font-mono font-bold text-gray-900">{order.paymentReference}</span>
                  </div>
                )}

                {order.changeRequest && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                    <strong>Rider Note:</strong> {order.changeRequest}
                  </div>
                )}

                <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">{formatPKR(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18%)</span>
                  <span className="font-medium text-gray-800">{formatPKR(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-800">{formatPKR(order.deliveryFee)}</span>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-extrabold text-brand-dark">
                  <span>Grand Total</span>
                  <span>{formatPKR(order.grandTotal)}</span>
                </div>

                {/* Customized Advance Block */}
                {order.containsCustomizedCake && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2.5">
                    <div className="flex items-center gap-1 font-bold text-xs text-amber-950">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>30% Advance Payment Tracking</span>
                    </div>

                    <div className="flex justify-between text-xs text-amber-900">
                      <span>Advance Required (30%):</span>
                      <span className="font-bold">{formatPKR(order.advanceRequired)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-900">
                      <span>Balance Due on Delivery:</span>
                      <span className="font-bold">{formatPKR(order.balanceDue)}</span>
                    </div>

                    <div className="pt-2 border-t border-amber-200">
                      {order.advanceConfirmed ? (
                        <div className="p-2 bg-green-100 text-green-800 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>Advance Verified & Received</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConfirmAdvance}
                          disabled={isUpdating}
                          className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition no-print"
                        >
                          Mark Advance as Received / Confirmed
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order History Modal (Section 9.1 C) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-900">
                  Customer Order History
                </h3>
                <p className="text-xs text-gray-500">
                  All previous orders placed by <strong>{order.customerPhone}</strong> ({order.customerName})
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="divide-y divide-gray-100 space-y-2">
              {customerHistory.map((histOrder) => (
                <div key={histOrder.id} className="pt-3 pb-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-dark">{histOrder.id}</span>
                      <span className="text-gray-400">• {formatDate(histOrder.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5">
                      {histOrder.items?.length || 1} items • {histOrder.deliveryAddress}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-gray-900 block">
                      {formatPKR(histOrder.grandTotal)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {histOrder.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
