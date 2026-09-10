import React, { useState, useEffect } from 'react';
import { PaymentMethod, StoreSettings } from '@/lib/types';
import { useLocation } from '@/context/LocationContext';
import {
  Truck,
  Store,
  Banknote,
  CreditCard,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Building2,
} from 'lucide-react';

interface DeliveryPaymentFormProps {
  orderType: 'DELIVERY' | 'PICKUP';
  setOrderType: (t: 'DELIVERY' | 'PICKUP') => void;
  title: string;
  setTitle: (t: string) => void;
  fullName: string;
  setFullName: (n: string) => void;
  phone: string;
  setPhone: (p: string) => void;
  alternatePhone: string;
  setAlternatePhone: (p: string) => void;
  email: string;
  setEmail: (e: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (a: string) => void;
  nearestLandmark: string;
  setNearestLandmark: (l: string) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (i: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  changeRequest: string;
  setChangeRequest: (c: string) => void;
  paymentReference: string;
  setPaymentReference: (r: string) => void;
  containsCustomizedCake: boolean;
}

export default function DeliveryPaymentForm({
  orderType,
  setOrderType,
  title,
  setTitle,
  fullName,
  setFullName,
  phone,
  setPhone,
  alternatePhone,
  setAlternatePhone,
  email,
  setEmail,
  deliveryAddress,
  setDeliveryAddress,
  nearestLandmark,
  setNearestLandmark,
  deliveryInstructions,
  setDeliveryInstructions,
  paymentMethod,
  setPaymentMethod,
  changeRequest,
  setChangeRequest,
  paymentReference,
  setPaymentReference,
  containsCustomizedCake,
}: DeliveryPaymentFormProps) {
  const { savedAddresses } = useLocation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => console.error('Failed to load store settings for checkout:', err));
  }, []);

  const jazzcashNumber = settings?.jazzcashNumber || '0300-1234567';
  const jazzcashTitle = settings?.jazzcashTitle || 'Al-Ghani Bakers';
  const easypaisaNumber = settings?.easypaisaNumber || '0333-7654321';
  const easypaisaTitle = settings?.easypaisaTitle || 'Al-Ghani Sweets';
  const bankName = settings?.bankName || 'Meezan Bank';
  const bankAccountTitle = settings?.bankAccountTitle || 'Al-Ghani Sweets & Bakers';
  const bankAccountNumber = settings?.bankAccountNumber || 'PK64MEZN0001234567890101';
  const paymentInstructions = settings?.paymentInstructions || 'Please transfer to the account above and enter your Transaction ID (TID) so staff can verify it immediately.';

  return (
    <div className="space-y-6">
      {/* 1. Order Type Banner & Toggle (Section 6) */}
      <div className="bg-brand-50/60 p-4 rounded-2xl border border-brand-200/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
            <Truck className="w-5 h-5 text-brand-600" />
            <span>Order Type:</span>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-brand-200">
            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                orderType === 'DELIVERY'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Delivery Order
            </button>
            <button
              type="button"
              onClick={() => setOrderType('PICKUP')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                orderType === 'PICKUP'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Takeaway / Pickup
            </button>
          </div>
        </div>
      </div>

      {/* 2. Customer Contact Details */}
      <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          1. Customer Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          {/* Title Dropdown */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Title *
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white font-medium text-gray-800"
            >
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
            </select>
          </div>

          {/* Full Name */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Muhammad Ali"
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Mobile Number (WhatsApp) *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300 1234567"
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white font-medium"
            />
          </div>

          {/* Alternate Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Alternate Mobile (Optional)
            </label>
            <input
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="0321 7654321"
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Email Address (Optional — for digital invoice)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          />
        </div>
      </div>

      {/* 3. Delivery Address Details (If Delivery) */}
      {orderType === 'DELIVERY' && (
        <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            2. Delivery Address
          </h3>

          {/* Saved Address Chips */}
          {savedAddresses.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 font-semibold block mb-2">
                Quick Select Saved Address:
              </span>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((sa) => (
                  <button
                    key={sa.id}
                    type="button"
                    onClick={() => {
                      setDeliveryAddress(sa.address);
                      if (sa.landmark) setNearestLandmark(sa.landmark);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-brand-200 bg-brand-50/50 hover:bg-brand-100 text-brand-900 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{sa.label}: {sa.address.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Complete Delivery Address *
            </label>
            <textarea
              required
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House/Apartment #, Street, Block, Area, City"
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Nearest Landmark (Optional)
              </label>
              <input
                type="text"
                value={nearestLandmark}
                onChange={(e) => setNearestLandmark(e.target.value)}
                placeholder="e.g. Near Moon Market / Main Gate"
                className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Ring bell twice, leave at door"
                className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Options (Section 6 & 7.1 Business Rule) */}
      <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-serif text-lg font-bold text-gray-900">
            3. Payment Method
          </h3>
          {containsCustomizedCake && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>⚠️ Advance Payment Required:</strong> Your cart includes a Customized Cake. Cash on Delivery is disabled. Please select <strong>JazzCash, Easypaisa, Meezan Bank, or Card</strong> to pay the 30% advance payment. The remaining 70% balance is collected on delivery.
              </span>
            </div>
          )}
        </div>

        {/* Selectable Payment Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cash on Delivery (Disabled if customized cake is present) */}
          <button
            type="button"
            disabled={containsCustomizedCake}
            onClick={() => setPaymentMethod('COD')}
            className={`p-4 rounded-2xl border text-left flex items-start justify-between transition ${
              containsCustomizedCake
                ? 'opacity-40 bg-gray-100 border-gray-200 cursor-not-allowed'
                : paymentMethod === 'COD'
                ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-400/40 shadow-sm'
                : 'border-gray-200 hover:border-brand-200 bg-white'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="font-bold text-sm text-gray-900">Cash on Delivery</span>
              </div>
              <p className="text-xs text-gray-500">Pay cash upon receiving your fresh order</p>
            </div>
            {paymentMethod === 'COD' && !containsCustomizedCake && (
              <div className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* JazzCash */}
          <button
            type="button"
            onClick={() => setPaymentMethod('JAZZCASH')}
            className={`p-4 rounded-2xl border text-left flex items-start justify-between transition ${
              paymentMethod === 'JAZZCASH'
                ? 'border-red-500 bg-red-50/60 ring-2 ring-red-400/40 shadow-sm'
                : 'border-gray-200 hover:border-red-200 bg-white'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-600" />
                <span className="font-bold text-sm text-gray-900">JazzCash</span>
              </div>
              <p className="text-xs text-gray-600">Account: <span className="font-bold text-gray-900">{jazzcashNumber}</span> ({jazzcashTitle})</p>
            </div>
            {paymentMethod === 'JAZZCASH' && (
              <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* Easypaisa */}
          <button
            type="button"
            onClick={() => setPaymentMethod('EASYPAISA')}
            className={`p-4 rounded-2xl border text-left flex items-start justify-between transition ${
              paymentMethod === 'EASYPAISA'
                ? 'border-green-600 bg-green-50/60 ring-2 ring-green-500/40 shadow-sm'
                : 'border-gray-200 hover:border-green-200 bg-white'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-bold text-sm text-gray-900">Easypaisa</span>
              </div>
              <p className="text-xs text-gray-600">Account: <span className="font-bold text-gray-900">{easypaisaNumber}</span> ({easypaisaTitle})</p>
            </div>
            {paymentMethod === 'EASYPAISA' && (
              <div className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* Bank Direct Transfer */}
          <button
            type="button"
            onClick={() => setPaymentMethod('MEEZAN_BANK')}
            className={`p-4 rounded-2xl border text-left flex items-start justify-between transition ${
              paymentMethod === 'MEEZAN_BANK'
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-400/40 shadow-sm'
                : 'border-gray-200 hover:border-blue-200 bg-white'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <span className="font-bold text-sm text-gray-900">{bankName}</span>
              </div>
              <p className="text-xs text-gray-600">Title: <span className="font-semibold text-gray-900">{bankAccountTitle}</span></p>
              <p className="text-xs text-gray-600">A/C or IBAN: <span className="font-mono font-bold text-gray-900">{bankAccountNumber}</span></p>
            </div>
            {paymentMethod === 'MEEZAN_BANK' && (
              <div className="w-4 h-4 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>

        {/* Sub-inputs based on payment selection */}
        {paymentMethod === 'COD' && !containsCustomizedCake && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Change Request (Optional)
            </label>
            <input
              type="text"
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
              placeholder="e.g. Need change for Rs. 5,000 note"
              className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
            <p className="text-[11px] text-gray-500">Our rider will carry exact change for you.</p>
          </div>
        )}

        {(paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA' || paymentMethod === 'MEEZAN_BANK') && (
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
            <label className="block text-xs font-bold text-amber-950">
              Transaction ID / TID / Reference Number *
            </label>
            <input
              type="text"
              required
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. TID-98421054 or sender account name"
              className="w-full text-sm p-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white font-mono font-medium text-gray-900"
            />
            <p className="text-[11px] text-amber-800">
              {paymentInstructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
