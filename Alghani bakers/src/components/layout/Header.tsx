'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { Category } from '@/lib/types';
import { DEDICATED_CATEGORY_ROUTES } from '@/components/layout/TwoTierCategoryNav';
import {
  MapPin,
  Phone,
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  MessageSquareWarning,
  ShieldCheck,
  Camera,
  CheckCircle,
  Loader2,
  Package,
  Search,
  Clock,
  Truck,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  businessName?: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  categories?: Category[];
}

export default function Header({
  businessName = 'Al-Ghani Sweets & Bakers',
  tagline = 'Freshly Baked Delights & Royal Sweets',
  phone = '042-35800000',
  whatsapp,
  categories = [],
}: HeaderProps) {
  const { totalItemsCount, openCartDrawer } = useCart();
  const { currentAddress, openLocationModal } = useLocation();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintPhone, setComplaintPhone] = useState('');
  const [complaintName, setComplaintName] = useState('');
  const [complaintImage, setComplaintImage] = useState<File | null>(null);
  const [complaintImagePreview, setComplaintImagePreview] = useState<string | null>(null);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track Order State
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState('');

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackOrderId.trim();
    if (!clean) {
      setTrackError('Please enter your Order ID');
      return;
    }
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);

    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        setTrackResult(data);
      } else if (res.status === 404) {
        setTrackError('No order found with this Reference ID. Please check the ID and try again.');
      } else {
        throw new Error('Failed to fetch order');
      }
    } catch (err) {
      setTrackError('Could not fetch order status. Please check your connection.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    setComplaintImage(file);
    setComplaintImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setComplaintImage(null);
    if (complaintImagePreview) URL.revokeObjectURL(complaintImagePreview);
    setComplaintImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // Upload image first if provided
      if (complaintImage) {
        const formData = new FormData();
        formData.append('file', complaintImage);
        const uploadRes = await fetch('/api/complaints/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          imageUrl = uploadData.url;
        }
      }

      // Submit the complaint
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: complaintPhone,
          customerName: complaintName || undefined,
          description: complaintText,
          imageUrl,
        }),
      });

      setComplaintSubmitted(true);
      setTimeout(() => {
        setComplaintSubmitted(false);
        setComplaintModalOpen(false);
        setComplaintText('');
        setComplaintPhone('');
        setComplaintName('');
        removeImage();
      }, 2500);
    } catch (err) {
      console.error('Complaint submission error:', err);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const cleanWhatsApp = (whatsapp || phone).replace(/[^0-9]/g, '');

  const closeDrawer = () => setMobileMenuOpen(false);

  // Lock background scroll while the bottom-sheet drawer is open, so the
  // page underneath doesn't scroll along with a swipe/drag inside the
  // sheet — standard modal/bottom-sheet behavior. Always restored on
  // close/unmount so it can never get stuck locked.
  useEffect(() => {
    if (mobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // A category tap in the drawer either goes to its dedicated page (Cakes,
  // Fast Food, Biscuits & Cookies, Gift Essentials) or — for the categories
  // that are still filtered in-place on the homepage — to `/` with a
  // `?category=` (and optionally `?subcategory=`) param that
  // StorefrontView picks up once on mount. See that component's comment
  // for why this is a one-shot client-side redirect rather than a fully
  // URL-driven filter.
  const goToCategory = (categoryId: string, subcategoryId?: string) => {
    const dedicatedRoute = DEDICATED_CATEGORY_ROUTES[categoryId];
    if (dedicatedRoute) {
      router.push(dedicatedRoute);
    } else {
      const params = new URLSearchParams({ category: categoryId });
      if (subcategoryId) params.set('subcategory', subcategoryId);
      router.push(`/?${params.toString()}`);
    }
    closeDrawer();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Store Location Badge & Support Phone Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Store Location Badge (Fixed — not clickable) */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gray-200 bg-gray-50/80 text-left min-h-[44px]"
              title="Mator Road, near Kahuta Bus Stand, Kahuta"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600" />
              </div>
              <div className="text-[11px] sm:text-xs leading-tight">
                <span className="block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Bakery Location
                </span>
                <span className="font-bold text-gray-800 max-w-[140px] sm:max-w-[220px] truncate block">
                  Mator Road, near Kahuta Bus Stand, Kahuta
                </span>
              </div>
            </div>

            {/* Phone Pill (desktop only — mobile gets the icon-only WhatsApp
                quick-contact button on the right instead, see below) */}
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-gray-800 text-xs font-bold min-h-[44px]"
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                <Phone className="w-3.5 h-3.5 text-gray-800" />
              </div>
              <span>{phone}</span>
            </a>
          </div>

          {/* Center: Official Logo Badge */}
          <div className="flex items-center justify-center flex-1">
            <Link href="/" className="flex flex-col items-center group">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/images/logo/logo.png"
                  alt={businessName}
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Right: Track Order, Submit Complaint, quick-contact (mobile), Cart, Hamburger */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setTrackModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-brand-red transition min-h-[44px] px-2 py-1 rounded-xl hover:bg-brand-50/60"
            >
              <Package className="w-4 h-4 text-brand-600" />
              <span>Track Order</span>
            </button>

            <button
              onClick={() => setComplaintModalOpen(true)}
              className="hidden md:block text-xs font-bold text-gray-700 hover:text-brand-red transition min-h-[44px] px-2 py-1 rounded-xl hover:bg-brand-50/60"
            >
              Submit Complaint
            </button>

            {/* Quick-contact icon — visible on mobile only (desktop already
                has the full phone pill on the left). WhatsApp is the
                bakery's actual order-support channel (see FloatingActions),
                so this opens a chat rather than dialing. */}
            <a
              href={`https://wa.me/${cleanWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden flex items-center justify-center w-11 h-11 text-[#25D366] hover:bg-green-50 rounded-full transition"
              aria-label="Chat with us on WhatsApp"
              title="Chat with us on WhatsApp"
            >
              <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current">
                <path d="M16.004 2.003C8.268 2.003 2.004 8.267 2.004 16.003c0 2.467.644 4.881 1.869 7.008L2 30l7.188-1.884A13.94 13.94 0 0 0 16.004 30c7.735 0 13.996-6.264 13.996-14S23.738 2.003 16.004 2.003Zm0 25.594a11.58 11.58 0 0 1-5.906-1.617l-.424-.252-4.39 1.151 1.172-4.276-.276-.44a11.54 11.54 0 0 1-1.776-6.16c0-6.408 5.216-11.62 11.627-11.62 6.408 0 11.624 5.212 11.624 11.62-.003 6.41-5.22 11.594-11.651 11.594Zm6.372-8.699c-.348-.176-2.068-1.02-2.39-1.136-.32-.116-.553-.176-.784.176-.232.348-.9 1.136-1.104 1.368-.204.232-.404.264-.752.088-.348-.176-1.468-.54-2.796-1.72-1.032-.92-1.728-2.056-1.932-2.404-.204-.348-.02-.536.152-.708.156-.156.348-.404.524-.608.176-.204.232-.348.348-.58.116-.232.06-.436-.028-.608-.088-.176-.784-1.892-1.076-2.592-.284-.68-.572-.588-.784-.6l-.668-.012c-.232 0-.608.088-.924.436-.32.348-1.212 1.184-1.212 2.888s1.24 3.348 1.416 3.58c.176.232 2.444 3.732 5.924 5.236.828.356 1.472.568 1.976.728.832.264 1.588.228 2.184.14.668-.1 2.068-.848 2.36-1.664.292-.82.292-1.52.204-1.664-.088-.148-.32-.232-.668-.408Z" />
              </svg>
            </a>

            {/* Cart Icon with red badge on top right */}
            <button
              onClick={openCartDrawer}
              className="relative flex items-center justify-center w-11 h-11 text-gray-800 hover:text-brand-red transition"
              aria-label="Open Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
              {totalItemsCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-extrabold bg-brand-600 text-white rounded-full shadow-sm animate-scaleUp">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu — opens the bottom-sheet nav drawer */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center justify-center w-11 h-11 text-gray-800 hover:text-brand-red transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer — bottom sheet, matches the reference
          screenshots: a "Menu" panel sliding up from the bottom with a drag
          handle, listing every category (bold, tappable) with its
          subcategories indented underneath, then quick actions below. */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 animate-overlayIn"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 w-full sm:w-[420px] max-h-[85vh] sm:max-h-[80vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-sheetUp"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <h2 className="font-serif text-xl font-extrabold text-gray-900">Menu</h2>
              <button
                onClick={closeDrawer}
                className="flex items-center justify-center w-11 h-11 -mr-2 text-gray-500 hover:text-gray-700 transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body: category tree + quick actions */}
            <div className="overflow-y-auto flex-1">
              {/* Category tree */}
              <nav aria-label="Product categories">
                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => goToCategory(category.id)}
                      className="w-full flex items-center justify-between text-left px-5 py-3.5 bg-gray-50 border-b border-gray-100 min-h-[44px]"
                    >
                      <span className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                        {category.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                    {(category.subcategories || []).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => goToCategory(category.id, sub.id)}
                        className="w-full text-left pl-8 pr-5 py-3 border-b border-gray-100 min-h-[44px] flex items-center"
                      >
                        <span className="text-sm font-semibold text-gray-600">{sub.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              {/* Quick actions */}
              <div className="p-5 space-y-3">
                <div className="w-full text-left p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 text-xs flex items-center gap-3 min-h-[44px]">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      Bakery Address
                    </span>
                    <span className="font-bold text-gray-900 text-xs leading-snug block">
                      Mator Road, near Kahuta Bus Stand, Kahuta
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold min-h-[44px]"
                >
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span>Call Bakery: {phone}</span>
                </a>

                <button
                  onClick={() => {
                    closeDrawer();
                    setTrackModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-sm font-bold min-h-[44px]"
                >
                  <Package className="w-4 h-4 text-brand-600" />
                  <span>Track Order Status</span>
                </button>

                <button
                  onClick={() => {
                    closeDrawer();
                    setComplaintModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold min-h-[44px]"
                >
                  <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                  <span>Submit Complaint / Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-amber-500" />
                <span>Submit Complaint / Feedback</span>
              </h3>
              <button
                onClick={() => {
                  setComplaintModalOpen(false);
                  removeImage();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {complaintSubmitted ? (
              <div className="p-6 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-bold text-base">Thank you for reaching out!</p>
                <p className="text-xs">Your feedback has been received. Our manager will review it and contact you promptly.</p>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={complaintName}
                    onChange={(e) => setComplaintName(e.target.value)}
                    placeholder="Muhammad Ali"
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={complaintPhone}
                    onChange={(e) => setComplaintPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Describe your issue or feedback *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    placeholder="Please tell us about your experience..."
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Attach Photo (Optional)
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">Upload a photo of the product issue (JPG, PNG, or WEBP — max 5 MB)</p>

                  {complaintImagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={complaintImagePreview}
                        alt="Complaint attachment preview"
                        className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-600 hover:bg-brand-50/30 text-gray-500 hover:text-brand-600 transition w-full justify-center"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-sm font-semibold">Tap to Upload Photo</span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={complaintSubmitting}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {complaintSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Complaint</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Track Order Modal */}
      {trackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <span>Track Your Order</span>
              </h3>
              <button
                onClick={() => {
                  setTrackModalOpen(false);
                  setTrackResult(null);
                  setTrackError('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Order Reference ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={trackOrderId}
                    onChange={(e) => setTrackOrderId(e.target.value)}
                    placeholder="e.g. AGB-20260908-3093 or 3093"
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={trackLoading}
                    className="px-5 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5"
                  >
                    {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{trackLoading ? 'Searching...' : 'Track'}</span>
                  </button>
                </div>
              </div>
            </form>

            {trackError && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <X className="w-4 h-4 text-red-600 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {trackResult && (
              <div className="mt-5 space-y-4 border-t border-gray-100 pt-4 animate-fadeIn">
                <div className="flex items-center justify-between bg-brand-50 p-3.5 rounded-2xl border border-brand-200">
                  <div>
                    <p className="text-[11px] font-bold text-brand-900 uppercase">Order Status</p>
                    <p className="font-extrabold text-base text-gray-900">{trackResult.orderStatus?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="px-3 py-1 bg-white text-brand-600 rounded-full text-xs font-bold shadow-sm font-mono">
                    {trackResult.id}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-bold text-gray-900">{trackResult.customerTitle} {trackResult.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Address:</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[220px]">{trackResult.deliveryAddress || 'Pickup'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Grand Total:</span>
                    <span className="font-extrabold text-brand-600 text-sm">Rs. {trackResult.grandTotal?.toLocaleString()}</span>
                  </div>
                  {trackResult.containsCustomizedCake && trackResult.balanceDue > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold border-t border-dashed border-gray-200 pt-1.5">
                      <span>Balance Due on Delivery:</span>
                      <span>Rs. {trackResult.balanceDue?.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700">Items ({trackResult.items?.length}):</p>
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl">
                    {trackResult.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{item.productName}</p>
                          <p className="text-[11px] text-gray-500">Qty: {item.quantity} {item.variantName ? `(${item.variantName})` : ''}</p>
                        </div>
                        <span className="font-bold text-gray-900">Rs. {item.lineTotal?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/track-order?id=${encodeURIComponent(trackResult.id)}`}
                    onClick={() => setTrackModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Full Details Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={`https://wa.me/923001234567?text=${encodeURIComponent(`Hi Al-Ghani Bakers, checking status of order #${trackResult.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-center font-bold text-xs rounded-xl shadow transition"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
