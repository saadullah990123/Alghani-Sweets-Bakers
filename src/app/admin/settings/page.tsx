'use client';

import React, { useState, useEffect } from 'react';
import { StoreSettings } from '@/lib/types';
import {
  Save,
  Check,
  Percent,
  Phone,
  Building2,
  Smartphone,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  // Admin Profile / Password Change State
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingAuth, setUpdatingAuth] = useState(false);
  const [authFeedback, setAuthFeedback] = useState('');
  const [authError, setAuthError] = useState('');

  const fetchSettingsAndProfile = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [settingsRes, profileRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/profile'),
      ]);

      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      } else {
        throw new Error('Could not load store settings.');
      }

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCurrentAdminEmail(profile.email || '');
        setNewAdminEmail(profile.email || '');
      }
    } catch (e: any) {
      console.error('Failed to load settings:', e);
      setLoadError('Could not load store settings. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndProfile();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setFeedback('Store settings & payment accounts updated successfully!');
        setTimeout(() => setFeedback(''), 4000);
      } else {
        throw new Error('The server rejected the save request.');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
      setSaveError('Could not save settings. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback('');
    setAuthError('');

    if (!currentPassword) {
      setAuthError('Please enter your current password to authorize changes.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setAuthError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setAuthError('New password and confirm password do not match.');
      return;
    }

    setUpdatingAuth(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newEmail: newAdminEmail !== currentAdminEmail ? newAdminEmail : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update credentials.');
      }

      setAuthFeedback('Admin email & password updated successfully!');
      setCurrentAdminEmail(data.admin?.email || newAdminEmail);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setAuthFeedback(''), 5000);
    } catch (err: any) {
      setAuthError(err.message || 'Error updating admin credentials.');
    } finally {
      setUpdatingAuth(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-gray-500 mt-2">Loading settings...</p>
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="max-w-4xl mx-auto">
        <AdminErrorBanner message={loadError || 'Settings could not be loaded.'} onRetry={fetchSettingsAndProfile} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Configuration & Security
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Store, Bank & Admin Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Easily update Easypaisa, Bank accounts, taxes, delivery fees, and change admin login credentials.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Store & Bank Info'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-5 h-5 text-green-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {saveError && <AdminErrorBanner message={saveError} onRetry={() => setSaveError('')} />}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* 1. Bank, Easypaisa & JazzCash Accounts */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>Bank & Mobile Payment Accounts (Customer Checkout)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Changes made here immediately update on the customer checkout page for Easypaisa, JazzCash, and Bank Transfer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Easypaisa */}
            <div className="p-5 bg-green-50/70 border border-green-200/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span>Easypaisa Account</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-green-950 uppercase mb-1">
                    Easypaisa Number / Mobile
                  </label>
                  <input
                    type="text"
                    value={settings.easypaisaNumber || ''}
                    onChange={(e) => setSettings({ ...settings, easypaisaNumber: e.target.value })}
                    placeholder="e.g. 0333-7654321"
                    className="w-full text-sm font-semibold p-3 rounded-xl border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-green-950 uppercase mb-1">
                    Easypaisa Account Title
                  </label>
                  <input
                    type="text"
                    value={settings.easypaisaTitle || ''}
                    onChange={(e) => setSettings({ ...settings, easypaisaTitle: e.target.value })}
                    placeholder="e.g. Al-Ghani Sweets"
                    className="w-full text-sm font-semibold p-3 rounded-xl border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            </div>

            {/* JazzCash */}
            <div className="p-5 bg-red-50/70 border border-red-200/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-red-600" />
                <span>JazzCash Account</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-red-950 uppercase mb-1">
                    JazzCash Number / Mobile
                  </label>
                  <input
                    type="text"
                    value={settings.jazzcashNumber || ''}
                    onChange={(e) => setSettings({ ...settings, jazzcashNumber: e.target.value })}
                    placeholder="e.g. 0300-1234567"
                    className="w-full text-sm font-semibold p-3 rounded-xl border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-950 uppercase mb-1">
                    JazzCash Account Title
                  </label>
                  <input
                    type="text"
                    value={settings.jazzcashTitle || ''}
                    onChange={(e) => setSettings({ ...settings, jazzcashTitle: e.target.value })}
                    placeholder="e.g. Al-Ghani Bakers"
                    className="w-full text-sm font-semibold p-3 rounded-xl border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account */}
          <div className="p-5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Building2 className="w-5 h-5 text-blue-700" />
              <span>Direct Bank Account / Transfer</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bankName || ''}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="e.g. Meezan Bank / HBL"
                  className="w-full text-sm font-semibold p-3 rounded-xl border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={settings.bankAccountTitle || ''}
                  onChange={(e) => setSettings({ ...settings, bankAccountTitle: e.target.value })}
                  placeholder="e.g. Al-Ghani Sweets & Bakers"
                  className="w-full text-sm font-semibold p-3 rounded-xl border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase mb-1">
                  Account No. / IBAN
                </label>
                <input
                  type="text"
                  value={settings.bankAccountNumber || ''}
                  onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                  placeholder="e.g. PK64MEZN0001234567890101"
                  className="w-full text-sm font-mono font-semibold p-3 rounded-xl border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-950 uppercase mb-1">
                Customer Payment Instructions (Shown during Checkout)
              </label>
              <input
                type="text"
                value={settings.paymentInstructions || ''}
                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                placeholder="e.g. Please transfer to the account above and enter your Transaction ID (TID) so staff can verify it immediately."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* 2. Financial & Business Rules Settings */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Percent className="w-5 h-5 text-brand-600" />
            <span>Financials & Order Calculations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Advance Percentage */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
              <label className="block text-xs font-bold text-amber-950 uppercase">
                Custom Cake Advance %
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={settings.advancePercentage}
                onChange={(e) => setSettings({ ...settings, advancePercentage: Number(e.target.value) })}
                className="w-full text-base font-extrabold p-2.5 rounded-xl border border-amber-300 bg-white"
              />
              <p className="text-[11px] text-amber-800">Default 30% advance rule for custom cakes.</p>
            </div>

            {/* Tax Percentage */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Sales Tax Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.taxPercentage}
                onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                className="w-full text-base font-extrabold p-2.5 rounded-xl border border-gray-300 bg-white"
              />
              <p className="text-[11px] text-gray-500">Government sales tax (e.g. 18%).</p>
            </div>

            {/* Delivery Fee */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Base Delivery Fee (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={settings.deliveryFee}
                onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                className="w-full text-base font-extrabold p-2.5 rounded-xl border border-gray-300 bg-white"
              />
              <p className="text-[11px] text-gray-500">Standard rider charge per delivery.</p>
            </div>
          </div>

          {/* Minimum Order Value */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Minimum Order Value (Rs.)
            </label>
            <input
              type="number"
              min={0}
              value={settings.minOrderValue}
              onChange={(e) => setSettings({ ...settings, minOrderValue: Number(e.target.value) })}
              className="w-full max-w-xs text-sm font-extrabold p-2.5 rounded-xl border border-gray-300 bg-white"
            />
            <p className="text-[11px] text-gray-500">Triggers persistent cart nudge: "You're Rs. X away from minimum order".</p>
          </div>
        </div>

        {/* 3. Business Identity & Public Contacts */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand-600" />
            <span>Storefront Identity & Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Support Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Store Public Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Store Physical Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              About / Discover Text (Footer Block)
            </label>
            <textarea
              rows={3}
              value={settings.aboutText}
              onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Store & Bank Info'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 4. Admin Security & Login Credentials Change Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Admin Access
          </span>
          <h3 className="font-serif text-xl font-extrabold text-gray-900 mt-0.5 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-600" />
            <span>Change Admin Email & Password</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Update the email and password you use to sign in to this admin dashboard.
          </p>
        </div>

        {authFeedback && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-5 h-5 text-green-600 shrink-0" />
            <span>{authFeedback}</span>
          </div>
        )}

        {authError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateAdminCredentials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Current Admin Email
              </label>
              <input
                type="text"
                disabled
                value={currentAdminEmail}
                className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                New Admin Email
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter new email address"
                className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Password Update</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full text-sm p-3 pr-10 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full text-sm p-3 pr-10 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updatingAuth}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-md transition disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-brand-400" />
              <span>{updatingAuth ? 'Updating...' : 'Update Login Credentials'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
