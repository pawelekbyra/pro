"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { Slide } from '@/lib/types';
import SlideRenderer from './SlideRenderer';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useGesture } from '@/lib/useGesture';

interface VerticalFeedProps {
  slides: Slide[];
  isActive: boolean; // Is this the active column?
}

const VerticalFeed: React.FC<VerticalFeedProps> = ({
  slides,
  isActive,
}) => {
  const {
    moveHorizontal,
    setIsTopBarModalOpen,
    isAnyModalOpen,
    setActiveSlide,
    activeSlideId,
    activeSlideY,
    activeColumnIndex,
    columns,
    columnKeys,
    setPrefetchHint,
  } = useVideoGrid();
  const feedRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gestureHandlers = useGesture(moveHorizontal, isAnyModalOpen);

  // --- Infinite Scroll Logic ---
  useEffect(() => {
    const container = feedRef.current;
    if (!container || slides.length <= 1) return;

    // Initial positioning to the first real slide
    container.scrollTo({ top: container.clientHeight, behavior: 'auto' });

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const slideHeight = clientHeight;

        // At the top clone, jump to the last real slide
        if (scrollTop < 1) {
          container.style.scrollBehavior = 'auto';
          container.scrollTop = slideHeight * slides.length;
          requestAnimationFrame(() => {
            container.style.scrollBehavior = 'smooth';
          });
        }
        // At the bottom clone, jump to the first real slide
        else if (scrollTop >= scrollHeight - slideHeight) {
          container.style.scrollBehavior = 'auto';
          container.scrollTop = slideHeight;
          requestAnimationFrame(() => {
            container.style.scrollBehavior = 'smooth';
          });
        }
      }, 150); // Debounce time
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [slides]);

  // --- Horizontal Navigation Scroll Fix ---
  useEffect(() => {
    // Only scroll if this feed is the active one
    if (isActive) {
      const container = feedRef.current;
      if (container) {
        // Scroll to the first real slide.
        // The y-position of the first real slide is equal to the container's height.
        container.scrollTo({ top: container.clientHeight, behavior: 'auto' });
      }
    }
  }, [isActive, activeColumnIndex]); // Reruns when this column becomes active

  // --- Active Slide Tracking via IntersectionObserver ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideId = entry.target.getAttribute('data-id');
            const slideX = parseInt(entry.target.getAttribute('data-x') || '0', 10);
            const slideY = parseInt(entry.target.getAttribute('data-y') || '0', 10);
            if (slideId) {
              setActiveSlide(slideX, slideY, slideId);
            }
          }
        });
      },
      { root: feedRef.current, threshold: 0.6 }
    );

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [slides, setActiveSlide]);

  // --- Pre-fetching Logic ---
  useEffect(() => {
    if (!activeSlideId) return;

    const currentColumn = slides;
    const currentSlideIndex = currentColumn.findIndex(s => s.id === activeSlideId);

    if (currentSlideIndex === -1) return;

    // Prefetch next slide in the same column
    if (currentSlideIndex < currentColumn.length - 1) {
      const nextSlide = currentColumn[currentSlideIndex + 1];
      setPrefetchHint({ x: nextSlide.x, y: nextSlide.y });
    } else {
      // Or prefetch the first slide of the next column if we are at the end
      const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);
      if (currentKeyIndex < columnKeys.length - 1) {
        const nextColumnX = columnKeys[currentKeyIndex + 1];
        const nextColumn = columns[nextColumnX];
        if (nextColumn && nextColumn.length > 0) {
          const nextSlide = nextColumn[0];
          setPrefetchHint({ x: nextSlide.x, y: nextSlide.y });
        }
      } else {
        // No more slides to prefetch
        setPrefetchHint(null);
      }
    }
  }, [activeSlideId, slides, activeColumnIndex, columnKeys, columns, setPrefetchHint]);


  const handlePlaybackFailure = useCallback(() => {
    const activeIndex = slides.findIndex(s => s.y === activeSlideY);
    if (activeIndex !== -1 && activeIndex < slides.length - 1) {
      const container = feedRef.current;
      if (container) {
        container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
      }
    } else {
      console.error("Playback failed on the last slide of the column, not scrolling further.");
    }
  }, [activeSlideY, slides]);

  // Render cloned slides for infinite loop effect
  const slidesWithClones = slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;

  return (
    <div
      ref={feedRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollBehavior: 'smooth' }}
      {...gestureHandlers}
    >
      {slidesWithClones.map((slide, index) => {
        const isClone = index === 0 || index === slidesWithClones.length - 1;
        const originalIndex = index === 0 ? slides.length - 1 : (index === slidesWithClones.length - 1 ? 0 : index - 1);

        return (
          <div
            key={`${slide.id}-${index}`}
            ref={(el) => {
              if (!isClone) {
                slideRefs.current[originalIndex] = el;
              }
            }}
            data-index={originalIndex}
            data-id={slide.id}
            data-x={slide.x}
            data-y={slide.y}
            className="h-full w-full snap-start flex-shrink-0 relative"
          >
            <SlideRenderer
              slide={slide}
              isActive={isActive && !isAnyModalOpen && activeSlideId === slide.id}
              setIsModalOpen={setIsTopBarModalOpen}
              onTimeUpdate={() => {}} // Placeholder, can be implemented if needed
              startTime={0} // Playback position is managed by the browser on scroll
              onNavigate={() => {}} // Vertical navigation is handled by scroll, horizontal by swipe
              onPlaybackFailure={handlePlaybackFailure}
            />
          </div>
        );
      })}
    </div>
  );
};

export default VerticalFeed;
