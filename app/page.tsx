"use client";

import { useEffect, useRef } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { Slide } from '@/lib/types';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';

const SWIPE_CONFIDENCE_THRESHOLD = 10000;

export default function Home() {
  const {
    state: { columns, activeColumnIndex, activeSlideY, activeSlideId, error, activeModal },
    setActiveSlide,
    moveHorizontal,
    isAnyModalOpen,
    columnKeys,
    isLoading,
    setActiveModal,
    activeSlide,
  } = useVideoGrid();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Combined IntersectionObserver for active slide and infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const jumpTo = (newScrollTop: number) => {
      isProgrammaticScroll.current = true;
      container.scrollTop = newScrollTop;

      // Use a timeout to reset the flag, assuming the jump is nearly instant.
      // This avoids reliance on the 'scrollend' event which can be inconsistent.
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50); // A brief delay to let the scroll position settle.
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;

        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (!intersectingEntry) return;

        const slideElement = intersectingEntry.target as HTMLElement;
        const isClone = slideElement.dataset.isClone === 'true';
        const slideY = parseInt(slideElement.dataset.y || '0', 10);

        if (isClone) {
          const { scrollHeight, clientHeight } = container;
          const slideHeight = clientHeight;
          // Determine if it's the top or bottom clone based on its y-index from props
          // Assuming the last slide has the highest 'y'
          const lastSlideY = (columns[activeColumnIndex] || []).reduce((max, s) => Math.max(max, s.y), 0);
          if (slideY === lastSlideY) { // Top clone (of the last slide)
            jumpTo(scrollHeight - 2 * slideHeight);
          } else { // Bottom clone (of the first slide)
            jumpTo(slideHeight);
          }
        } else {
          // It's a real slide, set it as active
          const slideId = slideElement.dataset.id;
          if (slideId && slideY !== activeSlideY) {
            setActiveSlide(activeColumnIndex, slideY, slideId);
          }
        }
      },
      {
        root: container,
        threshold: 0.8,
      }
    );

    const slides = container.children;
    for (let i = 0; i < slides.length; i++) {
      observer.observe(slides[i]);
    }

    return () => {
      observer.disconnect();
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [columns, activeColumnIndex, activeSlideY, setActiveSlide]);

  // Keep the database warm to prevent cold starts
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/health').catch(err => console.error("DB warmup failed:", err));
    }, 240000); // 4 minutes

    return () => clearInterval(interval);
  }, []);

  // This useEffect handles scrolling to the active slide when the column or slide index changes programmatically.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const slideElement = document.getElementById(`slide-${activeColumnIndex}-${activeSlideY}`);
    if (slideElement) {
      isProgrammaticScroll.current = true;

      let scrollEndTimeout: NodeJS.Timeout;

      const handleScrollEnd = () => {
        clearTimeout(scrollEndTimeout);
        isProgrammaticScroll.current = false;
        container.removeEventListener('scrollend', handleScrollEnd);
      };

      container.addEventListener('scrollend', handleScrollEnd, { once: true });

      container.scrollTo({
        top: slideElement.offsetTop,
        behavior: 'smooth',
      });

      scrollEndTimeout = setTimeout(() => {
          console.warn('Smooth scroll "scrollend" event did not fire, resetting flag via timeout.');
          handleScrollEnd();
      }, 1500); // Smooth scroll can take longer, so a longer timeout is appropriate.

      return () => {
        clearTimeout(scrollEndTimeout);
        if (container) {
          container.removeEventListener('scrollend', handleScrollEnd);
        }
      };
    }
  }, [activeColumnIndex, activeSlideY]);

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    if (isAnyModalOpen) return;

    // Simplified swipe threshold based on drag offset only.
    // This is more reliable than using velocity.
    const swipeThreshold = containerRef.current ? containerRef.current.offsetWidth / 4 : 80;

    if (offset.x < -swipeThreshold) {
      moveHorizontal('right');
    } else if (offset.x > swipeThreshold) {
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
                    data-y={lastSlide.y}
                    className="w-full snap-start"
                    style={{ height: 'var(--app-height)' }}
                  >
                    <SlideRenderer slide={lastSlide} isActive={false} />
                  </div>

                  {/* Real slides */}
                  {columnSlides.map((slide: Slide) => {
                    const isPrefetchTarget = Math.abs(slide.y - activeSlideY) === 1;
                    return (
                      <div
                        key={slide.id}
                        id={`slide-${slide.x}-${slide.y}`}
                        data-x={slide.x}
                        data-y={slide.y}
                        className="w-full snap-start"
                        style={{ height: 'var(--app-height)' }}
                      >
                        <SlideRenderer
                          slide={slide}
                          isActive={activeSlideId === slide.id}
                          isPrefetchTarget={isPrefetchTarget}
                        />
                      </div>
                    );
                  })}

                  {/* Clone of the first slide at the end */}
                  <div
                    key={`${firstSlide.id}-clone-end`}
                    data-is-clone="true"
                    data-y={firstSlide.y}
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

  return (
    <>
      {appContent}
      <AnimatePresence>
        {activeModal === 'account' && (
          <AccountPanel onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'comments' && activeSlide && (
          <CommentsModal
            isOpen={activeModal === 'comments'}
            slideId={activeSlide.id}
            initialCommentsCount={activeSlide.initialComments}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'info' && (
          <InfoModal isOpen={activeModal === 'info'} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}