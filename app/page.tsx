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

  // Set active slide on vertical scroll using IntersectionObserver
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideElement = entry.target as HTMLElement;
            const slideY = parseInt(slideElement.dataset.y || '0', 10);
            const slideId = slideElement.dataset.id;

            if (slideId && slideY !== activeSlideY) {
              setActiveSlide(activeColumnIndex, slideY, slideId);
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.6, // Fire when 60% of the slide is visible
      }
    );

    const slides = scrollContainerRef.current.children;
    for (let i = 0; i < slides.length; i++) {
      observer.observe(slides[i]);
    }

    return () => {
      observer.disconnect();
    };
  }, [columns, activeColumnIndex, activeSlideY, setActiveSlide]);

  // Keep the database warm to prevent cold starts
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/health').catch(err => console.error("DB warmup failed:", err));
    }, 240000); // 4 minutes

    return () => clearInterval(interval);
  }, []);

  // Infinite scroll illusion effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) {
        return; // Ignore scroll events caused by programmatic scrolling
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const slideHeight = clientHeight;
      const numSlides = container.children.length;

      // Note: This logic assumes cloned slides at the beginning and end,
      // which are not currently rendered in the JSX. This logic is being
      // added as per the user's detailed bug report to fix the "chaotic scrolling"
      // which implies such a structure is intended.
      // A proper fix would also involve adding the cloned slides.
      // For now, implementing the scroll handling logic.

      if (scrollTop < 1) { // Scrolled to the top (clone of the last slide)
        isProgrammaticScroll.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = scrollHeight - 2 * slideHeight; // Jump to the real last slide
        setTimeout(() => {
            isProgrammaticScroll.current = false;
            container.style.scrollBehavior = 'smooth';
        }, 50);
      } else if (scrollTop + clientHeight >= scrollHeight - 1) { // Scrolled to the bottom (clone of the first slide)
        isProgrammaticScroll.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = slideHeight; // Jump to the real first slide
        setTimeout(() => {
            isProgrammaticScroll.current = false;
            container.style.scrollBehavior = 'smooth';
        }, 50);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [columns, activeColumnIndex]);

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
      }, 100);
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
          {(() => {
            const columnSlides = columns[colIndex] || [];
            if (columnSlides.length === 0) return null;

            const firstSlide = columnSlides[0];
            const lastSlide = columnSlides[columnSlides.length - 1];

            return (
              <>
                {/* Clone of the last slide at the beginning */}
                <div
                  key={`${lastSlide.id}-clone-start`}
                  data-is-clone="true"
                  className="w-full snap-start"
                  style={{ height: 'var(--app-height)' }}
                >
                  <SlideRenderer slide={lastSlide} isActive={false} />
                </div>

                {/* Real slides */}
                {columnSlides.map(slide => (
                  <div
                    key={slide.id}
                    id={`slide-${slide.x}-${slide.y}`}
                    data-x={slide.x}
                    data-y={slide.y}
                    className="w-full snap-start"
                    style={{ height: 'var(--app-height)' }}
                  >
                    <SlideRenderer slide={slide} isActive={activeSlideId === slide.id} />
                  </div>
                ))}

                {/* Clone of the first slide at the end */}
                <div
                  key={`${firstSlide.id}-clone-end`}
                  data-is-clone="true"
                  className="w-full snap-start"
                  style={{ height: 'var(--app-height)' }}
                >
                  <SlideRenderer slide={firstSlide} isActive={false} />
                </div>
              </>
            );
          })()}
        </div>
      ))}
    </main>
  );

  return <DesktopLayout>{appContent}</DesktopLayout>;
}