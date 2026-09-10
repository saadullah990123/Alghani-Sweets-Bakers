import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    // Vercel Blob (admin-uploaded product/category photos — see
    // src/app/api/admin/upload/route.ts). Each Blob store gets its own
    // random subdomain of *.public.blob.vercel-storage.com.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Needed so the local SVG fallback placeholder can be served through
    // next/image. Restricted to a strict CSP since this only ever serves
    // our own trusted static asset, never user-uploaded SVGs.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
