'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ProductImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  /** The product's own photo path (may be missing/empty or point at a
   *  broken/deleted file — both cases are handled). */
  src: string | undefined;
  /** Branded category/subcategory banner (from getProductFallbackImage) to
   *  show if `src` is empty OR fails to load at runtime. */
  fallbackSrc: string;
  imageScale?: number;
}

// Wraps next/image so that a missing OR broken product photo never renders
// the browser's default broken-image icon. Two cases are covered:
//   1. `src` is falsy (no photo was ever set) -> fall back immediately.
//   2. `src` is set but the file 404s/fails at request time -> onError
//      swaps to the fallback without a layout shift or console-visible
//      broken image UI.
// Used for newly added Biscuits & Gift Hampers items (and any future
// product) that may not have a dedicated photo yet.
export default function ProductImage({ src, fallbackSrc, alt, imageScale = 100, style, className, ...imgProps }: ProductImageProps) {
  const [errored, setErrored] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const resolvedSrc = !src || errored ? fallbackSrc : src;

  // Reset error state if the underlying product (and therefore `src`)
  // changes, e.g. navigating between product cards that share this component.
  useEffect(() => {
    setErrored(false);
    setIsLoaded(false);
  }, [src]);

  const isExternal = typeof resolvedSrc === 'string' && (resolvedSrc.startsWith('http://') || resolvedSrc.startsWith('https://'));

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!isLoaded && <div className="absolute inset-0 bg-gray-200/60 animate-pulse rounded-inherit" />}
      <Image
        {...imgProps}
        src={resolvedSrc}
        alt={alt}
        decoding="async"
        className={`${className || ''} transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ ...style, transform: `scale(${Math.max(60, Math.min(140, imageScale)) / 100})` }}
        unoptimized={isExternal || imgProps.unoptimized}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!errored) setErrored(true);
          setIsLoaded(true);
        }}
      />
    </div>
  );
}
