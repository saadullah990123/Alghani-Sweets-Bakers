'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// Global connectivity banner. Listens to the browser's online/offline
// events (and does an initial navigator.onLine check on mount) so the
// customer/admin always gets a visible signal instead of silently failing
// fetches with no explanation.
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-red-600 text-white text-xs sm:text-sm font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You're offline. Some features may not work until your connection is restored.</span>
    </div>
  );
}
