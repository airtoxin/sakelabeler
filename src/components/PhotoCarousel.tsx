"use client";

import { useState, useRef, useCallback } from "react";
import type { SakePhoto } from "@/lib/types";

type PhotoCarouselProps = {
  photos: SakePhoto[];
  alt: string;
};

export function PhotoCarousel({ photos, alt }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const getContainerWidth = useCallback(() => {
    return containerRef.current?.offsetWidth ?? 0;
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, photos.length - 1));
      setCurrentIndex(clamped);
      setDragOffset(0);
      thumbnailRefs.current[clamped]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    },
    [photos.length]
  );

  const handleDragEnd = useCallback(() => {
    const width = getContainerWidth();
    const threshold = Math.min(width * 0.2, 50);

    if (dragOffset < -threshold && currentIndex < photos.length - 1) {
      goTo(currentIndex + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      setDragOffset(0);
    }
    setIsDragging(false);
    isHorizontalRef.current = null;
  }, [dragOffset, currentIndex, photos.length, goTo, getContainerWidth]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaY = e.touches[0].clientY - startYRef.current;

      if (isHorizontalRef.current === null) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
          isHorizontalRef.current = true;
        } else if (
          Math.abs(deltaY) > Math.abs(deltaX) &&
          Math.abs(deltaY) > 5
        ) {
          isHorizontalRef.current = false;
        }
      }

      if (isHorizontalRef.current === false) return;

      // Apply edge resistance
      let adjusted = deltaX;
      if (
        (currentIndex === 0 && deltaX > 0) ||
        (currentIndex === photos.length - 1 && deltaX < 0)
      ) {
        adjusted = deltaX * 0.3;
      }
      setDragOffset(adjusted);
    },
    [isDragging, currentIndex, photos.length]
  );

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers (desktop drag)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startXRef.current;
      let adjusted = deltaX;
      if (
        (currentIndex === 0 && deltaX > 0) ||
        (currentIndex === photos.length - 1 && deltaX < 0)
      ) {
        adjusted = deltaX * 0.3;
      }
      setDragOffset(adjusted);
    },
    [isDragging, currentIndex, photos.length]
  );

  const onMouseUp = useCallback(() => {
    if (isDragging) handleDragEnd();
  }, [isDragging, handleDragEnd]);

  const onMouseLeave = useCallback(() => {
    if (isDragging) handleDragEnd();
  }, [isDragging, handleDragEnd]);

  // Keyboard handler
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
    },
    [currentIndex, goTo]
  );

  // Single photo: no carousel needed
  if (photos.length <= 1) {
    return photos.length === 1 ? (
      <div>
        <img
          src={photos[0].url}
          alt={alt}
          className="w-full max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
        />
      </div>
    ) : null;
  }

  const translateX = `calc(-${currentIndex * 100}% + ${dragOffset}px)`;

  return (
    <div>
      {/* Carousel viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-96 overflow-hidden select-none bg-gray-100 dark:bg-gray-800"
        role="region"
        aria-roledescription="carousel"
        aria-label="写真"
        tabIndex={0}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
      >
        {/* Slide track */}
        <div
          className={
            isDragging ? "" : "transition-transform duration-300 ease-out"
          }
          style={{
            display: "flex",
            transform: `translateX(${translateX})`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo.url}
              alt={`${alt} - 写真 ${index + 1}`}
              className="w-full h-96 object-contain flex-shrink-0"
              draggable={false}
            />
          ))}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? "bg-white shadow-sm"
                  : "bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Photo counter */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Interactive thumbnails */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto bg-gray-50 dark:bg-gray-900">
        {photos.map((photo, index) => (
          <button
            key={index}
            ref={(el) => {
              thumbnailRefs.current[index] = el;
            }}
            type="button"
            onClick={() => goTo(index)}
            className={`w-14 h-14 rounded-md flex-shrink-0 overflow-hidden ${
              index === currentIndex
                ? "ring-2 ring-violet-500"
                : "opacity-70 hover:opacity-90"
            } transition-all`}
            aria-label={`写真 ${index + 1} を表示`}
          >
            <img
              src={photo.url}
              alt={`写真 ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
