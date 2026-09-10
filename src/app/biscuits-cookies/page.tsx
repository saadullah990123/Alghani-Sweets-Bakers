import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView, { CategoryPageSection } from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Biscuits & Cookies | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BiscuitsCookiesPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);

  // Strict backend filtering: only categoryId === 'biscuits' ever reaches
  // this page — no cakes, burgers, or sweets can leak in here.
  const biscuits = filterByCategory(allProducts, 'biscuits');

  const sections: CategoryPageSection[] = [
    {
      title: 'Fresh Bakery Biscuits',
      subtitle: 'Fresh bakery biscuits, sold by weight (250G / 500G / 1KG)',
      bannerUrl: '/images/banners/biscuits-banner.jpg',
      products: filterByCategory(biscuits, 'biscuits', ['sub-fresh-biscuits']),
    },
    {
      title: 'Packed Biscuits & Cookies',
      subtitle: 'Sealed retail packs of biscuits, cookies & rusk',
      bannerUrl: '/images/banners/biscuits-banner.jpg',
      products: filterByCategory(biscuits, 'biscuits', ['sub-special-cookies']),
    },
  ];

  return (
    <CategoryLandingView
      categoryId="biscuits"
      pageTitle="Biscuits & Cookies"
      pageTagline="Freshly baked biscuits and your favorite packaged cookies"
      heroImage="/images/banners/biscuits-banner.jpg"
      sections={sections}
      categories={categories}
    />
  );
}
