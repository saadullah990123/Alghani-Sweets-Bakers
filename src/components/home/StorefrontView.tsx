'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Category, Product, HeroSlide } from '@/lib/types';
import HeroCarousel from '@/components/layout/HeroCarousel';
import TwoTierCategoryNav from '@/components/layout/TwoTierCategoryNav';
import SearchBar from '@/components/layout/SearchBar';
import ProductCard from '@/components/product/ProductCard';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import CustomizedCakeModal from '@/components/product/CustomizedCakeModal';
import { PackageOpen, Award } from 'lucide-react';

interface StorefrontViewProps {
  categories: Category[];
  products: Product[];
  heroSlides: HeroSlide[];
}

export default function StorefrontView({
  categories,
  products,
  heroSlides,
}: StorefrontViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories.find((c) => c.id === 'sweets')?.id || categories[0]?.id || 'sweets'
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Supports deep-linking a category/subcategory from outside this
  // component — e.g. the mobile nav drawer in Header.tsx links to
  // `/?category=<id>&subcategory=<id>` for the categories that don't have
  // their own dedicated page. This intentionally runs in an effect (after
  // the initial render), not as the useState initializer — reading
  // window.location during the initial render would make the server-
  // rendered HTML (which has no `window`) disagree with the client's first
  // render, causing a React hydration mismatch. Running it as an effect
  // means the page briefly shows its normal default category first, then
  // switches to the deep-linked one — a one-time client-side redirect
  // rather than a hydration hazard. Only runs once on mount, not a fully
  // URL-driven filter state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const subcategoryParam = params.get('subcategory');
    const qParam = params.get('q') || params.get('search');
    if (categoryParam && categories.some((c) => c.id === categoryParam)) {
      setSelectedCategoryId(categoryParam);
      setSelectedSubcategoryId(subcategoryParam || null);
    }
    if (qParam) {
      setSearchQuery(qParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modals state
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);
  const [activeCustomProduct, setActiveCustomProduct] = useState<Product | null>(null);

  // Filter products by category, subcategory, and live search query
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search query filter (matches name, tags, shortDescription, fullDescription, packInfo)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.fullDescription?.toLowerCase().includes(q) ||
          p.packInfo?.toLowerCase().includes(q)
      );
    }

    // Category filter — STRICT isolation: a tab only ever shows products
    // whose categoryId matches exactly. No cross-category leakage via
    // isPopular/isFeatured flags, so "Sweets" items can never appear while
    // browsing "Fast Food & Deals" or any other category.
    if (selectedCategoryId) {
      result = result.filter((p) => p.categoryId === selectedCategoryId);
    }

    // Subcategory filter
    if (selectedSubcategoryId) {
      result = result.filter((p) => p.subcategoryId === selectedSubcategoryId);
    }

    return result;
  }, [products, selectedCategoryId, selectedSubcategoryId, searchQuery]);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const activeSubcategory = activeCategory?.subcategories?.find((s) => s.id === selectedSubcategoryId);

  // Dynamic Category & Subcategory Banner Image
  const bannerUrl =
    activeSubcategory?.bannerUrl ||
    activeCategory?.bannerUrl ||
    '/images/hero/traditional-sweets-banner.webp';

  const bannerAlt = activeSubcategory
    ? `${activeSubcategory.name} Banner`
    : activeCategory
    ? `${activeCategory.name} Banner`
    : 'Category Banner';

  return (
    <div className="w-full pb-20">
      {/* 1. Hero Carousel (Section 2.2) */}
      <HeroCarousel slides={heroSlides} />

      {/* 2. Red & Yellow Two-Tier Sticky Category Navigation (Section 2.3) */}
      <TwoTierCategoryNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          setSelectedSubcategoryId(null);
          setSearchQuery('');
        }}
        selectedSubcategoryId={selectedSubcategoryId}
        onSelectSubcategory={setSelectedSubcategoryId}
      />

      {/* 3. Live Search Bar with Red Submit Arrow (Section 2.4) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
      </div>

      {/* 4. DYNAMIC REQUIREMENT: Relevant Category & Subcategory Banner right after Search Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 my-3">
        <div className="relative w-full h-[120px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-amber-200/60 bg-white">
          <Image
            key={bannerUrl}
            src={bannerUrl}
            alt={bannerAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-opacity duration-300"
          />
        </div>
      </div>

      {/* 5. Products Grid Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {/* Section Title & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-600" />
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900">
                {searchQuery ? `Search Results for "${searchQuery}"` : activeCategory?.name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Showing {filteredProducts.length} fresh {filteredProducts.length === 1 ? 'item' : 'items'} available for delivery
            </p>
          </div>

          {!searchQuery && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-600" />
                <span>100% Fresh & Authentic</span>
              </span>
            </div>
          )}
        </div>

        {/* Empty Search State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-3 shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-brand-600">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-800">
              No products found
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              We couldn't find any products matching your selection. Try clearing your search or picking another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId(categories[0]?.id || 'sweets');
                setSelectedSubcategoryId(null);
              }}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              View All Bakery Items
            </button>
          </div>
        ) : (
          /* Responsive 4-Column Product Grid */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
      </section>

      {/* 6. Product Detail Modal */}
      <ProductDetailModal
        key={activeDetailProduct?.id || 'detail-modal-empty'}
        product={activeDetailProduct}
        categories={categories}
        onClose={() => setActiveDetailProduct(null)}
      />

      {/* 7. Customized Cake Multi-Step Configurator Modal */}
      <CustomizedCakeModal
        key={activeCustomProduct?.id || 'custom-modal-empty'}
        product={activeCustomProduct}
        categories={categories}
        onClose={() => setActiveCustomProduct(null)}
      />
    </div>
  );
}
