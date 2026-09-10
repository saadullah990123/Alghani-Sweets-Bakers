'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

const examplePlaceholders = [
  'Search for Peshawari Ice Cream...',
  'Search for Royal Black Forest Cake...',
  'Search for Traditional Shahi Gulab Jamun...',
  'Search for Chicken Tikka Pizza...',
  'Search for Lotus Biscoff Dream Cake...',
  'Search for Crispy Zeera Biscuits...',
  'Search for Customized Nikkah Cake...',
];

export default function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  placeholder,
  className = '',
}: SearchBarProps) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (placeholder) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % examplePlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholder]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={`w-full max-w-2xl mx-auto px-4 py-3 ${className}`}
      id="main-search-bar"
    >
      <div className="relative flex items-center bg-white rounded-full border-2 border-amber-900/20 shadow-sm hover:border-brand-600 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all p-1">
        {/* Left Red/Brand Search Icon */}
        <div className="pl-4 pr-2 text-brand-600 pointer-events-none">
          <Search className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder || examplePlaceholders[placeholderIdx]}
          className="w-full py-2 text-sm sm:text-base font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent"
        />

        {/* Clear Button if query present */}
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              inputRef.current?.focus();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full mr-1 transition"
            aria-label="Clear Search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Right Red Circular Arrow Submit Button */}
        <button
          type="submit"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md transition"
          aria-label="Submit Search"
        >
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
}
