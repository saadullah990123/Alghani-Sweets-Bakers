import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView, { CategoryPageSection } from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Cakes | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CakesPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);

  // Strict backend filtering: this page only ever shows products whose
  // categoryId is exactly 'cakes' — customized cakes, sweets, and every
  // other category are a different categoryId entirely and can never leak
  // in here, regardless of any isPopular/isFeatured flag.
  const cakes = filterByCategory(allProducts, 'cakes');

  const sections: CategoryPageSection[] = [
    {
      title: 'Classic Cakes',
      subtitle: 'Our best-loved classic & cream cakes',
      bannerUrl: '/images/banners/cakes-banner.jpg',
      products: filterByCategory(cakes, 'cakes', ['sub-classic-cakes', 'sub-premium-cakes']),
    },
    {
      title: 'Dry Cakes',
      subtitle: 'Dry, fruit, pound & macaron cakes',
      bannerUrl: '/images/cakes/fruitdryalmondcake.jpg',
      products: filterByCategory(cakes, 'cakes', ['sub-dry-cakes']),
    },
    {
      title: 'Dream Cakes',
      subtitle: 'Fun mini & dream cakes',
      bannerUrl: '/images/cakes/kitkatcake.jpg',
      products: filterByCategory(cakes, 'cakes', ['sub-dream-cakes']),
    },
  ];

  return (
    <CategoryLandingView
      categoryId="cakes"
      pageTitle="Cakes"
      pageTagline="Freshly baked, ready-made cakes for every craving"
      heroImage="/images/banners/cakes-banner.jpg"
      sections={sections}
      categories={categories}
    />
  );
}
