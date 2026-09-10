import React from 'react';
import Link from 'next/link';
import { getDashboardStats, getOrders } from '@/db/store';
import { formatPKR, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Clock,
  Banknote,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Phone,
  Cake,
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getOrders({ status: 'ALL' }),
  ]);

  const topRecentOrders = recentOrders.data.slice(0, 6);
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Live Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time status of orders, dispatch, and advance payments.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition"
        >
          <span>Open Full Orders Table</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4 Exact Urgency Cards from Section 9.1 D */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: New Orders Today */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              New Orders Today
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {stats.todayOrdersCount}
            </div>
            <span className="text-[11px] text-green-600 font-semibold">Live incoming</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Orders Still Pending Action */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pending Action
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {stats.pendingActionCount}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">Needs packing / confirmation</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Today's Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-brand-dark">
              {formatPKR(stats.todayRevenue)}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Total sales recorded</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Customized Orders Awaiting Advance-Payment Confirmation (CRITICAL) */}
        <div className="bg-white p-5 rounded-3xl border border-red-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Unconfirmed Advance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700">
              {stats.customizedPendingAdvanceCount}
            </div>
            <span className="text-[11px] text-red-500 font-semibold">Custom cakes awaiting verification</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Filter Cards (Clean Modern High-Contrast Light Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/orders?containsCustomizedCake=true"
          className="p-5 bg-white border-2 border-purple-100 hover:border-purple-300 rounded-3xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Cake className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                <span>Customized Cakes Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase">30% Adv</span>
              </div>
              <p className="text-xs text-gray-500">
                Multi-step customized cake orders requiring advance confirmation.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-700 group-hover:translate-x-1 transition shrink-0" />
        </Link>

        <Link
          href="/admin/orders?status=PENDING"
          className="p-5 bg-white border-2 border-amber-100 hover:border-amber-300 rounded-3xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                <span>Pending Orders Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">Action Needed</span>
              </div>
              <p className="text-xs text-gray-500">
                Incoming orders awaiting kitchen confirmation and dispatch.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-700 group-hover:translate-x-1 transition shrink-0" />
        </Link>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">
              Recent Orders
            </h2>
            <p className="text-xs text-gray-500">Most recent customer orders placed online.</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gray-100 overflow-x-auto">
          {topRecentOrders.map((order) => {
            const isNew = !order.isViewedByAdmin;
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="p-4 hover:bg-brand-50/40 flex items-center justify-between gap-4 transition block"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Visual NEW badge */}
                  {isNew ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-red-600 text-white animate-pulse">
                      NEW
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-dark">{order.id}</span>
                      <span className="text-xs text-gray-400">• {formatDate(order.createdAt)}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {order.customerTitle} {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{order.deliveryAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  {order.containsCustomizedCake && (
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                      Custom Cake (30% Adv)
                    </span>
                  )}

                  <div>
                    <span className="text-sm font-extrabold text-brand-dark block">
                      {formatPKR(order.grandTotal)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.orderStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : order.orderStatus === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
