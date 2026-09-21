import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Customized Cakes | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomizedCakesPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);
  const customizedCakes = filterByCategory(allProducts, 'customized-cakes');

  return (
    <CategoryLandingView
      categoryId="customized-cakes"
      pageTitle="Customized Cakes"
      pageTagline="Handcrafted luxury designer cakes baked fresh for weddings, birthdays & special moments"
      heroImage="/images/customize-cake/mainimage.jpg"
      products={customizedCakes}
      categories={categories}
    />
  );
}
