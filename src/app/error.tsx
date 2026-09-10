'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console (and, in a real deployment, to an error-tracking
    // service) so this failure is never silent.
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <div>
          <p className="font-serif text-5xl font-extrabold text-red-500">500</p>
          <h1 className="font-serif text-2xl font-extrabold text-gray-900 mt-2">
            Something went wrong on our end
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Our kitchen hit an unexpected snag. This has been logged — please try again, and if it keeps
            happening, contact us so we can look into it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition w-full sm:w-auto justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-2xl transition w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
