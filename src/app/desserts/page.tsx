import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Desserts & Pastries | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DessertsPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);
  const desserts = filterByCategory(allProducts, 'desserts');

  return (
    <CategoryLandingView
      categoryId="desserts"
      pageTitle="Desserts & Pastries"
      pageTagline="Glazed donuts, frosted cupcakes, rich fudge brownies & fruit tarts"
      heroImage="/images/banners/desserts-banner.jpg"
      products={desserts}
      categories={categories}
    />
  );
}
