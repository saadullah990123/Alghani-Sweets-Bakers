'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { HeroSlide } from '@/lib/types';
import { Plus, Trash2, Check, Save } from 'lucide-react';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loadError, setLoadError] = useState('');

  const heroImages = [
    '/images/hero/cruisel img1.jpg',
    '/images/hero/cruisel img2.jpg',
    '/images/hero/cruisel img3.jpg',
  ];

  const fetchSlides = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/slides');
      if (!res.ok) throw new Error('The server returned an error while loading slides.');
      setSlides(await res.json());
    } catch (e) {
      console.error('Failed to load slides:', e);
      setLoadError('Could not load hero slides. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: 'New Delicious Special',
      subtitle: 'Freshly baked goodness ready for fast home delivery',
      imageUrl: heroImages[0],
      actionLink: '#cakes',
      sortOrder: slides.length + 1,
      isActive: true,
    };
    setSlides([...slides, newSlide]);
  };

  const handleRemoveSlide = (idx: number) => {
    setSlides(slides.filter((_, i) => i !== idx));
  };

  const handleSlideChange = (idx: number, field: keyof HeroSlide, val: any) => {
    setSlides((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slides),
      });
      if (res.ok) {
        setFeedback('Hero slides updated successfully!');
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (e) {
      console.error('Failed to save slides:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Storefront Banners (Section 2.2 & 9)
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Hero Carousel Slides
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage promotional full-width slides, titles, subtitles, and CTA destination links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddSlide}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Slides'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{feedback}</span>
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} onRetry={fetchSlides} />}

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-bold text-xs text-brand-900 bg-brand-50 px-3 py-1 rounded-full">
                Slide #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSlide(idx)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Preview Thumbnail */}
              <div className="relative h-36 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                <Image src={slide.imageUrl} alt={slide.title} fill sizes="240px" className="object-cover" />
              </div>

              {/* Form fields */}
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Slide Headline Title *
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle || ''}
                    onChange={(e) => handleSlideChange(idx, 'subtitle', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Background Image
                    </label>
                    <select
                      value={slide.imageUrl}
                      onChange={(e) => handleSlideChange(idx, 'imageUrl', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white"
                    >
                      {heroImages.map((img) => (
                        <option key={img} value={img}>
                          {img.split('/').pop()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Action Link
                    </label>
                    <input
                      type="text"
                      value={slide.actionLink || ''}
                      onChange={(e) => handleSlideChange(idx, 'actionLink', e.target.value)}
                      placeholder="#cakes or /#fast-food"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
