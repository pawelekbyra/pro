"use client";

import { useEffect, useRef } from 'react';
import DesktopLayout from '@/components/DesktopLayout';
import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { Slide } from '@/lib/types';
import { motion, PanInfo } from 'framer-motion';

const SWIPE_CONFIDENCE_THRESHOLD = 10000;

export default function Home() {
  const {
    state: { columns, activeColumnIndex, activeSlideY, activeSlideId, error },
    setActiveSlide,
    moveHorizontal,
    isAnyModalOpen,
    columnKeys,
    isLoading,
  } = useVideoGrid();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

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

      if (scrollTop < 1) { // Scrolled to the top (clone of the last slide)
        isProgrammaticScroll.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = scrollHeight - 2 * slideHeight; // Jump to the real last slide
        requestAnimationFrame(() => {
          isProgrammaticScroll.current = false;
          container.style.scrollBehavior = 'smooth';
        });
      } else if (scrollTop + clientHeight >= scrollHeight - 1) { // Scrolled to the bottom (clone of the first slide)
        isProgrammaticScroll.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = slideHeight; // Jump to the real first slide
        requestAnimationFrame(() => {
          isProgrammaticScroll.current = false;
          container.style.scrollBehavior = 'smooth';
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [columns, activeColumnIndex]);

  // This useEffect handles scrolling to the active slide when the column or slide index changes programmatically.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const slideElement = document.getElementById(`slide-${activeColumnIndex}-${activeSlideY}`);
    if (slideElement) {
      isProgrammaticScroll.current = true;

      const handleScrollEnd = () => {
        isProgrammaticScroll.current = false;
        container.removeEventListener('scrollend', handleScrollEnd);
      };

      container.addEventListener('scrollend', handleScrollEnd);

      container.scrollTo({
        top: slideElement.offsetTop,
        behavior: 'smooth',
      });

      return () => {
        container.removeEventListener('scrollend', handleScrollEnd);
      };
    }
  }, [activeColumnIndex, activeSlideY]);

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    if (isAnyModalOpen) return;

    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
      moveHorizontal('right');
    } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
      moveHorizontal('left');
    }
  };

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

  const activeColumnIndexInKeys = columnKeys.indexOf(activeColumnIndex);

  const appContent = (
    <motion.div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden flex"
      style={{ height: 'var(--app-height)' }}
    >
      <motion.div
        className="flex"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        animate={{ x: `-${activeColumnIndexInKeys * 100}%` }}
        transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.5,
        }}
      >
        {columnKeys.map((colIndex) => (
          <div
            key={colIndex}
            ref={activeColumnIndex === colIndex ? scrollContainerRef : null}
            className="h-full w-screen flex-shrink-0 snap-y snap-mandatory overflow-y-scroll"
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
                  {columnSlides.map((slide: Slide) => (
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
      </motion.div>
    </motion.div>
  );

  return <DesktopLayout>{appContent}</DesktopLayout>;
}