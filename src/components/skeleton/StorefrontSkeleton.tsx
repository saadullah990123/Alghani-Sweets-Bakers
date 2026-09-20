import React from 'react';
import Skeleton from './Skeleton';

export function HeaderSkeleton() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="h-20 sm:h-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 sm:w-14 sm:h-14" rounded="rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 sm:w-48" />
            <Skeleton className="h-3 w-28 sm:w-36" />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-12" />
        </div>
        <Skeleton className="w-10 h-10 sm:hidden" rounded="rounded-full" />
      </div>
    </header>
  );
}

function HeroSkeleton() {
  return <Skeleton className="w-full h-[260px] sm:h-[360px] md:h-[460px] lg:h-[520px]" rounded="rounded-none" />;
}

function CategoryNavSkeleton() {
  return (
    <div className="w-full bg-[#3D1E0B] shadow-lg">
      <div className="max-w-[1440px] mx-auto px-9 sm:px-14 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <React.Fragment key={index}>
            <Skeleton className="h-14 w-[84px] sm:w-[104px] shrink-0 bg-white/10" rounded="rounded-2xl" />
            {index < 6 && <div className="h-7 w-px bg-white/15 shrink-0" />}
          </React.Fragment>
        ))}
      </div>
      <div className="h-11 border-t border-white/10 bg-[#2C1405]/60 px-4 sm:px-8 flex items-center justify-center gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-24 shrink-0 bg-white/10" rounded="rounded-full" />
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-brand-100/80 shadow-sm flex flex-col">
      <Skeleton className="w-full aspect-square bg-gray-100" rounded="rounded-none" />
      <div className="p-3 sm:p-4 flex-1 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" rounded="rounded-md" />
          <Skeleton className="h-3 w-full" rounded="rounded-md" />
          <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
        </div>
        <div className="pt-2 border-t border-gray-100 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-10" rounded="rounded-md" />
            <Skeleton className="h-5 w-20" rounded="rounded-md" />
          </div>
          <Skeleton className="h-10 w-20 sm:w-24" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function StorefrontSkeleton() {
  return (
    <div className="w-full pb-20 bg-gray-50" aria-label="Loading storefront" role="status">
      <HeroSkeleton />
      <CategoryNavSkeleton />
      <main>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <Skeleton className="h-11 w-full" rounded="rounded-xl" />
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 my-3">
          <Skeleton className="w-full h-[120px] sm:h-[180px] md:h-[220px] lg:h-[260px]" rounded="rounded-2xl sm:rounded-3xl" />
        </div>
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-end justify-between gap-2 mb-6 border-b border-gray-200 pb-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-44 sm:w-56" rounded="rounded-md" />
              <Skeleton className="h-3 w-64" rounded="rounded-md" />
            </div>
            <Skeleton className="hidden sm:block h-8 w-44" rounded="rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        </section>
      </main>
    </div>
  );
}