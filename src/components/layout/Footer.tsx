'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Heart,
} from 'lucide-react';

interface FooterProps {
  businessName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  aboutText?: string;
}

export default function Footer({
  businessName = 'Al-Ghani Sweets & Bakers',
  tagline = 'Freshly Baked Delights & Royal Sweets',
  phone = '042-35800000',
  email = 'support@alghanisweets.com',
  address = 'Main Boulevard, Allama Iqbal Town / Gulberg, Lahore, Pakistan',
  aboutText = 'Al-Ghani Sweets & Bakers has been serving freshly baked delights, premium occasion cakes, royal traditional sweets, and mouth-watering fast food for generations. We take pride in using only the finest ingredients, pure desi ghee, and time-tested recipes to bring warmth and happiness to your family celebrations.',
}: FooterProps) {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  return (
    <footer className="w-full bg-brand-dark text-amber-100 border-t-4 border-brand-500 mt-16">
      {/* 1. Category Page Footer Block: Discover Al-Ghani (Section 2.6) */}
      <div className="bg-[#2a1306] border-b border-amber-900/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-amber-300">
            Discover {businessName}
          </h3>
          <div className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
            <p className={isAboutExpanded ? '' : 'line-clamp-2'}>
              {aboutText}
            </p>
          </div>
          <button
            onClick={() => setIsAboutExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
          >
            <span>{isAboutExpanded ? 'Show Less' : 'Show More'}</span>
            {isAboutExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Site Footer (Section 2.7) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0 bg-white rounded-full p-1 shadow-md">
                <Image
                  src="/images/logo/logo.png"
                  alt={businessName}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h4 className="font-serif font-extrabold text-white text-base leading-tight">
                  {businessName}
                </h4>
                <p className="text-xs text-amber-300/90 font-medium">{tagline}</p>
              </div>
            </div>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              Delivering freshness, taste, and tradition to your doorstep with 100% halal ingredients and supreme hygiene.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 hover:text-white flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 hover:text-white flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 hover:text-white flex items-center justify-center transition"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-500 hover:text-white flex items-center justify-center transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-amber-300 uppercase tracking-wider">
              Get in Touch
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/90">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="hover:text-amber-300 inline-flex items-center py-2.5 -my-2.5"
                >
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-amber-300 inline-flex items-center py-2.5 -my-2.5"
                >
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-amber-300 uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-amber-200/80">
              <li>
                <Link href="/#customized-cakes" className="hover:text-brand-400 transition">
                  Customized Cakes Order
                </Link>
              </li>
              <li>
                <Link href="/cakes" className="hover:text-brand-400 transition">
                  Cakes
                </Link>
              </li>
              <li>
                <Link href="/#sweets" className="hover:text-brand-400 transition">
                  Traditional Mithai
                </Link>
              </li>
              <li>
                <Link href="/biscuits-cookies" className="hover:text-brand-400 transition">
                  Biscuits &amp; Cookies
                </Link>
              </li>
              <li>
                <Link href="/gift-essentials" className="hover:text-brand-400 transition">
                  Gift Essentials
                </Link>
              </li>
              <li>
                <Link href="/fast-food" className="hover:text-brand-400 transition">
                  Fast Food & Deals
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-brand-400 transition">
                  Support &amp; Help Center
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-400 transition flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                  <span>Admin & Staff Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-amber-300 uppercase tracking-wider">
              Payment Methods
            </h4>
            <p className="text-xs text-amber-200/70">
              We accept Cash on Delivery, JazzCash, Easypaisa, Meezan Bank transfer, and Online Debit/Credit cards.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded bg-white/10 text-white font-bold text-[11px]">
                COD
              </span>
              <span className="px-2.5 py-1 rounded bg-red-900/60 text-red-200 font-bold text-[11px]">
                JazzCash
              </span>
              <span className="px-2.5 py-1 rounded bg-green-900/60 text-green-200 font-bold text-[11px]">
                Easypaisa
              </span>
              <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-200 font-bold text-[11px]">
                Meezan Bank
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Credit Line */}
        <div className="pt-8 mt-8 border-t border-amber-900/60 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-amber-300/70">
            <Link href="/legal/privacy-policy" className="hover:text-amber-300 transition">
              Privacy Policy
            </Link>
            <span className="text-amber-900/60">•</span>
            <Link href="/legal/terms-of-service" className="hover:text-amber-300 transition">
              Terms of Service
            </Link>
            <span className="text-amber-900/60">•</span>
            <Link href="/legal/refund-policy" className="hover:text-amber-300 transition">
              Refund &amp; Cancellation
            </Link>
            <span className="text-amber-900/60">•</span>
            <Link href="/legal/shipping-policy" className="hover:text-amber-300 transition">
              Shipping &amp; Delivery
            </Link>
            <span className="text-amber-900/60">•</span>
            <Link href="/legal/disclaimer" className="hover:text-amber-300 transition">
              Disclaimer
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-300/60">
            <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
            <p className="flex items-center gap-1 font-medium">
              <span>Powered by</span>
              <span className="text-brand-400 font-bold">Al-Ghani Digital Systems</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
