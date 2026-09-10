import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import FloatingActions from '@/components/layout/FloatingActions';
import OfflineBanner from '@/components/layout/OfflineBanner';
import { getSettings, getCategories } from '@/db/store';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#c8102e',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Al-Ghani Sweets & Bakers | Fresh Cakes, Traditional Mithai, Fast Food & Customized Cakes',
  description:
    'Order fresh cakes, customized occasion cakes, authentic Pakistani traditional sweets/mithai, pizzas, burgers, and frozen savories online with fast delivery in Kahuta, Punjab.',
  keywords: [
    'Al-Ghani Bakers',
    'Al-Ghani Sweets',
    'Customized Cakes Kahuta',
    'Traditional Mithai',
    'Bakery Online Ordering Punjab',
    'Gulab Jamun',
    'Fast Food Pizza Kahuta',
  ],
  icons: {
    icon: '/images/logo/logo.png',
    shortcut: '/images/logo/logo.png',
    apple: '/images/logo/logo.png',
  },
  openGraph: {
    title: 'Al-Ghani Sweets & Bakers',
    description: 'Freshly Baked Delights & Royal Sweets — Fast Home Delivery',
    images: ['/images/logo/logo.png'],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const categories = await getCategories();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col justify-between">
        <OfflineBanner />
        <CartProvider>
          <LocationProvider>
            {/* Sticky Global Header */}
            <Header
              businessName={settings.businessName}
              tagline={settings.tagline}
              phone={settings.phone}
              whatsapp={settings.whatsapp}
              categories={categories}
            />

            {/* Main Page Body */}
            <main className="flex-1 w-full">{children}</main>

            {/* Slide-in Cart Drawer */}
            <CartDrawer />

            {/* Persistent Floating WhatsApp & Minimum Order Nudges */}
            <FloatingActions whatsappNumber={settings.whatsapp} />

            {/* Global Site Footer with Expandable Discover Block */}
            <Footer
              businessName={settings.businessName}
              tagline={settings.tagline}
              phone={settings.phone}
              email={settings.email}
              address={settings.address}
              aboutText={settings.aboutText}
            />
          </LocationProvider>
        </CartProvider>
      </body>
    </html>
  );
}
