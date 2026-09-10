import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Frozen Savories & Flatbreads | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FrozenPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);
  const frozen = filterByCategory(allProducts, 'frozen');

  return (
    <CategoryLandingView
      categoryId="frozen"
      pageTitle="Frozen Savories & Flatbreads"
      pageTagline="Ready-to-fry samosas, rolls, parathas, and naan — fresh & hygienic"
      heroImage="/images/banners/frozen-banner.jpg"
      products={frozen}
      categories={categories}
    />
  );
}
