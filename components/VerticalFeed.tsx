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
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gestureHandlers = useGesture(moveHorizontal, isAnyModalOpen);
  const isProgrammaticScroll = useRef(false);

  // Refined infinite scroll logic
  useEffect(() => {
    const container = feedRef.current;
    if (!container || slides.length <= 1) return;

    // Initial positioning to the first real slide after mounting
    container.scrollTo({ top: container.clientHeight, behavior: 'auto' });

    const handleScroll = () => {
      // If the scroll is caused by our infinite loop logic, ignore it
      if (isProgrammaticScroll.current) {
        isProgrammaticScroll.current = false; // Reset the flag
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const slideHeight = clientHeight;

      const tolerance = 1; // A small tolerance to handle floating point inaccuracies

      // At the top clone, jump to the last real slide
      if (scrollTop < tolerance) {
        isProgrammaticScroll.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = slideHeight * slides.length;
        // Restore smooth scrolling after the jump
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
        }, 50); // A short delay to ensure the scroll jump completes
      }
      // At the bottom clone, jump to the first real slide
      else if (scrollTop >= scrollHeight - slideHeight - tolerance) {
        isProgrammaticScroll.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollTop = slideHeight;
        // Restore smooth scrolling after the jump
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
        }, 50);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
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

  // IntersectionObserver now correctly identifies the active slide
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideId = entry.target.getAttribute('data-id');
            const slideX = parseInt(entry.target.getAttribute('data-x') || '0', 10);
            const slideY = parseInt(entry.target.getAttribute('data-y') || '0', 10);
            if (slideId && !isProgrammaticScroll.current) {
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

  // --- Advanced Pre-fetching Logic ---
  useEffect(() => {
    if (!activeSlideId || !slides.length) {
      setPrefetchHint(null);
      return;
    }

    const currentColumn = slides;
    const currentSlideIndex = currentColumn.findIndex(s => s.id === activeSlideId);

    if (currentSlideIndex === -1) {
      setPrefetchHint(null);
      return;
    }

    // When near the end of the column, prioritize pre-fetching the next column for a smooth horizontal swipe.
    const isNearEnd = currentSlideIndex >= currentColumn.length - 2;
    const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);
    const hasNextColumn = currentKeyIndex < columnKeys.length - 1;

    if (isNearEnd && hasNextColumn) {
      const nextColumnX = columnKeys[currentKeyIndex + 1];
      const nextColumn = columns[nextColumnX];
      if (nextColumn && nextColumn.length > 0) {
        const nextSlide = nextColumn[0];
        setPrefetchHint({ x: nextSlide.x, y: nextSlide.y });
        return; // Prioritize horizontal pre-fetch
      }
    }

    // Otherwise, pre-fetch the next slide in the current column, looping for infinite scroll.
    const nextSlideIndex = (currentSlideIndex + 1) % currentColumn.length;
    const nextSlide = currentColumn[nextSlideIndex];
    if (nextSlide) {
      setPrefetchHint({ x: nextSlide.x, y: nextSlide.y });
    } else {
      setPrefetchHint(null);
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
              isActive={isActive && activeSlideId === slide.id}
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
