'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/utils';
import { ArrowRight, Search, ChevronUp, Sparkles, X } from 'lucide-react';

interface FloatingActionsProps {
  whatsappNumber?: string;
  onSearchClick?: () => void;
}

export default function FloatingActions({
  whatsappNumber = '+923001234567',
  onSearchClick,
}: FloatingActionsProps) {
  const {
    items,
    totalItemsCount,
    grandTotal,
    minOrderRemaining,
    openCartDrawer,
  } = useCart();

  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // "Back to Top" only appears once the visitor has actually scrolled down
  // a bit — showing it pinned to the corner from the very top of the page
  // (where there's nothing to scroll back up to) is just visual clutter.
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-show tooltip after 2s, auto-hide after 6s
  useEffect(() => {
    const showTimer = setTimeout(() => setShowWhatsAppTooltip(true), 2000);
    const hideTimer = setTimeout(() => setShowWhatsAppTooltip(false), 8000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const cleanWhatsApp = whatsappNumber.replace(/[^0-9]/g, '');

  const scrollToSearch = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      const searchEl = document.getElementById('main-search-bar');
      if (searchEl) {
        searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = searchEl.querySelector('input');
        input?.focus();
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Minimum Order Nudge Floating Pill */}
      {items.length > 0 && minOrderRemaining > 0 && (
        <div className="fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[90%] pointer-events-none animate-bounce">
          <div className="bg-gray-900/90 text-amber-300 text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-md border border-amber-500/40 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
            <span>
              You're <strong>{formatPKR(minOrderRemaining)}</strong> away from minimum order
            </span>
          </div>
        </div>
      )}

      {/* 2. Floating Search Button (Fixed Bottom-Left - matching screenshot) */}
      <button
        onClick={scrollToSearch}
        className="fixed bottom-6 left-4 z-30 w-12 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
        title="Quick Search"
        aria-label="Search"
      >
        <Search className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* 3. Floating WhatsApp & Scroll-to-Top (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-3">
        {/* WhatsApp Button with Glowing Effect + Tooltip */}
        <div className="relative flex items-center">
          {/* "Order via WhatsApp" Tooltip */}
          {showWhatsAppTooltip && (
            <div className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 animate-fadeInLeft">
              <div className="bg-white rounded-full shadow-xl border border-gray-100 pl-4 pr-3 py-2.5 flex items-center gap-3 whitespace-nowrap min-w-[220px]">
                <div className="w-2.5 h-2.5 bg-[#25D366] rounded-full animate-pulse shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-bold text-gray-800">Order via WhatsApp</span>
                  <span className="text-[11px] text-gray-500 font-medium">Live agent online & ready</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWhatsAppTooltip(false);
                  }}
                  className="ml-1 text-gray-300 hover:text-gray-500 transition p-0.5"
                  aria-label="Close tooltip"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Glowing Pulse Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366]/30 animate-whatsappPing" />
            <span className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366]/20 animate-whatsappPing2" />
          </div>

          {/* WhatsApp Button */}
          <a
            href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
              'Hello Al-Ghani Sweets & Bakers, I would like to inquire about your products/orders.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] text-white rounded-full shadow-[0_4px_24px_rgba(37,211,102,0.45)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-10"
            title="Chat on WhatsApp"
            aria-label="WhatsApp Support"
            onMouseEnter={() => setShowWhatsAppTooltip(true)}
          >
            {/* Official WhatsApp SVG Icon */}
            <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9 fill-white">
              <path d="M16.004 2.003C8.268 2.003 2.004 8.267 2.004 16.003c0 2.467.644 4.881 1.869 7.008L2 30l7.188-1.884A13.94 13.94 0 0 0 16.004 30c7.735 0 13.996-6.264 13.996-14S23.738 2.003 16.004 2.003Zm0 25.594a11.58 11.58 0 0 1-5.906-1.617l-.424-.252-4.39 1.151 1.172-4.276-.276-.44a11.54 11.54 0 0 1-1.776-6.16c0-6.408 5.216-11.62 11.627-11.62 6.408 0 11.624 5.212 11.624 11.62-.003 6.41-5.22 11.594-11.651 11.594Zm6.372-8.699c-.348-.176-2.068-1.02-2.39-1.136-.32-.116-.553-.176-.784.176-.232.348-.9 1.136-1.104 1.368-.204.232-.404.264-.752.088-.348-.176-1.468-.54-2.796-1.72-1.032-.92-1.728-2.056-1.932-2.404-.204-.348-.02-.536.152-.708.156-.156.348-.404.524-.608.176-.204.232-.348.348-.58.116-.232.06-.436-.028-.608-.088-.176-.784-1.892-1.076-2.592-.284-.68-.572-.588-.784-.6l-.668-.012c-.232 0-.608.088-.924.436-.32.348-1.212 1.184-1.212 2.888s1.24 3.348 1.416 3.58c.176.232 2.444 3.732 5.924 5.236.828.356 1.472.568 1.976.728.832.264 1.588.228 2.184.14.668-.1 2.068-.848 2.36-1.664.292-.82.292-1.52.204-1.664-.088-.148-.32-.232-.668-.408Z" />
            </svg>
          </a>
        </div>

        {/* Scroll To Top Button — fades/scales in once there's actually
            something to scroll back up to. */}
        <button
          onClick={scrollToTop}
          className={`w-11 h-11 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 ${
            showBackToTop ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          title="Back to Top"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      {/* 4. Sticky Bottom View Cart Pill (Center Bottom - matching screenshot) */}
      {items.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-slideUp">
          <button
            onClick={openCartDrawer}
            className="py-3 px-6 sm:px-8 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold rounded-full shadow-2xl flex items-center gap-3 text-sm sm:text-base border-2 border-white/40 transition group"
          >
            {/* White Circle Badge */}
            <span className="w-6 h-6 rounded-full bg-white text-brand-600 flex items-center justify-center text-xs font-black">
              {totalItemsCount}
            </span>
            <span className="tracking-wide font-extrabold">View Cart</span>
            <span className="font-mono font-bold tracking-tight">
              {formatPKR(grandTotal)}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition stroke-[2.5]" />
          </button>
        </div>
      )}
    </>
  );
}
