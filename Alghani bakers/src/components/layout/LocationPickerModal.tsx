'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { MapPin, X, Plus, Check, Navigation } from 'lucide-react';

export default function LocationPickerModal() {
  const {
    isLocationModalOpen,
    closeLocationModal,
    currentAddress,
    savedAddresses,
    setAddress,
    addSavedAddress,
  } = useLocation();

  const [customAddress, setCustomAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel] = useState('Home');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleSelectSaved = (addr: string, lnd?: string) => {
    setAddress(addr, lnd);
    closeLocationModal();
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim()) return;
    addSavedAddress(label, customAddress.trim(), landmark.trim());
    setShowAddForm(false);
    setCustomAddress('');
    setLandmark('');
    closeLocationModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-brand-100 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-brand-50/50">
          <div className="flex items-center gap-2 text-brand-dark font-semibold text-lg">
            <div className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span>Choose Delivery Location</span>
          </div>
          <button
            onClick={closeLocationModal}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Currently Selected */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Active Delivery Address:
            </span>
            <p className="text-sm font-medium text-gray-800 mt-1 flex items-start gap-1.5">
              <Navigation className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>{currentAddress}</span>
            </p>
          </div>

          {/* Saved Addresses List */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Saved Locations
            </h4>
            <div className="space-y-2">
              {savedAddresses.map((saved) => {
                const isSelected = saved.address === currentAddress;
                return (
                  <button
                    key={saved.id}
                    onClick={() => handleSelectSaved(saved.address, saved.landmark)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/40 text-brand-900 shadow-sm'
                        : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50/80 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-brand-100 text-brand-800">
                          {saved.label}
                        </span>
                        {saved.landmark && (
                          <span className="text-xs text-gray-500">
                            • {saved.landmark}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1 font-medium line-clamp-1">{saved.address}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add New Address Toggle/Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-brand-300 text-brand-700 hover:bg-brand-50/50 font-medium text-sm flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add a New Delivery Address</span>
            </button>
          ) : (
            <form onSubmit={handleSaveNew} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h5 className="text-sm font-semibold text-gray-800">New Address Details</h5>
              
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      label === l
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Full Street Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="House/Plot #, Street, Sector / Area, City"
                  className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nearest Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Moon Market / Main Gate"
                  className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Save & Deliver Here
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
