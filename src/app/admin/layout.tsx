'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Sliders,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Star,
  MessageSquareWarning,
} from 'lucide-react';
import OfflineBanner from '@/components/layout/OfflineBanner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // If on login page, don't show admin shell
  if (pathname === '/admin/login' || pathname === '/admin/forgot-password' || pathname === '/admin/reset-password') {
    return <>{children}</>;
  }

  const navLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Orders List', href: '/admin/orders', icon: ShoppingBag, badge: 'PRIORITY' },
    { name: 'Products & Variants', href: '/admin/products', icon: Package },
    { name: 'Categories & Sub', href: '/admin/categories', icon: Layers },
    { name: 'Hero Carousel', href: '/admin/hero-slides', icon: Sliders },
    { name: 'Customer Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Complaints', href: '/admin/complaints', icon: MessageSquareWarning, badge: 'NEW' },
    { name: 'Store Settings', href: '/admin/settings', icon: Settings },
    { name: 'Account Settings', href: '/admin/account', icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-800 flex flex-col md:flex-row antialiased">
      <OfflineBanner />

      {/* Desktop Navigation Sidebar (Exclusively Brand Dark Brown #3D1E0B with Golden/Amber Highlights) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#3D1E0B] text-white p-5 shrink-0 border-r border-[#2C1405] shadow-2xl">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-amber-900/40">
            <div className="relative w-11 h-11 shrink-0 bg-white rounded-xl p-1 shadow-md">
              <Image
                src="/images/logo/logo.png"
                alt="Al-Ghani"
                fill
                sizes="44px"
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-sm text-white leading-tight">
                Al-Ghani Bakers
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>ADMIN PORTAL</span>
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5" aria-label="Admin Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#532b10] text-amber-300 border-l-4 border-amber-400 shadow-md ring-1 ring-amber-400/20'
                      : 'text-amber-100/80 hover:bg-white/5 hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-amber-200/70'}`} />
                    <span className={isActive ? 'text-amber-300 font-extrabold' : ''}>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider bg-red-600 text-white shadow-sm animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-amber-900/40 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-200/80 hover:text-amber-300 hover:bg-white/5 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:text-red-200 hover:bg-red-950/30 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Top bar on Mobile */}
      <div className="md:hidden bg-[#3D1E0B] text-white px-4 py-3.5 flex items-center justify-between shadow-md border-b border-[#2C1405]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-white p-0.5">
            <Image src="/images/logo/logo.png" alt="Logo" fill sizes="32px" className="object-contain" />
          </div>
          <div>
            <span className="font-serif font-bold text-sm block leading-tight">Al-Ghani Admin</span>
            <span className="text-[10px] text-amber-400 font-extrabold uppercase">Portal</span>
          </div>
        </div>

        <button
          onClick={() => setMobileNavOpen((prev) => !prev)}
          className="p-2 rounded-lg bg-white/10 text-white"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden bg-[#3D1E0B] text-white p-4 space-y-2 border-b border-amber-900/60 shadow-xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-[#532b10] text-amber-300 border-l-4 border-amber-400'
                    : 'text-amber-100 hover:bg-white/10 hover:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-black bg-red-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-amber-900/60 flex justify-between items-center">
            <Link href="/" target="_blank" className="text-xs text-amber-200 hover:underline">
              View Public Website
            </Link>
            <button onClick={handleLogout} className="text-xs text-red-300 font-bold hover:underline">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Workspace (High-Contrast Clean Modern Light Theme) */}
      <main className="flex-1 overflow-y-auto min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8F9FA]">
        {children}
      </main>
    </div>
  );
}
