import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Traditional Sweets | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SweetsPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);
  const sweets = filterByCategory(allProducts, 'sweets');

  return (
    <CategoryLandingView
      categoryId="sweets"
      pageTitle="Traditional Sweets & Mithai"
      pageTagline="Pure desi ghee mithai, fresh halwajat, and celebratory sweet boxes"
      heroImage="/images/hero/traditional-sweets-banner.webp"
      products={sweets}
      categories={categories}
    />
  );
}
