"use client";

import { useEffect, useRef } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { Slide } from '@/lib/types';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';

export default function Home() {
  const {
    state: { columns, activeColumnIndex, activeSlideId, error, activeModal, isNavigating },
    isAnyModalOpen,
    columnKeys,
    isLoading,
    setActiveModal,
    activeSlide,
    handleNavigation,
  } = useVideoGrid();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Unified scroll effect
  useEffect(() => {
    if (!activeSlideId || isNavigating) return;

    const slideElement = document.getElementById(`slide-${activeSlideId}`);
    if (scrollContainerRef.current && slideElement && slideElement.parentElement === scrollContainerRef.current) {
        slideElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }
  }, [activeSlideId, isNavigating]);

  // Infinite scroll observer effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isNavigating) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const slideElement = entry.target as HTMLElement;
            const isClone = slideElement.dataset.isClone === 'true';

            if (isClone) {
                const isBottomClone = slideElement.dataset.y === columns[activeColumnIndex]?.[0]?.y.toString();
                const direction = isBottomClone ? 'down' : 'up';
                handleNavigation(direction);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.9,
      }
    );

    const clones = container.querySelectorAll('[data-is-clone="true"]');
    clones.forEach(clone => observer.observe(clone));

    return () => observer.disconnect();
  }, [columns, activeColumnIndex, isNavigating, handleNavigation]);


  // Keep the database warm to prevent cold starts
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/health').catch(err => console.error("DB warmup failed:", err));
    }, 240000); // 4 minutes

    return () => clearInterval(interval);
  }, []);

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    if (isAnyModalOpen || isNavigating) return;

    const swipeThreshold = 80;

    if (offset.x < -swipeThreshold) {
      handleNavigation('right');
    } else if (offset.x > swipeThreshold) {
      handleNavigation('left');
    }
  };

  if (isLoading && !activeSlideId) {
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
            data-active-column={activeColumnIndex === colIndex}
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
                    return (
                      <div
                        key={slide.id}
                        id={`slide-${slide.id}`} // Use slide.id for a truly unique ID
                        data-x={slide.x}
                        data-y={slide.y}
                        className="w-full snap-start"
                        style={{ height: 'var(--app-height)' }}
                      >
                        <SlideRenderer
                          slide={slide}
                          isActive={activeSlideId === slide.id}
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