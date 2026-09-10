'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  MessageSquareWarning,
  Phone,
  Clock,
  CheckCircle2,
  Eye,
  AlertCircle,
  ImageIcon,
  X,
  ChevronDown,
  Loader2,
  User,
} from 'lucide-react';

interface Complaint {
  id: string;
  customerPhone: string;
  customerName?: string;
  description: string;
  imageUrl?: string;
  status: 'NEW' | 'REVIEWED' | 'RESOLVED';
  adminNotes?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  NEW: {
    label: 'New',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
    dot: 'bg-red-500',
  },
  REVIEWED: {
    label: 'Reviewed',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Eye,
    dot: 'bg-amber-500',
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: CheckCircle2,
    dot: 'bg-green-500',
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'REVIEWED' | 'RESOLVED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/admin/complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Complaint['status'], adminNotes?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes }),
      });
      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status, adminNotes: adminNotes ?? c.adminNotes } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update complaint:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredComplaints = filter === 'ALL' ? complaints : complaints.filter((c) => c.status === filter);

  const newCount = complaints.filter((c) => c.status === 'NEW').length;
  const reviewedCount = complaints.filter((c) => c.status === 'REVIEWED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Customer Support
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
              Complaints & Feedback
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Review customer complaints, view attached images, and manage resolutions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {newCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-700">{newCount} New</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
          <div className="text-2xl font-extrabold text-red-600">{newCount}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">New</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
          <div className="text-2xl font-extrabold text-amber-600">{reviewedCount}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reviewed</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
          <div className="text-2xl font-extrabold text-green-600">{resolvedCount}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'NEW', 'REVIEWED', 'RESOLVED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === f
                ? 'bg-[#3D1E0B] text-amber-300 shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? `All (${complaints.length})` : `${f} (${complaints.filter((c) => c.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200/80 shadow-sm text-center">
          <MessageSquareWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No complaints found</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter !== 'ALL' ? 'Try changing the filter above.' : 'Customers haven\'t submitted any complaints yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => {
            const config = STATUS_CONFIG[complaint.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === complaint.id;

            return (
              <div
                key={complaint.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  complaint.status === 'NEW' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200/80'
                }`}
              >
                {/* Complaint Header (always visible) */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${config.bg} ${config.text} ${config.border} border`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{complaint.id}</span>
                      {complaint.imageUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                          <ImageIcon className="w-3 h-3" />
                          Photo Attached
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-800 font-medium line-clamp-2">
                      {complaint.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {complaint.customerPhone}
                      </span>
                      {complaint.customerName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {complaint.customerName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50/30">
                    {/* Full Description */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Full Description
                      </h4>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {complaint.description}
                      </p>
                    </div>

                    {/* Attached Image */}
                    {complaint.imageUrl && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Attached Photo
                        </h4>
                        <button
                          onClick={() => setLightboxUrl(complaint.imageUrl!)}
                          className="relative group"
                        >
                          <img
                            src={complaint.imageUrl}
                            alt="Complaint attachment"
                            className="w-48 h-48 object-cover rounded-xl border-2 border-gray-200 shadow-sm group-hover:border-brand-600 transition"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {complaint.adminNotes && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                          Admin Notes
                        </h4>
                        <p className="text-sm text-amber-800">{complaint.adminNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      {complaint.status === 'NEW' && (
                        <button
                          onClick={() => updateStatus(complaint.id, 'REVIEWED')}
                          disabled={updatingId === complaint.id}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingId === complaint.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          Mark as Reviewed
                        </button>
                      )}
                      {complaint.status !== 'RESOLVED' && (
                        <button
                          onClick={() => updateStatus(complaint.id, 'RESOLVED')}
                          disabled={updatingId === complaint.id}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {updatingId === complaint.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Mark as Resolved
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${complaint.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#1da851] text-white shadow-sm transition flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Contact on WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxUrl}
              alt="Complaint photo full view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-white text-gray-800 rounded-full shadow-xl flex items-center justify-center hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
