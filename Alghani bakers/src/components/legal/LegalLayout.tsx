import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
  isTemplate?: boolean;
}

// Shared shell for every /legal/* page so they look consistent with the
// rest of the storefront instead of being plain unstyled text dumps.
export default function LegalLayout({ title, lastUpdated, children, isTemplate }: LegalLayoutProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-600 transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Homepage</span>
      </Link>

      <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900">{title}</h1>
      {lastUpdated && <p className="text-xs text-gray-400 font-medium mt-1.5">Last updated: {lastUpdated}</p>}

      {isTemplate && (
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm leading-relaxed">
          <strong>Note for the business owner:</strong> This is a starting template. Sections marked{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded font-mono text-[11px]">[PLACEHOLDER]</code> need
          your specific legal business name, registered address, and jurisdiction before this page is
          published live. We'd recommend a lawyer reviews the final version for your specific situation —
          this template is a reasonable starting point, not legal advice.
        </div>
      )}

      <div className="prose-legal mt-8 space-y-6 text-sm sm:text-[15px] text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
