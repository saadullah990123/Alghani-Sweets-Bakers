import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView, { CategoryPageSection } from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Fast Food & Deals | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FastFoodPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);

  // Strict backend filtering: only categoryId === 'fast-food' ever reaches
  // this page. No sweets, mithai, or cakes can leak in here.
  const fastFood = filterByCategory(allProducts, 'fast-food');

  const sections: CategoryPageSection[] = [
    {
      title: 'Salads & Sandwiches',
      subtitle: 'Salads, subs, and stuffed croissants',
      bannerUrl: '/images/banners/sandwiches-banner.jpg',
      products: filterByCategory(fastFood, 'fast-food', ['sub-sandwiches', 'sub-wraps']),
    },
    {
      title: 'Burgers',
      subtitle: 'Zinger, beef & patty burgers',
      bannerUrl: '/images/banners/burger-banner.jpg',
      products: filterByCategory(fastFood, 'fast-food', ['sub-burgers']),
    },
    {
      title: 'Pizza',
      subtitle: 'Our full range of oven-fresh pizzas',
      bannerUrl: '/images/banners/pizza-banner.jpg',
      products: filterByCategory(fastFood, 'fast-food', ['sub-pizza']),
    },
    {
      title: 'Fried Chicken / Deals',
      subtitle: 'Broast, chicken drumsticks, fries & sides',
      bannerUrl: '/images/banners/fastfood-banner.jpg',
      products: filterByCategory(fastFood, 'fast-food', ['sub-sides']),
    },
  ];

  return (
    <CategoryLandingView
      categoryId="fast-food"
      pageTitle="Fast Food & Deals"
      pageTagline="Hot, oven-fresh pizzas, burgers, and crispy fried favorites"
      heroImage="/images/banners/fastfood-banner.jpg"
      sections={sections}
      categories={categories}
    />
  );
}
