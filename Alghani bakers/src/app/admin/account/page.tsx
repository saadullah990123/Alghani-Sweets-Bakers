'use client';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, AlertCircle, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';

export default function AdminAccountPage() {
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

  // Load current admin profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          setCurrentAdminEmail(data.email || '');
          setNewAdminEmail(data.email || '');
        } else {
          setAuthError('Failed to load admin profile');
        }
      } catch (e) {
        setAuthError('Network error while loading profile');
      }
    };
    fetchProfile();
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="font-serif text-2xl font-extrabold text-gray-900">Admin Account Settings</h1>

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
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Admin Email</label>
            <input type="text" disabled value={currentAdminEmail} className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Admin Email</label>
            <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Enter new email address" className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 font-medium" />
          </div>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Password Update</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Password *</label>
              <div className="relative">
                <input type={showCurrentPassword ? 'text' : 'password'} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full text-sm p-3 pr-10 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full text-sm p-3 pr-10 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={updatingAuth} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-md transition disabled:opacity-50">
            <KeyRound className="w-4 h-4 text-brand-400" />
            <span>{updatingAuth ? 'Updating...' : 'Update Login Credentials'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
