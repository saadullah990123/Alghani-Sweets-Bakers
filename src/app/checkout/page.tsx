'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import DeliveryPaymentForm from '@/components/checkout/DeliveryPaymentForm';
import { PaymentMethod } from '@/lib/types';
import { formatPKR, generateOrderId } from '@/lib/utils';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Lock,
  Calendar,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    taxAmount,
    deliveryFee,
    grandTotal,
    containsCustomizedCake,
    advancePercentage,
    advanceRequired,
    balanceDue,
    clearCart,
  } = useCart();

  const { currentAddress, currentLandmark } = useLocation();

  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [title, setTitle] = useState('Mr.');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(currentAddress);
  const [nearestLandmark, setNearestLandmark] = useState(currentLandmark);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Default payment: if contains customized cake, default to JAZZCASH, else COD
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    containsCustomizedCake ? 'JAZZCASH' : 'COD'
  );
  const [changeRequest, setChangeRequest] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState('');

  // NOTE: this preview discount is for display only. The backend re-checks
  // the voucher code independently and is the only source of truth for the
  // discount actually applied to the order.
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    if (voucherCode.trim().toUpperCase() === 'ALGHANI10') {
      const discount = Math.round(subtotal * 0.1);
      setDiscountAmount(discount);
      setVoucherApplied(true);
    } else {
      setVoucherError('Invalid promo code. Try "ALGHANI10" for 10% off.');
    }
  };

  // Everything below is an ESTIMATE shown to the customer before they submit.
  // The actual charge is always recalculated on the server from live product
  // prices and store settings — the customer can never change what they pay
  // by editing these numbers in the browser.
  const finalGrandTotal = Math.max(0, grandTotal - discountAmount);
  const finalAdvanceRequired = containsCustomizedCake
    ? Math.round((finalGrandTotal * advancePercentage) / 100)
    : 0;
  const finalBalanceDue = containsCustomizedCake ? finalGrandTotal - finalAdvanceRequired : finalGrandTotal;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setPlaceOrderError('');

    if (!fullName.trim() || !phone.trim()) {
      alert('Please fill in your name and contact phone number.');
      return;
    }
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('Please provide your complete delivery address.');
      return;
    }

    setIsSubmitting(true);

    // This payload is a request, not a receipt — the server independently
    // looks up every product's real price and ignores subtotal/tax/fee/total
    // fields sent here. Only the voucher CODE is sent; the discount amount
    // itself is always computed server-side.
    const orderPayload = {
      customerTitle: title,
      customerName: fullName.trim(),
      customerPhone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      customerEmail: email.trim() || undefined,
      orderType,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress.trim() : 'Takeaway / Pickup at Bakery',
      nearestLandmark: nearestLandmark.trim() || undefined,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      voucherCode: voucherApplied ? voucherCode.trim() : undefined,
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined,
      changeRequest: changeRequest.trim() || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        variantId: i.variantId,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions,
        isCustomized: !!i.isCustomized,
        customizationDetails: i.customizationDetails,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // A real failure — never pretend the order went through. The cart
        // is left intact so the customer can fix the issue and retry.
        throw new Error(data?.error || 'We could not place your order. Please try again.');
      }

      clearCart();
      router.push(`/order-confirmation/${data.id}`);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setPlaceOrderError(err.message || 'We could not place your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-brand-500">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-brand-dark">Your cart is currently empty</h2>
        <p className="text-sm text-gray-500">Add fresh items from our bakery to proceed with checkout.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Store Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-800 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <Lock className="w-3.5 h-3.5" />
            <span>SSL Encrypted Guest Checkout</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Delivery & Customer & Payment Details (Section 6) */}
            <div className="lg:col-span-7 space-y-6">
              <DeliveryPaymentForm
                orderType={orderType}
                setOrderType={setOrderType}
                title={title}
                setTitle={setTitle}
                fullName={fullName}
                setFullName={setFullName}
                phone={phone}
                setPhone={setPhone}
                alternatePhone={alternatePhone}
                setAlternatePhone={setAlternatePhone}
                email={email}
                setEmail={setEmail}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
                nearestLandmark={nearestLandmark}
                setNearestLandmark={setNearestLandmark}
                deliveryInstructions={deliveryInstructions}
                setDeliveryInstructions={setDeliveryInstructions}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                changeRequest={changeRequest}
                setChangeRequest={setChangeRequest}
                paymentReference={paymentReference}
                setPaymentReference={setPaymentReference}
                containsCustomizedCake={containsCustomizedCake}
              />
            </div>

            {/* Right Column: Order Summary & Placement (Section 6) */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 bg-white p-6 rounded-3xl border border-brand-100 shadow-elevated space-y-5">
                <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                </h3>

                {/* Items List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 pr-1 space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 flex gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-xs sm:text-sm font-bold text-brand-dark shrink-0">
                            {formatPKR(item.lineTotal)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>Qty: {item.quantity}</span>
                          {item.variantName && <span>• {item.variantName}</span>}
                        </div>

                        {/* Customized details summary */}
                        {item.isCustomized && item.customizationDetails && (
                          <div className="mt-1 text-[11px] text-purple-900 bg-purple-50/70 p-1.5 rounded-lg border border-purple-200">
                            {item.customizationDetails.flavor && (
                              <p>Flavor: <strong>{item.customizationDetails.flavor}</strong></p>
                            )}
                            {item.customizationDetails.message && (
                              <p>Message: "{item.customizationDetails.message}"</p>
                            )}
                            {item.customizationDetails.deliveryDate && (
                              <p className="flex items-center gap-1 text-purple-700">
                                <Calendar className="w-3 h-3" />
                                <span>Date: {item.customizationDetails.deliveryDate}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher / Promo code */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Promo Code (ALGHANI10)"
                        className="w-full pl-9 pr-3 py-2 text-xs uppercase font-semibold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="px-4 py-2 bg-brand-dark hover:bg-black text-white text-xs font-bold rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                  {voucherApplied && (
                    <p className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>10% Discount Applied (-{formatPKR(discountAmount)})</span>
                    </p>
                  )}
                  {voucherError && (
                    <p className="text-xs text-red-500 font-medium mt-1">{voucherError}</p>
                  )}
                </div>

                {/* Pricing Summary Breakdown */}
                <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
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
                    <span className="font-semibold text-gray-800">
                      {orderType === 'DELIVERY' ? formatPKR(deliveryFee) : 'FREE (Pickup)'}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700 font-semibold">
                      <span>Promo Discount</span>
                      <span>-{formatPKR(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-extrabold text-brand-dark">
                    <span>Grand Total</span>
                    <span>{formatPKR(finalGrandTotal)}</span>
                  </div>

                  {/* 30% Advance Payment Rule (Section 7.1) */}
                  {containsCustomizedCake && (
                    <div className="mt-3 p-3 bg-amber-100/80 border border-amber-300 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-950">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span>Advance Payment Breakdown (30%)</span>
                      </div>
                      <div className="flex justify-between text-xs text-amber-900 font-semibold">
                        <span>Advance Payable Now:</span>
                        <span className="text-sm font-extrabold text-amber-950">
                          {formatPKR(finalAdvanceRequired)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-amber-800">
                        <span>Balance Due on Delivery:</span>
                        <span className="font-bold">{formatPKR(finalBalanceDue)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Place Order CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-base rounded-2xl shadow-lg transition duration-200 ${
                    isSubmitting ? 'opacity-70 cursor-wait' : 'hover:shadow-glow'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing Your Order...'
                    : containsCustomizedCake
                    ? `Pay ${formatPKR(finalAdvanceRequired)} Advance & Place Order`
                    : `Place Order (${formatPKR(finalGrandTotal)})`}
                </button>

                <div className="text-center">
                  <Link
                    href="/"
                    className="text-xs text-gray-500 hover:text-brand-800 font-medium hover:underline"
                  >
                    ← continue to add more items
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
