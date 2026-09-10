'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, Category, PricingType, ProductVariant } from '@/lib/types';
import { formatPKR, getProductFallbackImage } from '@/lib/utils';
import AdminErrorBanner from '@/components/admin/AdminErrorBanner';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Sparkles,
  Package,
  Layers,
  Search,
  Check,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');

  // Modal / Editor State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Images uploaded via the real file-upload button during this session, so
  // they immediately show up as selectable options in the picker below
  // (they're now stored durably on Vercel Blob by the upload API — see
  // src/app/api/admin/upload/route.ts).
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Maps each category to the image folder(s) that actually belong to it.
  // Used to filter the image picker below so an admin editing a Fast Food
  // item can't accidentally pick a Sweets photo (or vice versa) — this was
  // the real cause of mismatched images showing up in the wrong section.
  const CATEGORY_IMAGE_FOLDERS: Record<string, string[]> = {
    sweets: ['sweets'],
    cakes: ['cakes'],
    'customized-cakes': ['customize-cake'],
    'fast-food': ['fastfood'],
    desserts: ['desserts'],
    biscuits: ['biscuits'],
    frozen: ['frozen'],
  };

  const baseAvailableImages = [
    '/images/cakes/blackforestcake.jpg',
    '/images/cakes/lotuscake.jpg',
    '/images/cakes/nutellacake.jpg',
    '/images/cakes/redvalvetcake.jpg',
    '/images/cakes/kitkatcake.jpg',
    '/images/cakes/comiccake.jpg',
    '/images/cakes/honeycake.jpg',
    '/images/cakes/pineapplecake.jpg',
    '/images/customize-cake/nikkah.jpg',
    '/images/customize-cake/spidey.jpg',
    '/images/customize-cake/bardieedoll.jpg',
    '/images/customize-cake/bossbaby.jpg',
    '/images/customize-cake/graduate.jpg',
    '/images/fastfood/chickentikka.jpg',
    '/images/fastfood/creamytikkapizza.jpg',
    '/images/fastfood/friedchickenburger.jpg',
    '/images/fastfood/hotburger.jpg',
    '/images/fastfood/fajitasandwhich.jpg',
    '/images/fastfood/bbqsandwich.jpg',
    '/images/fastfood/ranchwrap.jpg',
    '/images/fastfood/regularfries.jpg',
    '/images/fastfood/chickenbread.jpg',
    '/images/sweets/gulab_jamun.jpg',
    '/images/sweets/mixed_mithai.jpg',
    '/images/biscuits/zeera_biscuits.jpg',
    '/images/frozen/chicken_samosa_pack.jpg',
    '/images/desserts/glazed_donuts.jpg',
  ];

  const availableImages = [...baseAvailableImages, ...uploadedImages];

  // Images filtered to the category currently selected in the editor.
  const getImagesForCategory = (categoryId?: string): string[] => {
    const folders = categoryId ? CATEGORY_IMAGE_FOLDERS[categoryId] : undefined;
    const currentImg = editingProduct?.images?.[0];

    // Images already used by products in this category
    const categoryProductImages = products
      .filter((p) => !categoryId || p.categoryId === categoryId)
      .flatMap((p) => p.images || []);

    const allCandidateImages = Array.from(
      new Set([
        ...(currentImg ? [currentImg] : []),
        ...uploadedImages,
        ...categoryProductImages,
        ...availableImages,
      ])
    ).filter(Boolean);

    if (!folders) return allCandidateImages;

    const filtered = allCandidateImages.filter(
      (img) =>
        img === currentImg ||
        uploadedImages.includes(img) ||
        categoryProductImages.includes(img) ||
        folders.some((f) => img.includes(`/${f}/`)) ||
        img.includes(`/products/${categoryId}/`) ||
        img.includes(`/uploads/${categoryId}/`)
    );

    return filtered.length > 0 ? filtered : allCandidateImages;
  };

  const handleImageUpload = async (source: File | string, categoryId?: string) => {
    setUploadError('');
    setIsUploading(true);
    try {
      const folder = categoryId || 'general';
      const formData = new FormData();
      if (typeof source === 'string') {
        formData.append('imageUrl', source);
      } else {
        formData.append('file', source);
      }
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadedImages((prev) => [...prev, data.path]);
      if (editingProduct) {
        setEditingProduct({ ...editingProduct, images: [data.path] });
      }
      setImageUrlInput('');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try a different image.');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      if (!prodRes.ok || !catRes.ok) {
        throw new Error('The server returned an error while loading the catalog.');
      }
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
    } catch (e) {
      console.error('Failed to load catalog data:', e);
      setLoadError('Could not load products/categories. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNew = () => {
    const defaultCategoryId = categories[0]?.id || 'cakes';
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      categoryId: defaultCategoryId,
      pricingType: 'FIXED',
      basePrice: 500,
      shortDescription: '',
      fullDescription: '',
      images: [getImagesForCategory(defaultCategoryId)[0] || getProductFallbackImage(defaultCategoryId, undefined, categories)],
      isCustomizable: false,
      isFeatured: false,
      isPopular: false,
      isAvailable: true,
      imageScale: 100,
      sortOrder: products.length + 1,
    });
    setVariantsList([]);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setVariantsList(p.variants || []);
  };

  const handleAddVariant = () => {
    setVariantsList((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        productId: editingProduct?.id || '',
        name: 'Medium',
        price: 1000,
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: keyof ProductVariant, val: any) => {
    setVariantsList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.categoryId) {
      alert('Product name and category are required.');
      return;
    }

    setIsSaving(true);
    setFeedbackError('');
    try {
      const payload: Product = {
        id: editingProduct.id || `prod-${Date.now()}`,
        name: editingProduct.name,
        slug: editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryId: editingProduct.categoryId,
        subcategoryId: editingProduct.subcategoryId,
        pricingType: (editingProduct.pricingType as PricingType) || 'FIXED',
        basePrice: Number(editingProduct.basePrice) || 0,
        packInfo: editingProduct.packInfo || undefined,
        shortDescription: editingProduct.shortDescription || '',
        fullDescription: editingProduct.fullDescription || '',
        images:
          editingProduct.images && editingProduct.images.length > 0
            ? editingProduct.images
            : [getProductFallbackImage(editingProduct.categoryId, editingProduct.subcategoryId, categories)],
          imageScale: Math.max(60, Math.min(140, Number(editingProduct.imageScale) || 100)),
        isCustomizable: !!editingProduct.isCustomizable,
        isFeatured: !!editingProduct.isFeatured,
        isPopular: !!editingProduct.isPopular,
        isAvailable: editingProduct.isAvailable !== false,
        sortOrder: Number(editingProduct.sortOrder) || 1,
        variants: editingProduct.pricingType === 'VARIANT' ? variantsList : undefined,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The product could not be saved.');

      setFeedback('Product saved successfully!');
      setTimeout(() => setFeedback(''), 3000);
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      console.error('Error saving product:', err);
      setFeedbackError(err instanceof Error ? err.message : 'The product could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setFeedbackError('');
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The product could not be deleted.');
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setFeedback('Product deleted successfully.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error('Failed to delete product:', e);
      setFeedbackError(e instanceof Error ? e.message : 'The product could not be deleted.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCatFilter === 'ALL' || p.categoryId === selectedCatFilter;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Catalog Management (Section 9)
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
            Products & Variants
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Create, update prices, manage sizes/variants, and swap photos without touching code.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{feedback}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl">
          {feedbackError}
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} onRetry={fetchData} />}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-gray-900"
          />
        </div>

        <select
          value={selectedCatFilter}
          onChange={(e) => setSelectedCatFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700"
        >
          <option value="ALL">All Categories ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const categoryName = categories.find((c) => c.id === p.categoryId)?.name || p.categoryId;
          return (
            <div
              key={p.id}
              className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="flex gap-3">
                <div className="relative w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                  <Image
                    src={p.images[0] || getProductFallbackImage(p.categoryId, p.subcategoryId, categories)}
                    alt={p.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {categoryName}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 mt-1 line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{p.shortDescription}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-extrabold text-brand-dark">
                      {p.pricingType === 'VARIANT' ? 'From ' : ''}
                      {formatPKR(p.variants?.[0]?.price || p.basePrice)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                      Type {p.pricingType}
                    </span>
                  </div>
                </div>
              </div>

              {p.isCustomizable && (
                <div className="p-2 bg-purple-50 rounded-xl text-[11px] text-purple-900 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                  <span>Customizable Cake Flow Enabled (30% Adv)</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    p.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {p.isAvailable ? 'Available' : 'Hidden'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-600 transition"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200 max-h-[90vh] overflow-y-auto space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-gray-900">
                {editingProduct.id?.startsWith('prod-') && !products.some((p) => p.id === editingProduct.id)
                  ? 'Add New Bakery Product'
                  : 'Edit Product Details'}
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Royal Black Forest Cake"
                  className="w-full text-sm p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                />
              </div>

              {/* Category & Pricing Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.categoryId || categories[0]?.id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Pricing Behavior Type *
                  </label>
                  <select
                    value={editingProduct.pricingType || 'FIXED'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, pricingType: e.target.value as PricingType })
                    }
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="FIXED">Type A — Fixed Price (Single ADD button)</option>
                    <option value="VARIANT">Type B — Variant Pills (Small/Med/Lrg, 250G/500G/1KG)</option>
                    <option value="PACKAGED">Type C — Packaged / Frozen (Pack size in title)</option>
                  </select>
                </div>
              </div>

              {/* Base Price & Pack Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Base Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.basePrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: Number(e.target.value) })}
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Pack Info (Optional — Type C e.g. "(24 PCS)")
                  </label>
                  <input
                    type="text"
                    value={editingProduct.packInfo || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, packInfo: e.target.value })}
                    placeholder="e.g. (24 PCS Pack)"
                    className="w-full text-sm p-3 rounded-xl border border-gray-300 bg-white"
                  />
                </div>
              </div>

              {/* Variants Section (if Type B) */}
              {editingProduct.pricingType === 'VARIANT' && (
                <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-900 uppercase">
                      Product Variants & Prices
                    </span>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-2.5 py-1 bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Variant</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {variantsList.map((v, idx) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                          placeholder="Size/Weight (e.g. 500 G)"
                          className="flex-1 text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                        />
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                          placeholder="Price"
                          className="w-28 text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Image *
                </label>
                <p className="text-[11px] text-gray-500 mb-1.5">
                  Only showing images that belong to the selected category, so items can't end up with the wrong section's photo.
                </p>
                <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                      {editingProduct.images?.[0] || getImagesForCategory(editingProduct.categoryId)[0] ? (
                        <img
                          src={editingProduct.images?.[0] || getImagesForCategory(editingProduct.categoryId)[0]}
                          alt="Selected preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder-product.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                    <select
                      value={editingProduct.images?.[0] || getImagesForCategory(editingProduct.categoryId)[0] || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                      className="flex-1 text-xs p-3 rounded-xl border border-gray-300 bg-white"
                    >
                      {getImagesForCategory(editingProduct.categoryId).map((img) => {
                        const filename = img.split('/').pop() || img;
                        const label = img.startsWith('http')
                          ? `Uploaded: ${filename.slice(0, 24)}...`
                          : `${filename} (${img.split('/')[2] || 'general'})`;
                        return (
                          <option key={img} value={img}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                {/* Real file upload — uploads to durable Vercel Blob storage
                    (see src/app/api/admin/upload/route.ts) and selects it
                    immediately, instead of only picking from the pre-seeded
                    photo library above. */}
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <label
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                      isUploading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload New Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, editingProduct.categoryId);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-gray-400">JPG, PNG, WEBP or GIF. Max 5MB.</span>
                </div>

                {/* Or paste an external image URL — the server downloads it
                    and re-hosts it on Vercel Blob so it gets the same
                    durable, CDN-backed URL as a direct upload. */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste an image URL (https://...)"
                    disabled={isUploading}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-gray-300 bg-white disabled:bg-gray-50"
                  />
                  <button
                    type="button"
                    disabled={isUploading || !imageUrlInput.trim()}
                    onClick={() => handleImageUpload(imageUrlInput.trim(), editingProduct.categoryId)}
                    className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:bg-gray-200 disabled:text-gray-400 transition"
                  >
                    {isUploading ? 'Uploading...' : 'Fetch & Use'}
                  </button>
                </div>
                {uploadError && <p className="text-[11px] text-red-600 font-semibold mt-1">{uploadError}</p>}
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label htmlFor="image-scale" className="text-xs font-bold text-gray-700 uppercase">
                    Image Size on Storefront
                  </label>
                  <span className="text-sm font-extrabold text-brand-700">
                    {editingProduct.imageScale || 100}%
                  </span>
                </div>
                <input
                  id="image-scale"
                  type="range"
                  min="60"
                  max="140"
                  step="5"
                  value={editingProduct.imageScale || 100}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageScale: Number(e.target.value) })}
                  className="w-full accent-brand-600"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Use a smaller value to show more of a tall product photo, or a larger value to crop closer.
                </p>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Short Tagline / Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="Short 1-2 line summary shown on card..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isCustomizable || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isCustomizable: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Mark as Customizable Cake (Enables Section 7 Multi-Step Configurator & 30% Advance)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Featured Item</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isAvailable !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                  />
                  <span>Available in Store</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
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
