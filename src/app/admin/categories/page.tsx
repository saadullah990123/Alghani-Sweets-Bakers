'use client';

import React, { useState, useEffect } from 'react';
import { Category, Subcategory } from '@/lib/types';
import { Plus, Edit2, Trash2, Layers, Check, X } from 'lucide-react';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loadError, setLoadError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('The server returned an error while loading categories.');
      setCategories(await res.json());
    } catch (e) {
      console.error('Failed to load categories:', e);
      setLoadError('Could not load categories. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenNew = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      slug: '',
      icon: 'Cake',
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setSubcategoriesList([]);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory({ ...c });
    setSubcategoriesList(c.subcategories || []);
  };

  const handleAddSub = () => {
    setSubcategoriesList((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        categoryId: editingCategory?.id || '',
        name: 'New Subcategory',
        slug: 'new-subcategory',
        bannerUrl: '',
        sortOrder: prev.length + 1,
        isActive: true,
      },
    ]);
  };

  const handleRemoveSub = (idx: number) => {
    setSubcategoriesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubNameChange = (idx: number, name: string) => {
    setSubcategoriesList((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
      return copy;
    });
  };

  const handleSubBannerChange = (idx: number, bannerUrl: string) => {
    setSubcategoriesList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], bannerUrl };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    try {
      const payload: Category = {
        id: editingCategory.id || `cat-${Date.now()}`,
        name: editingCategory.name,
        slug: editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: editingCategory.icon || 'Cake',
        bannerUrl: editingCategory.bannerUrl || '',
        sortOrder: Number(editingCategory.sortOrder) || 1,
        isActive: editingCategory.isActive !== false,
        subcategories: subcategoriesList,
      };

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFeedback('Category and subcategories saved!');
        setTimeout(() => setFeedback(''), 3000);
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (e) {
      console.error('Failed to save category:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? All products inside this category will be affected.')) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {}
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Navigation & Structure (Section 9)
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Categories & Subcategories
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage Tier 1 main categories and Tier 2 subcategory pills.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{feedback}</span>
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} onRetry={fetchCategories} />}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                    {cat.sortOrder}
                  </div>
                  <h3 className="font-serif font-bold text-base text-gray-900">{cat.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories preview */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Subcategories ({cat.subcategories?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.subcategories && cat.subcategories.length > 0 ? (
                    cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"
                      >
                        {sub.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No subcategories defined</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Editor Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Manage Category & Subcategories
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Traditional Mithai"
                  className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={editingCategory.sortOrder || 1}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, sortOrder: Number(e.target.value) })
                    }
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Icon Identifier
                  </label>
                  <select
                    value={editingCategory.icon || 'Cake'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Cake">Cake</option>
                    <option value="Gift">Gift (Sweets)</option>
                    <option value="Utensils">Utensils (Fast Food)</option>
                    <option value="Flame">Flame (Deals)</option>
                    <option value="Sparkles">Sparkles (New)</option>
                    <option value="Cookie">Cookie (Desserts)</option>
                    <option value="Coffee">Coffee (Biscuits)</option>
                    <option value="Snowflake">Snowflake (Frozen)</option>
                    <option value="Palette">Palette (Custom)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Category Banner Image URL
                </label>
                <input
                  type="text"
                  value={editingCategory.bannerUrl || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, bannerUrl: e.target.value })}
                  placeholder="e.g. /images/banners/fastfood-banner.jpg"
                  className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                />
                <p className="text-[10px] text-gray-400 mt-1">Path to a banner image in /public/images/banners/</p>
              </div>

              {/* Subcategories manager */}
              <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900 uppercase">
                    Tier 2 Subcategory Pills
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSub}
                    className="px-2.5 py-1 bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Subcategory</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {subcategoriesList.map((sub, idx) => (
                    <div key={sub.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleSubNameChange(idx, e.target.value)}
                          placeholder="Subcategory Name"
                          className="flex-1 text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSub(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={sub.bannerUrl || ''}
                        onChange={(e) => handleSubBannerChange(idx, e.target.value)}
                        placeholder="Banner URL (e.g. /images/banners/pizza-banner.jpg)"
                        className="w-full text-[11px] p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
