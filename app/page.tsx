"use client";

import { useEffect, useRef } from 'react';
import DesktopLayout from '@/components/DesktopLayout';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useGesture } from '@/lib/useGesture';
import SlideRenderer from '@/components/SlideRenderer';

export default function Home() {
  const {
    columns,
    activeColumnIndex,
    activeSlideY,
    activeSlideId,
    setActiveSlide,
    moveHorizontal,
    isAnyModalOpen,
    columnKeys,
    isLoading,
    error,
  } = useVideoGrid();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Use the gesture hook for horizontal navigation
  const { onTouchStart, onTouchEnd, onMouseDown, onMouseUp, onMouseLeave } = useGesture(moveHorizontal, isAnyModalOpen);

  // Set active slide on vertical scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || isAnyModalOpen || isProgrammaticScroll.current) return;

      const { scrollTop, clientHeight } = scrollContainerRef.current;
      const slides = scrollContainerRef.current.children;
      let newActiveSlideY = activeSlideY;
      let closestSlide = null;
      let minDistance = Infinity;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        const slideY = parseInt(slide.dataset.y || '0', 10);
        const slideRect = slide.getBoundingClientRect();
        const distance = Math.abs(slideRect.top);

        if (distance < minDistance) {
          minDistance = distance;
          closestSlide = slide;
          newActiveSlideY = slideY;
        }
      }

      if (closestSlide && newActiveSlideY !== activeSlideY) {
        const newSlideId = closestSlide.dataset.id;
        setActiveSlide(activeColumnIndex, newActiveSlideY, newSlideId as string);
      }
    };

    const debouncedScroll = setTimeout(handleScroll, 100);

    return () => clearTimeout(debouncedScroll);
  }, [activeColumnIndex, activeSlideY, isAnyModalOpen, setActiveSlide]);

  useEffect(() => {
    // Scroll to the active slide when it changes
    const slideElement = document.getElementById(`slide-${activeColumnIndex}-${activeSlideY}`);
    if (slideElement && scrollContainerRef.current) {
      isProgrammaticScroll.current = true;
      scrollContainerRef.current.scrollTo({
        top: slideElement.offsetTop,
        behavior: 'smooth',
      });
      // Reset the flag after the scroll animation is likely to have finished
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 1000);
    }
  }, [activeColumnIndex, activeSlideY]);

  if (isLoading) {
    return (
      <main className="h-full w-full flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-full w-full flex items-center justify-center">
        <p className="text-red-500">Error: {error.message}</p>
      </main>
    );
  }

  const activeColumn = columns[activeColumnIndex] || [];
  const columnWidth = columnKeys.length > 0 ? 100 / columnKeys.length : 100;
  const activeColumnIndexInKeys = columnKeys.indexOf(activeColumnIndex);

  const appContent = (
    <main
      ref={containerRef}
      className="relative flex h-full w-full overflow-hidden"
      style={{ height: 'var(--app-height)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {columnKeys.map((colIndex, keyIndex) => (
        <div
          key={colIndex}
          ref={activeColumnIndex === colIndex ? scrollContainerRef : null}
          className="h-full flex-shrink-0 snap-y snap-mandatory overflow-y-scroll"
          style={{
            width: `100vw`,
            transform: `translateX(-${activeColumnIndexInKeys * 100}%)`,
            transition: 'transform 0.4s ease',
          }}
        >
          {columns[colIndex].map(slide => (
            <div
              key={slide.id}
              id={`slide-${slide.x}-${slide.y}`}
              data-x={slide.x}
              data-y={slide.y}
              className="w-full snap-start"
              style={{
                height: 'var(--app-height)',
              }}
            >
              <SlideRenderer slide={slide} isActive={activeSlideId === slide.id} />
            </div>
          ))}
        </div>
      ))}
    </main>
  );

  return <DesktopLayout>{appContent}</DesktopLayout>;
}