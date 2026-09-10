'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const email = searchParams?.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const missingParams = !token || !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reset password.');
      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-amber-900/40 space-y-6">
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto rounded-full bg-brand-50 p-2 shadow-inner">
            <Image
              src="/images/logo/logo.png"
              alt="Al-Ghani Sweets & Bakers"
              fill
              sizes="64px"
              className="object-contain p-2"
            />
          </div>
          <div>
            <h1 className="font-serif text-xl font-extrabold text-brand-dark">Set a New Password</h1>
            {email && <p className="text-xs text-gray-500 font-medium mt-0.5">for {email}</p>}
          </div>
        </div>

        {missingParams ? (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>This reset link is missing required information. Please request a new one.</span>
          </div>
        ) : success ? (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Password updated! Redirecting you to sign in...</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white text-gray-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <Link
          href="/admin/login"
          className="block text-center text-xs font-bold text-gray-500 hover:text-brand-600 transition"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
