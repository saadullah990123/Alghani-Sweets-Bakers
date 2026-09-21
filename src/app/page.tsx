import { getCategories, getProducts, getHeroSlides } from '@/db/store';
import StorefrontView from '@/components/home/StorefrontView';

// The catalog is edited from the admin dashboard, so storefront pages must
// read the current catalog instead of serving a stale ISR snapshot.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { category?: string; subcategory?: string; q?: string; search?: string };
}) {
  const [categories, products, heroSlides] = await Promise.all([
    getCategories(),
    getProducts(),
    getHeroSlides(),
  ]);

  return (
    <StorefrontView
      categories={categories}
      products={products}
      heroSlides={heroSlides}
      initialCategoryId={searchParams?.category}
      initialSubcategoryId={searchParams?.subcategory}
      initialSearchQuery={searchParams?.q || searchParams?.search}
    />
  );
}
