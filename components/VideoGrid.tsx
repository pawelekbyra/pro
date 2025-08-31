"use client";

import React, { useState, TouchEvent, useEffect, useCallback, useRef, MouseEvent } from 'react';
import { Grid, Slide } from '@/lib/types';
import SlideRenderer from './SlideRenderer';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import AccountPanel from './AccountPanel';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import { Skeleton } from './ui/skeleton';

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe in pixels

interface VideoGridProps {
  initialCoordinates?: { x: number; y: number };
}

const VideoGrid: React.FC<VideoGridProps> = ({ initialCoordinates = { x: 0, y: 0 } }) => {
  // --- State Declarations ---
  const [grid, setGrid] = useState<Grid>({});
  const [activeCoordinates, setActiveCoordinates] = useState(initialCoordinates);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackTimes, setPlaybackTimes] = useState<{ [videoId: string]: number }>({});

  // Modal States
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTopBarModalOpen, setIsTopBarModalOpen] = useState(false);
  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

  // --- Callback Declarations ---
  const fetchGrid = useCallback(async () => {
    setIsLoading(true);
    const url = `/api/slides`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch slides');
      const data = await response.json();
      if (Object.keys(data.grid).length > 0) {
        setGrid(data.grid);
      }
    } catch (error) {
      console.error("Failed to fetch slides:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const move = useCallback((direction?: 'up' | 'down' | 'left' | 'right', coordinates?: { x: number, y: number }) => {
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

    // Boundary check for 9x9 grid
    if (nextCoords.x >= 0 && nextCoords.x < 9 && nextCoords.y >= 0 && nextCoords.y < 9) {
      setActiveCoordinates(nextCoords);
    }
  }, [activeCoordinates]);

  // --- Effect Hooks ---
  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnyModalOpen) return;
      switch (e.key) {
        case 'ArrowUp': move('up'); break;
        case 'ArrowDown': move('down'); break;
        case 'ArrowLeft': move('left'); break;
        case 'ArrowRight': move('right'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyModalOpen, move]);

  // --- Event Handlers ---
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

  // Touch Handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isAnyModalOpen) return;
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart || isAnyModalOpen) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) move('right'); else move('left');
      }
    } else {
      if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) move('down'); else move('up');
      }
    }

    setTouchStart(null);
    setIsSwiping(false);
  };

  // Mouse Handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isAnyModalOpen) return;
    e.preventDefault();
    setTouchStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !touchStart) return;
    const deltaX = e.clientX - touchStart.x;
    const deltaY = e.clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) move('right'); else move('left');
      }
    } else {
      if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) move('down'); else move('up');
      }
    }
    setIsDragging(false);
    setTouchStart(null);
  };

  // --- Render Logic ---
  if (isLoading && Object.keys(grid).length === 0) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black" style={{ height: 'var(--app-height)' }}>
        <div className="absolute top-0 left-0 w-full z-30 flex justify-center items-center" style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)' }}><Skeleton className="h-4 w-28" /></div>
        <div className="absolute right-2 flex flex-col items-center gap-4 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-10" /></div>
        <div className="absolute bottom-0 left-0 w-full z-20 p-4" style={{ paddingBottom: 'calc(10px + var(--safe-area-bottom))' }}><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
      </div>
    );
  }

  const slidesToRender = (() => {
    const { x, y } = activeCoordinates;
    const slides: Slide[] = [];
    if (grid[`${x},${y}`]) slides.push(grid[`${x},${y}`]);
    if (grid[`${x},${y - 1}`]) slides.push(grid[`${x},${y - 1}`]);
    if (grid[`${x},${y + 1}`]) slides.push(grid[`${x},${y + 1}`]);
    if (grid[`${x - 1},${y}`]) slides.push(grid[`${x - 1},${y}`]);
    if (grid[`${x + 1},${y}`]) slides.push(grid[`${x + 1},${y}`]);
    return slides;
  })();

  const activeSlide = slidesToRender.find(s => s.x === activeCoordinates.x && s.y === activeCoordinates.y);

  if (!activeSlide && !isLoading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">No videos found.</div>;
  }

  const getTransformStyle = () => `translateX(${-activeCoordinates.x * 100}%) translateY(${-activeCoordinates.y * 100}%)`;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {activeSlide && (
        <div className="relative h-full w-full" style={{ transform: getTransformStyle(), transition: 'transform 0.3s ease-out' }}>
          {slidesToRender.map((slide) => (
            <div className="absolute h-full w-full" key={slide.id} style={{ left: `${slide.x * 100}%`, top: `${slide.y * 100}%` }}>
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
      {activeSlide && (
        <div className="absolute inset-0 pointer-events-none text-white/50 z-10" style={{ paddingTop: 'var(--topbar-height)', paddingBottom: 'var(--bottombar-height)', paddingRight: '60px' }}>
          {grid[`${activeCoordinates.x},${activeCoordinates.y - 1}`] && <ArrowUp className="absolute top-[calc(var(--topbar-height)+1rem)] left-1/2 -translate-x-1/2 animate-pulse" size={48} />}
          {grid[`${activeCoordinates.x},${activeCoordinates.y + 1}`] && <ArrowDown className="absolute bottom-[calc(var(--bottombar-height)+1rem)] left-1/2 -translate-x-1/2 animate-pulse" size={48} />}
          {grid[`${activeCoordinates.x - 1},${activeCoordinates.y}`] && <ArrowLeft className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse" size={48} />}
          {grid[`${activeCoordinates.x + 1},${activeCoordinates.y}`] && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" size={48} />}
        </div>
      )}
      {activeSlide && (
        <>
          <AccountPanel isOpen={isAccountPanelOpen} onClose={closeAccountPanel} />
          <CommentsModal isOpen={isCommentsModalOpen} onClose={closeCommentsModal} videoId={activeSlide.id} initialCommentsCount={activeSlide.initialComments} />
          <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
        </>
      )}
    </div>
  );
};

export default VideoGrid;