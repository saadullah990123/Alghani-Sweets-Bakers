'use client';

import { useEffect } from 'react';

// global-error.tsx catches errors thrown by the root layout itself (where
// error.tsx cannot help, since it renders *inside* that layout). It must
// render its own <html>/<body> because it replaces the entire root layout.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: '#faf7f2',
          }}
        >
          <div style={{ maxWidth: '28rem' }}>
            {/* Intentional exception to the brand-* token rule (see AGENTS.md → Theming):
                global-error.tsx replaces the entire <html> document, so it must render
                correctly even if the Tailwind stylesheet fails to load. Inline styles with
                a literal hex (kept in sync with brand-600, #c8102e) are deliberate here. */}
            <p style={{ fontSize: '3rem', fontWeight: 800, color: '#c8102e', margin: 0 }}>500</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', marginTop: '0.5rem' }}>
              Something went seriously wrong
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              The site failed to load. Please try again — this has been logged.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                background: '#c8102e',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: '1rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
