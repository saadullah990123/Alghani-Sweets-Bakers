'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle, Clock } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams?.get('expired') === '1') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-amber-900/40 space-y-6 animate-scaleUp">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto rounded-full bg-brand-50 p-2 shadow-inner">
            <Image
              src="/images/logo/logo.png"
              alt="Al-Ghani Sweets & Bakers"
              fill
              sizes="80px"
              className="object-contain p-2"
              priority
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-extrabold text-brand-dark">
              Al-Ghani Bakers
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Secure Management & Order Dispatch Portal
            </p>
          </div>
        </div>

        {/* Session Expired Notice */}
        {sessionExpired && !error && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Your session expired. Please sign in again.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@alghanisweets.com"
                className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <a href="/admin/forgot-password" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
