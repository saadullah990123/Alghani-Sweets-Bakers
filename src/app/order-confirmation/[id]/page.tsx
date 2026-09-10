'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Order } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Printer,
  MessageCircle,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (e) {
        console.error('Failed to load order confirmation:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50/30">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-brand-900">Loading Order Confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50/30 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Success Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-200 shadow-elevated text-center space-y-3 no-print">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900">
            Thank You! Your Order Has Been Received
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            We are preparing your fresh bakery items with love and supreme hygiene. You will receive an SMS/WhatsApp update shortly.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-900 rounded-xl border border-brand-200 text-sm font-bold">
            <span>Order Reference ID:</span>
            <span className="font-mono text-base text-brand-600">{orderId}</span>
          </div>
        </div>

        {/* Printable Order Receipt Slip */}
        <div id="printable-slip" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-100 shadow-sm space-y-6">
          {/* Header on printable slip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0">
                <Image
                  src="/images/logo/logo.png"
                  alt="Al-Ghani Sweets & Bakers"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">
                  Al-Ghani Sweets & Bakers
                </h2>
                <p className="text-xs text-gray-500">Official Customer Order Receipt</p>
              </div>
            </div>

            <div className="text-center sm:text-right text-xs text-gray-500 space-y-0.5">
              <p><strong>Date:</strong> {formatDate(order?.createdAt || new Date().toISOString())}</p>
              <p><strong>Status:</strong> <span className="font-bold text-amber-600 uppercase">{order?.orderStatus || 'PENDING'}</span></p>
            </div>
          </div>

          {/* Customer & Delivery Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-brand-50/40 p-4 rounded-2xl border border-brand-100">
            <div>
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">
                Customer Details
              </span>
              <p className="font-bold text-gray-900">
                {order?.customerTitle} {order?.customerName || 'Customer'}
              </p>
              <p className="text-gray-600 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{order?.customerPhone}</span>
              </p>
              {order?.alternatePhone && (
                <p className="text-gray-500 text-xs">Alt: {order.alternatePhone}</p>
              )}
            </div>

            <div>
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">
                Delivery Address ({order?.orderType || 'DELIVERY'})
              </span>
              <p className="text-gray-800 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                <span>{order?.deliveryAddress || 'Takeaway Pickup'}</span>
              </p>
              {order?.nearestLandmark && (
                <p className="text-xs text-gray-500 mt-1">Landmark: {order.nearestLandmark}</p>
              )}
              {order?.deliveryInstructions && (
                <p className="text-xs text-brand-800 font-medium italic mt-1">
                  Note: {order.deliveryInstructions}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
              Ordered Items
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {order?.items?.map((item) => (
                <div key={item.id} className="p-4 flex gap-3 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      <Image
                        src={item.productImage || '/images/placeholder-product.svg'}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{item.productName}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Qty: <strong>{item.quantity}</strong></span>
                        {item.variantName && <span>• {item.variantName}</span>}
                      </div>

                      {/* Customized Cake Details */}
                      {item.isCustomized && item.customizationDetails && (
                        <div className="mt-1.5 text-xs text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200 space-y-0.5">
                          {item.customizationDetails.flavor && (
                            <p><strong>Flavor:</strong> {item.customizationDetails.flavor}</p>
                          )}
                          {item.customizationDetails.message && (
                            <p><strong>Message:</strong> "{item.customizationDetails.message}"</p>
                          )}
                          {item.customizationDetails.deliveryDate && (
                            <p className="flex items-center gap-1 text-purple-700 font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Requested Delivery Date: {item.customizationDetails.deliveryDate}</span>
                            </p>
                          )}
                        </div>
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

          {/* Payment & Financial Summary */}
          <div className="p-4 bg-brand-50/40 rounded-2xl border border-brand-100 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Payment Method</span>
              <span className="font-bold uppercase text-gray-800">{order?.paymentMethod || 'COD'}</span>
            </div>
            {order?.paymentReference && (
              <div className="flex justify-between text-gray-600">
                <span>Transaction Ref ID</span>
                <span className="font-mono font-bold text-gray-800">{order.paymentReference}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-800">{formatPKR(order?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (18%)</span>
              <span className="font-medium text-gray-800">{formatPKR(order?.taxAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="font-medium text-gray-800">{formatPKR(order?.deliveryFee || 0)}</span>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-extrabold text-brand-dark">
              <span>Grand Total</span>
              <span>{formatPKR(order?.grandTotal || 0)}</span>
            </div>

            {/* Advance Payment Details */}
            {order?.containsCustomizedCake && (
              <div className="mt-3 p-3 bg-amber-100/90 border border-amber-300 rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Customized Cake Advance Payment Record</span>
                </div>
                <div className="flex justify-between text-amber-900 font-semibold">
                  <span>Advance Amount (30%):</span>
                  <span className="font-extrabold">{formatPKR(order.advanceRequired)}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Balance Due on Delivery (70%):</span>
                  <span className="font-bold">{formatPKR(order.balanceDue)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (No Print) */}
        <div className="flex flex-wrap items-center justify-center gap-4 no-print pt-2">
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 font-bold text-sm shadow-sm hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span>Print Receipt</span>
          </button>

          <a
            href={`https://wa.me/923001234567?text=${encodeURIComponent(
              `Hello Al-Ghani Sweets & Bakers, I just placed Order #${orderId}. Please confirm status.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Confirmation</span>
          </a>

          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
