import { getCategories, getProducts } from '@/db/store';
import { filterByCategory } from '@/lib/utils';
import CategoryLandingView, { CategoryPageSection } from '@/components/category/CategoryLandingView';

export const metadata = { title: 'Gift Essentials | Al-Ghani Sweets & Bakers' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GiftEssentialsPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);

  // Strict backend filtering: only categoryId === 'deals-treasure' (the
  // "Gift Essentials" category) ever reaches this page — no plain sweets,
  // mithai, or standard cakes can leak in here.
  const giftItems = filterByCategory(allProducts, 'deals-treasure');

  const sections: CategoryPageSection[] = [
    {
      title: 'Gift Hampers',
      subtitle: 'Curated gift baskets — surprises are our specialty',
      bannerUrl: '/images/hero/cruisel img3.jpg',
      products: filterByCategory(giftItems, 'deals-treasure', ['sub-gift-hampers']),
    },
    {
      title: 'Traditional/Premium Sweet Boxes',
      subtitle: 'Decorative traditional sweet boxes, family combos & hi-tea platters',
      bannerUrl: '/images/sweets/mixsweetspecial.jpg',
      // Sweet boxes, family combos, and hi-tea platters are all boxed/platter
      // gifting items (as opposed to gift-hamper baskets), so they're grouped
      // into this single section — never mixed with the Gift Hampers section
      // above (each product still belongs to exactly one subcategoryId).
      products: filterByCategory(giftItems, 'deals-treasure', ['sub-sweet-boxes', 'sub-combo-deals', 'sub-tea-deals']),
    },
  ];

  return (
    <CategoryLandingView
      categoryId="deals-treasure"
      pageTitle="Gift Essentials"
      pageTagline="Curated hampers, sweet boxes, and platters for every celebration"
      heroImage="/images/hero/cruisel img3.jpg"
      sections={sections}
      categories={categories}
    />
  );
}
