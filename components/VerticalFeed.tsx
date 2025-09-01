"use client";

import React, { useState, TouchEvent, useEffect, useRef, MouseEvent, useCallback } from 'react';
import { Slide } from '@/lib/types';
import SlideRenderer from './SlideRenderer';
import { useVideoGrid } from '@/context/VideoGridContext';

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe in pixels

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
    openAccountPanel,
    openCommentsModal,
    openInfoModal,
    setIsTopBarModalOpen,
    isAnyModalOpen
  } = useVideoGrid();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0); // Index within the original `slides` array
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // --- Active Slide Tracking via IntersectionObserver ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setActiveSlideIndex(index);
          }
        });
      },
      { root: feedRef.current, threshold: 0.6 }
    );

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [slides]);

  const handlePlaybackFailure = useCallback(() => {
    // Check if there is a next slide to scroll to.
    if (activeSlideIndex < slides.length - 1) {
      const container = feedRef.current;
      if (container) {
        container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
      }
    } else {
      console.error("Playback failed on the last slide of the column, not scrolling further.");
    }
  }, [activeSlideIndex, slides.length]);

  // --- Gesture Handling (Touch & Mouse) ---
  const handleDragStart = (x: number, y: number) => {
    if (isAnyModalOpen) return;
    setTouchStart({ x, y });
  };

  const handleDragEnd = (x: number, y: number) => {
    if (!touchStart || isAnyModalOpen) return;
    const deltaX = x - touchStart.x;
    const deltaY = y - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      moveHorizontal(deltaX > 0 ? 'left' : 'right');
    }

    setTouchStart(null);
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => handleDragStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleDragStart(e.clientX, e.clientY);
  };
  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleDragEnd(e.clientX, e.clientY);
  };
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMouseUp(e);
    }
  };

  // Render cloned slides for infinite loop effect
  const slidesWithClones = slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;

  return (
    <div
      ref={feedRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollBehavior: 'smooth' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
            className="h-full w-full snap-start flex-shrink-0 relative"
          >
            <SlideRenderer
              slide={slide}
              isActive={isActive && !isAnyModalOpen && activeSlideIndex === originalIndex}
              setIsModalOpen={setIsTopBarModalOpen}
              openAccountPanel={openAccountPanel}
              openCommentsModal={openCommentsModal}
              openInfoModal={openInfoModal}
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
