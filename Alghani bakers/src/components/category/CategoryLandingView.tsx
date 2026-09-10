'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Category, Product } from '@/lib/types';
import TwoTierCategoryNav, { DEDICATED_CATEGORY_ROUTES } from '@/components/layout/TwoTierCategoryNav';
import SearchBar from '@/components/layout/SearchBar';
import ProductCard from '@/components/product/ProductCard';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import CustomizedCakeModal from '@/components/product/CustomizedCakeModal';
import { PackageOpen, Award, SearchX, Sparkles } from 'lucide-react';

export interface CategoryPageSection {
  title: string;
  subtitle?: string;
  bannerUrl?: string;
  products: Product[];
}

interface CategoryLandingViewProps {
  categoryId: string;
  pageTitle: string;
  pageTagline?: string;
  heroImage: string;
  categories: Category[];
  products?: Product[];
  sections?: CategoryPageSection[];
}

export default function CategoryLandingView({
  categoryId,
  pageTitle,
  pageTagline,
  heroImage,
  categories,
  products: directProducts,
  sections,
}: CategoryLandingViewProps) {
  const router = useRouter();

  // Combine products from either direct prop or sections
  const allCategoryProducts = useMemo(() => {
    if (directProducts && directProducts.length > 0) return directProducts;
    if (sections && sections.length > 0) {
      return sections.flatMap((s) => s.products);
    }
    return [];
  }, [directProducts, sections]);

  // Current category & subcategories from DB
  const currentCategory = categories.find((c) => c.id === categoryId);
  const subcategories = currentCategory?.subcategories || [];

  // Filter state
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);
  const [activeCustomProduct, setActiveCustomProduct] = useState<Product | null>(null);

  // Initialize search or subcategory from URL params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || params.get('search');
      if (q) setSearchQuery(q);

      const sub = params.get('subcategory') || params.get('sub');
      if (sub) setSelectedSubcategoryId(sub);
    }
  }, []);

  // Filter products by subcategory and real-time search query
  const filteredProducts = useMemo(() => {
    let list = allCategoryProducts;

    // Subcategory filtering
    if (selectedSubcategoryId) {
      list = list.filter((p) => {
        // Match by subcategoryId
        if (p.subcategoryId === selectedSubcategoryId) return true;
        // Match by section title if legacy sections used
        if (sections) {
          const matchingSection = sections.find((s) => s.title === selectedSubcategoryId);
          if (matchingSection) {
            return matchingSection.products.some((sp) => sp.id === p.id);
          }
        }
        return false;
      });
    }

    // Dynamic real-time search query filter (name, tags, description, packInfo)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesShortDesc = p.shortDescription?.toLowerCase().includes(q);
        const matchesFullDesc = p.fullDescription?.toLowerCase().includes(q);
        const matchesPack = p.packInfo?.toLowerCase().includes(q);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesShortDesc || matchesFullDesc || matchesPack || matchesTags;
      });
    }

    return list;
  }, [allCategoryProducts, selectedSubcategoryId, searchQuery, sections]);

  // Switch category handler from the Category Bar
  const handleSelectCategory = (newCatId: string) => {
    const route = DEDICATED_CATEGORY_ROUTES[newCatId];
    if (route) {
      router.push(route);
    } else {
      router.push(`/?category=${newCatId}`);
    }
  };

  return (
    <div className="w-full pb-20 bg-gray-50/40">
      {/* =========================================================================
          1. CATEGORY HERO BANNER (Category cover photo + title + stats)
          ========================================================================= */}
      <div className="relative w-full h-[180px] sm:h-[240px] md:h-[300px] overflow-hidden">
        <Image
          src={heroImage}
          alt={pageTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 sm:pb-8 text-center px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[11px] font-extrabold uppercase tracking-wider mb-2 shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Al-Ghani Specialty</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            {pageTitle}
          </h1>
          {pageTagline && (
            <p className="text-xs sm:text-sm md:text-base text-amber-100 font-medium mt-1 max-w-xl drop-shadow">
              {pageTagline}
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-800 shadow-sm">
              <Award className="w-3.5 h-3.5 text-brand-600" />
              <span>{allCategoryProducts.length} Items Available</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DARK BROWN CATEGORY BAR (Sticky horizontally scrollable category bar #3D1E0B)
          ========================================================================= */}
      <TwoTierCategoryNav
        categories={categories}
        selectedCategoryId={categoryId}
        onSelectCategory={handleSelectCategory}
        selectedSubcategoryId={selectedSubcategoryId}
        onSelectSubcategory={setSelectedSubcategoryId}
        hideSubcategories={true}
      />

      {/* =========================================================================
          3. SUB-CATEGORY FILTER PILLS (Category-specific pills with active highlight)
          ========================================================================= */}
      {(subcategories.length > 0 || (sections && sections.length > 0)) && (
        <div className="w-full bg-white border-b border-amber-900/10 shadow-sm py-2.5 sm:py-3 sticky top-[138px] sm:top-[160px] z-20 backdrop-blur-md bg-white/95">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar">
            {/* "All" pill */}
            <button
              onClick={() => setSelectedSubcategoryId(null)}
              className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wide whitespace-nowrap transition-all shrink-0 shadow-sm ${
                selectedSubcategoryId === null
                  ? 'bg-[#3D1E0B] text-amber-300 ring-2 ring-amber-400 shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-[#3D1E0B] border border-gray-200'
              }`}
            >
              All {pageTitle}
            </button>

            {/* Subcategory pills from DB or sections */}
            {subcategories.length > 0
              ? subcategories.map((sub) => {
                  const isSelected = selectedSubcategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategoryId(sub.id)}
                      className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wide whitespace-nowrap transition-all shrink-0 shadow-sm ${
                        isSelected
                          ? 'bg-[#3D1E0B] text-amber-300 ring-2 ring-amber-400 shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-[#3D1E0B] border border-gray-200'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })
              : sections?.map((sec) => {
                  const isSelected = selectedSubcategoryId === sec.title;
                  return (
                    <button
                      key={sec.title}
                      onClick={() => setSelectedSubcategoryId(sec.title)}
                      className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wide whitespace-nowrap transition-all shrink-0 shadow-sm ${
                        isSelected
                          ? 'bg-[#3D1E0B] text-amber-300 ring-2 ring-amber-400 shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-[#3D1E0B] border border-gray-200'
                      }`}
                    >
                      {sec.title}
                    </button>
                  );
                })}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. FUNCTIONAL SEARCH BAR SECTION (Centered search input with search button)
          ========================================================================= */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-2">
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder={`Search ${pageTitle} by name, flavor or tags...`}
        />

        {/* Live Search Status / Active Filter Banner */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="text-xs font-semibold text-gray-500">
            {searchQuery ? (
              <span>
                Found <strong className="text-gray-900">{filteredProducts.length}</strong> matching "
                <span className="text-brand-600">{searchQuery}</span>"
              </span>
            ) : (
              <span>
                Showing <strong className="text-gray-900">{filteredProducts.length}</strong> products
                {selectedSubcategoryId && (
                  <span>
                    {' '}
                    in{' '}
                    <span className="text-[#3D1E0B] font-bold">
                      {subcategories.find((s) => s.id === selectedSubcategoryId)?.name ||
                        selectedSubcategoryId}
                    </span>
                  </span>
                )}
              </span>
            )}
          </div>

          {(searchQuery || selectedSubcategoryId) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubcategoryId(null);
              }}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 underline transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          5. PRODUCT SHOWCASE GRID (Displaying matching product cards)
          ========================================================================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-3 shadow-sm max-w-lg mx-auto mt-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              {searchQuery ? <SearchX className="w-8 h-8" /> : <PackageOpen className="w-8 h-8" />}
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-800">
              {searchQuery ? `No products match "${searchQuery}"` : 'No products available in this section'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try checking for spelling errors, using more general search terms, or clearing your search query.'
                : "We are currently baking fresh batches for this category. Please check back soon!"}
            </p>
            {(searchQuery || selectedSubcategoryId) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubcategoryId(null);
                }}
                className="mt-2 px-5 py-2 rounded-full bg-[#3D1E0B] text-amber-300 text-xs font-bold shadow-md hover:bg-[#532b10] transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                onOpenDetailModal={(p) => setActiveDetailProduct(p)}
                onOpenCustomModal={(p) => setActiveCustomProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        key={activeDetailProduct?.id || 'detail-modal-empty'}
        product={activeDetailProduct}
        categories={categories}
        onClose={() => setActiveDetailProduct(null)}
      />

      {/* Customized Cake Multi-Step Configurator Modal */}
      <CustomizedCakeModal
        key={activeCustomProduct?.id || 'custom-modal-empty'}
        product={activeCustomProduct}
        categories={categories}
        onClose={() => setActiveCustomProduct(null)}
      />
    </div>
  );
}
