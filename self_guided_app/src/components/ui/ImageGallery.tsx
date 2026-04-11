"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  height?: string;
}

export function ImageGallery({ images, alt, height = "h-56" }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setCurrentIndex(Math.round(scrollLeft / clientWidth));
  }, []);

  function scrollToIndex(index: number) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: index * scrollRef.current.clientWidth, behavior: "smooth" });
  }

  if (images.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto snap-x snap-mandatory ${height} bg-muted`}
        style={{ scrollbarWidth: "none" }}
        onScroll={handleScroll}
      >
        {images.map((src, i) => (
          <div key={i} className="snap-center flex-shrink-0 w-full h-full relative">
            <Image src={src} alt={alt} fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`rounded-full transition-all duration-200 pointer-events-auto ${
                i === currentIndex
                  ? "bg-white w-4 h-1.5"
                  : "bg-white/50 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
