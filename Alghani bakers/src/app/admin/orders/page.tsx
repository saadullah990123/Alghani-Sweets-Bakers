'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { formatPKR, formatDate } from '@/lib/utils';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';
import {
  Search,
  Filter,
  ArrowUpDown,
  Cake,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Eye,
  Phone,
  RefreshCw,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [customCakeFilter, setCustomCakeFilter] = useState(false);
  const [sortField, setSortField] = useState<'createdAt' | 'grandTotal' | 'id'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Server-driven pagination (Finding 8-A) — the API returns only the
  // current page's rows plus totals, instead of every order matching the
  // filters ever being loaded into the browser at once.
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Debounce the free-text search so every keystroke doesn't trigger its
  // own network request — only fetch ~400ms after the admin stops typing.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (paymentFilter !== 'ALL') params.set('paymentMethod', paymentFilter);
      if (customCakeFilter) params.set('containsCustomizedCake', 'true');
      params.set('sortField', sortField);
      params.set('sortOrder', sortOrder);
      params.set('page', String(currentPage));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('The server returned an error while loading orders.');
      const result = await res.json();
      setOrders(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
      // The API clamps an out-of-range page to the last valid one — keep
      // our own state in sync so the pager UI reflects that.
      if (result.page !== currentPage) setCurrentPage(result.page);
    } catch (e) {
      console.error('Failed to fetch admin orders:', e);
      setLoadError('Could not load orders. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, paymentFilter, customCakeFilter, sortField, sortOrder, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Any change to a filter or sort should always jump back to page 1 —
  // otherwise an admin could land on "page 4" of a now much-smaller
  // filtered result set.
  const resetToFirstPage = () => setCurrentPage(1);

  const handleSort = (field: 'createdAt' | 'grandTotal' | 'id') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    resetToFirstPage();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Order Management (Section 9.1)
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Customer Orders List
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Total {totalItems} {totalItems === 1 ? 'order' : 'orders'} matching filters
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {loadError && <AdminErrorBanner message={loadError} onRetry={fetchOrders} />}

      {/* Search & Filter Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by customer name, mobile phone (0300...), or Order ID (AGB-...)"
            className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white text-gray-900"
          />
        </div>

        {/* Filter Pills & Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetToFirstPage();
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-brand-400"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING">Pending Action</option>
              <option value="PREPARING">Preparing</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                resetToFirstPage();
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-brand-400"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="JAZZCASH">JazzCash</option>
              <option value="EASYPAISA">Easypaisa</option>
              <option value="MEEZAN_BANK">Meezan Bank</option>
              <option value="ONLINE_CARD">Online Card</option>
            </select>

            {/* Specialized "Contains Customized Cake" Filter (Section 9.1 A) */}
            <button
              onClick={() => {
                setCustomCakeFilter((prev) => !prev);
                resetToFirstPage();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                customCakeFilter
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Contains Customized Cake</span>
            </button>
          </div>

          {/* Sort trigger */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span>Sort by:</span>
            <button
              onClick={() => handleSort('createdAt')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                sortField === 'createdAt' ? 'bg-brand-50 border-brand-300 text-brand-900' : 'border-gray-200'
              }`}
            >
              <span>Date</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSort('grandTotal')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                sortField === 'grandTotal' ? 'bg-brand-50 border-brand-300 text-brand-900' : 'border-gray-200'
              }`}
            >
              <span>Amount</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Orders Table (Section 9.1 A) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-brand-50/70 border-b border-brand-100 text-brand-900 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4">Order ID</th>
                <th className="py-4 px-4">Date / Time</th>
                <th className="py-4 px-4">Customer Name</th>
                <th className="py-4 px-4">Phone Number</th>
                <th className="py-4 px-4 text-center">Items</th>
                <th className="py-4 px-4">Total (Rs.)</th>
                <th className="py-4 px-4">Payment</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500 text-sm">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500 text-sm">
                    No orders found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isNew = !order.isViewedByAdmin;
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-amber-50/30 transition group ${
                        isNew ? 'bg-amber-50/50 font-semibold' : ''
                      }`}
                    >
                      {/* Order ID + NEW badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isNew && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-600 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono font-bold text-brand-dark hover:text-brand-600 underline decoration-dotted"
                          >
                            {order.id}
                          </Link>
                        </div>
                      </td>

                      {/* Date / Time */}
                      <td className="py-4 px-4 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {order.customerTitle} {order.customerName}
                        </div>
                        {order.containsCustomizedCake && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800">
                            Custom Cake
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-600">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="hover:text-brand-700 font-medium"
                        >
                          {order.customerPhone}
                        </a>
                      </td>

                      {/* Items count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-xs">
                          {order.items?.length || 1}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-brand-dark">
                          {formatPKR(order.grandTotal)}
                        </span>
                        {order.containsCustomizedCake && (
                          <span className="block text-[10px] text-purple-700">
                            Adv: {formatPKR(order.advanceRequired)}
                          </span>
                        )}
                      </td>

                      {/* Payment Method & Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs uppercase text-gray-800 block">
                            {order.paymentMethod}
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : order.paymentStatus === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : order.paymentStatus === 'PENDING_VERIFICATION'
                                ? 'bg-orange-100 text-orange-800'
                                : order.advanceConfirmed || order.paymentStatus === 'ADVANCE_PAID'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.advanceConfirmed
                              ? 'Adv Confirmed'
                              : order.paymentStatus === 'ADVANCE_PAID'
                              ? 'Adv Received'
                              : order.paymentStatus === 'PENDING_VERIFICATION'
                              ? 'Verify Payment'
                              : order.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                            order.orderStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : order.orderStatus === 'PREPARING'
                              ? 'bg-blue-100 text-blue-800'
                              : order.orderStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-indigo-100 text-indigo-800'
                              : order.orderStatus === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar — server-driven: each click fetches that page's
            rows from the API rather than slicing an already-fetched array. */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages} &middot; {totalItems} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="w-8 h-8 rounded-lg text-xs font-bold transition bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                // For a large number of pages, only show a window around the
                // current page plus the first/last, so this bar never grows
                // unbounded alongside the (also now-bounded) result set.
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-300 text-xs">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        currentPage === p
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="w-8 h-8 rounded-lg text-xs font-bold transition bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
