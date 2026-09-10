'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

// Reusable, visible failure banner for admin list pages. Before this
// component existed, a failed fetch only logged to the browser console —
// the admin saw a silently empty page with no indication anything had gone
// wrong. Every admin data page should show this instead of failing quietly.
export default function AdminErrorBanner({ message, onRetry }: AdminErrorBannerProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <span className="text-sm font-semibold">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
