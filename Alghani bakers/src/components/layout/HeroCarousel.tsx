'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroSlide } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  slides?: HeroSlide[];
}

export default function HeroCarousel({ slides = [] }: HeroCarouselProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotation every 5 seconds unless hovered/paused
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  if (slides.length === 0) return null;

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[currentIdx];

  return (
    <section
      className="relative w-full overflow-hidden bg-brand-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional Carousel"
    >
      {/* Edge-to-edge carousel height */}
      <div className="relative w-full h-[260px] sm:h-[360px] md:h-[460px] lg:h-[520px]">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIdx;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <div className="relative w-full h-full">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center scale-100 transition-transform duration-7000 ease-out"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Text & Action CTA */}
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full">
                  <div className="max-w-xl space-y-2 sm:space-y-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500 text-brand-dark shadow-sm">
                      Special Bakery Delights
                    </span>
                    <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-sm sm:text-base md:text-lg text-amber-100 font-medium line-clamp-2 drop-shadow">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.actionLink && (
                      <div className="pt-2 sm:pt-4">
                        <Link
                          href={slide.actionLink}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-brand-500/40 hover:-translate-y-0.5 transition"
                        >
                          <span>Order Fresh Now</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Left/Right Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-white/30 hover:bg-white/80 text-white hover:text-brand-dark backdrop-blur-md transition shadow-md opacity-80 group-hover:opacity-100"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-white/30 hover:bg-white/80 text-white hover:text-brand-dark backdrop-blur-md transition shadow-md opacity-80 group-hover:opacity-100"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentIdx
                    ? 'w-8 bg-brand-500 shadow-sm'
                    : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
