import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://alghani-sweets-bakers.vercel.app'
  ).replace(/\/$/, '');

  const routes = [
    '',
    '/biscuits',
    '/biscuits-cookies',
    '/cakes',
    '/checkout',
    '/desserts',
    '/fast-food',
    '/fastfood',
    '/frozen',
    '/gift-essentials',
    '/legal/disclaimer',
    '/legal/privacy-policy',
    '/legal/refund-policy',
    '/legal/shipping-policy',
    '/legal/terms-of-service',
    '/support',
    '/sweets',
    '/track-order',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}