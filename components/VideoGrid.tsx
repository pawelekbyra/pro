"use client";

import React, { useState, TouchEvent, useEffect, useCallback } from 'react';
import { Grid, Slide } from '@/lib/types';
import SlideRenderer from './SlideRenderer';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import AccountPanel from './AccountPanel';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import { Skeleton } from './ui/skeleton';

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe in pixels
const PREFETCH_THRESHOLD = 2; // How many videos away from the end to trigger a new fetch

const VideoGrid: React.FC = () => {
  const [grid, setGrid] = useState<Grid>({});
  const [activeCoordinates, setActiveCoordinates] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Data fetching state
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // State and handlers for modals
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTopBarModalOpen, setIsTopBarModalOpen] = useState(false);
  const [playbackTimes, setPlaybackTimes] = useState<{ [videoId: string]: number }>({});

  // The new endpoint `/api/slides` currently returns the entire mock grid at once.
  // The logic for pagination (`fetchMoreVideos`, `page`, `hasMore`) is kept here
  // commented out, in case we want to re-introduce pagination later.
  useEffect(() => {
    const fetchSlides = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/slides');
        if (!response.ok) throw new Error('Failed to fetch slides');
        const data = await response.json();
        setGrid(data.grid);
      } catch (error) {
        console.error("Failed to fetch slides:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, []);

  const handleTimeUpdate = (videoId: string, time: number) => {
    if (time > 0.1) {
      setPlaybackTimes(prev => ({ ...prev, [videoId]: time }));
    }
  };

  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);

  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);

  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStart.x;
    const deltaY = touchEndY - touchStart.y;

    if (!isAnyModalOpen) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
          if (deltaX > 0) move('left'); else move('right');
        }
      } else {
        if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
          if (deltaY > 0) move('up'); else move('down');
        }
      }
    }
    setTouchStart(null);
  };

  const move = (direction?: 'up' | 'down' | 'left' | 'right', coordinates?: { x: number, y: number }) => {
    let nextCoords;

    if (coordinates) {
      nextCoords = coordinates;
    } else {
      const { x, y } = activeCoordinates;
      nextCoords = { x, y };
      if (direction === 'up') nextCoords = { x, y: y - 1 };
      if (direction === 'down') nextCoords = { x, y: y + 1 };
      if (direction === 'left') nextCoords = { x: x - 1, y };
      if (direction === 'right') nextCoords = { x: x + 1, y };
    }

    if (grid[`${nextCoords.x},${nextCoords.y}`]) {
      setActiveCoordinates(nextCoords);

      // The prefetching logic is removed for now. It can be re-introduced
      // if we bring back pagination for the slides.
    }
  };

  const getRenderableSlides = () => {
    const { x, y } = activeCoordinates;
    const slidesToRender: Slide[] = [];
    const center = grid[`${x},${y}`];
    if (center) slidesToRender.push(center);
    const up = grid[`${x},${y - 1}`];
    if (up) slidesToRender.push(up);
    const down = grid[`${x},${y + 1}`];
    if (down) slidesToRender.push(down);
    const left = grid[`${x - 1},${y}`];
    if (left) slidesToRender.push(left);
    const right = grid[`${x + 1},${y}`];
    if (right) slidesToRender.push(right);
    return slidesToRender;
  };

  // Initial loading skeleton
  if (isLoading && page === 1) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black" style={{ height: 'var(--app-height)' }}>
        <div className="absolute top-0 left-0 w-full z-30 flex justify-center items-center" style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)' }}>
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="absolute right-2 flex flex-col items-center gap-4 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="absolute bottom-0 left-0 w-full z-20 p-4" style={{ paddingBottom: 'calc(10px + var(--safe-area-bottom))' }}>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  const slidesToRender = getRenderableSlides();
  const activeSlide = slidesToRender.find(s => s.x === activeCoordinates.x && s.y === activeCoordinates.y);

  if (!activeSlide && !isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        No videos found.
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {activeSlide && (
        <div
          className="relative h-full w-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(${-activeCoordinates.x * 100}%) translateY(${-activeCoordinates.y * 100}%)` }}
        >
          {slidesToRender.map((slide) => (
            <div
              className="absolute h-full w-full"
              key={slide.id}
              style={{ left: `${slide.x * 100}%`, top: `${slide.y * 100}%` }}
            >
              <SlideRenderer
                slide={slide}
                isActive={slide.x === activeCoordinates.x && slide.y === activeCoordinates.y && !isAnyModalOpen}
                setIsModalOpen={setIsTopBarModalOpen}
                openAccountPanel={openAccountPanel}
                openCommentsModal={openCommentsModal}
                openInfoModal={openInfoModal}
                onTimeUpdate={handleTimeUpdate}
                startTime={playbackTimes[slide.id] || 0}
                onNavigate={({ x, y }) => move(undefined, { x, y })}
                onPlaybackFailure={() => {
                  console.log("Playback failed for the current slide. Moving to the next one.");
                  // The hasMore logic is removed for now, but we can add it back if we re-introduce pagination
                  if (grid[`${activeCoordinates.x},${activeCoordinates.y + 1}`]) {
                    move('down');
                  } else {
                    console.error("Playback failed and no next slide to move to.");
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Navigation Arrows Overlay */}
      {activeSlide && (
        <div className="absolute inset-0 pointer-events-none text-white/50 z-10">
          {grid[`${activeCoordinates.x},${activeCoordinates.y - 1}`] && (
            <ArrowUp className="absolute top-4 left-1/2 -translate-x-1/2 animate-pulse" size={48} />
          )}
          {grid[`${activeCoordinates.x},${activeCoordinates.y + 1}`] && (
            <ArrowDown className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-pulse" size={48} />
          )}
          {grid[`${activeCoordinates.x - 1},${activeCoordinates.y}`] && (
            <ArrowLeft className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse" size={48} />
          )}
          {grid[`${activeCoordinates.x + 1},${activeCoordinates.y}`] && (
            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" size={48} />
          )}
        </div>
      )}

      {activeSlide && (
        <>
          <AccountPanel isOpen={isAccountPanelOpen} onClose={closeAccountPanel} />
          <CommentsModal
            isOpen={isCommentsModalOpen}
            onClose={closeCommentsModal}
            videoId={activeSlide.id}
            initialCommentsCount={activeSlide.initialComments}
          />
          <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
        </>
      )}
    </div>
  );
};

export default VideoGrid;
