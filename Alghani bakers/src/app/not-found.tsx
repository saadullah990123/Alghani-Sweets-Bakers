import Link from 'next/link';
import Image from 'next/image';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto rounded-full bg-brand-50 p-3 shadow-inner">
          <Image
            src="/images/logo/logo.png"
            alt="Al-Ghani Sweets & Bakers"
            fill
            sizes="96px"
            className="object-contain p-3"
          />
        </div>

        <div>
          <p className="font-serif text-6xl font-extrabold text-brand-500">404</p>
          <h1 className="font-serif text-2xl font-extrabold text-gray-900 mt-2">
            This page has gone missing from the kitchen
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            The page you're looking for doesn't exist, may have been moved, or the link might be broken.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
          <Link
            href="/#sweets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-2xl transition w-full sm:w-auto justify-center"
          >
            <Search className="w-4 h-4" />
            <span>Browse Our Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
