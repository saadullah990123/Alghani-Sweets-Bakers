'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/lib/types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Utensils,
  Cake,
  Gift,
  Cookie,
  Coffee,
  Snowflake,
  Palette,
  Package,
  Layers,
} from 'lucide-react';

// Dedicated routes for categories
export const DEDICATED_CATEGORY_ROUTES: Record<string, string> = {
  sweets: '/sweets',
  cakes: '/cakes',
  'fast-food': '/fast-food',
  desserts: '/desserts',
  biscuits: '/biscuits-cookies',
  frozen: '/frozen',
  'deals-treasure': '/gift-essentials',
};

interface TwoTierCategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSubcategoryId: string | null;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  hideSubcategories?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
  Flame: <Flame className="w-5 h-5 sm:w-6 sm:h-6" />,
  Utensils: <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />,
  Cake: <Cake className="w-5 h-5 sm:w-6 sm:h-6" />,
  Gift: <Gift className="w-5 h-5 sm:w-6 sm:h-6" />,
  Cookie: <Cookie className="w-5 h-5 sm:w-6 sm:h-6" />,
  Coffee: <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />,
  Snowflake: <Snowflake className="w-5 h-5 sm:w-6 sm:h-6" />,
  Palette: <Palette className="w-5 h-5 sm:w-6 sm:h-6" />,
  Package: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
};

export default function TwoTierCategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedSubcategoryId,
  onSelectSubcategory,
  hideSubcategories = false,
}: TwoTierCategoryNavProps) {
  const tier1ScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const subcategories = activeCategory?.subcategories || [];

  const scrollTier1 = (direction: 'left' | 'right') => {
    if (tier1ScrollRef.current) {
      const scrollAmount = 280;
      tier1ScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      className="sticky top-20 sm:top-24 z-30 w-full bg-[#3D1E0B] text-white shadow-lg border-b border-[#2C1405]"
      aria-label="Category Navigation"
    >
      {/* Main Category Row (Rich warm dark brown bar #3D1E0B with white icons & text, subtle dividers) */}
      <div className="relative max-w-[1440px] mx-auto px-2 sm:px-6">
        {/* Left Circular Arrow */}
        <button
          onClick={() => scrollTier1('left')}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2C1405] text-white border border-white/20 shadow-md flex items-center justify-center hover:bg-[#532b10] hover:scale-110 active:scale-95 transition"
          aria-label="Scroll Categories Left"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        {/* Categories scroll row */}
        <div
          ref={tier1ScrollRef}
          className="flex items-center overflow-x-auto no-scrollbar py-2 sm:py-2.5 px-7 sm:px-12 scroll-smooth"
        >
          {categories.map((category, idx) => {
            const isSelected = category.id === selectedCategoryId;
            const icon = (category.icon && iconMap[category.icon]) || <Layers className="w-5 h-5 sm:w-6 sm:h-6" />;
            const dedicatedRoute = DEDICATED_CATEGORY_ROUTES[category.id];

            return (
              <div key={category.id} className="flex items-center shrink-0">
                <button
                  onClick={() => {
                    if (dedicatedRoute && window.location.pathname !== dedicatedRoute) {
                      router.push(dedicatedRoute);
                      return;
                    }
                    onSelectCategory(category.id);
                    onSelectSubcategory(null);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[84px] sm:min-w-[104px] py-2 px-2.5 sm:px-3.5 rounded-2xl transition-all duration-200 shrink-0 group ${
                    isSelected
                      ? 'bg-[#532b10] text-amber-300 ring-2 ring-amber-400/80 shadow-md font-extrabold scale-105'
                      : 'text-white/90 hover:text-white hover:bg-white/10 font-bold'
                  }`}
                >
                  <div
                    className={`mb-1 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-amber-300' : 'text-white'
                    }`}
                  >
                    {icon}
                  </div>
                  <span className="text-[11px] sm:text-xs text-center leading-tight whitespace-nowrap">
                    {category.name}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-0.5 bg-amber-400 rounded-full mt-1 animate-pulse" />
                  )}
                </button>

                {/* Subtle divider between categories */}
                {idx < categories.length - 1 && (
                  <div className="h-7 w-[1px] bg-white/15 mx-1 sm:mx-1.5 shrink-0" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Circular Arrow */}
        <button
          onClick={() => scrollTier1('right')}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2C1405] text-white border border-white/20 shadow-md flex items-center justify-center hover:bg-[#532b10] hover:scale-110 active:scale-95 transition"
          aria-label="Scroll Categories Right"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Subcategory Pills Row (rendered if not hidden) */}
      {!hideSubcategories && subcategories.length > 0 && (
        <div className="pb-3 pt-1 px-4 sm:px-8 border-t border-white/10 bg-[#2C1405]/60 backdrop-blur-sm">
          <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar">
            {/* All pill */}
            <button
              onClick={() => onSelectSubcategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide whitespace-nowrap transition-all shadow-sm shrink-0 ${
                selectedSubcategoryId === null
                  ? 'bg-amber-400 text-black shadow-md ring-1 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              All {activeCategory.name}
            </button>

            {subcategories.map((sub) => {
              const isSelected = sub.id === selectedSubcategoryId;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubcategory(sub.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide whitespace-nowrap transition-all shadow-sm shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-black shadow-md ring-1 ring-amber-300'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
