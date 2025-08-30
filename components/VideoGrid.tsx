"use client";

import React, { useState, TouchEvent } from 'react';
import { Grid, Slide } from '@/lib/mock-data';
import Video from './Video';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import AccountPanel from './AccountPanel';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';

interface VideoGridProps {
  initialGrid: Grid;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe in pixels

const VideoGrid: React.FC<VideoGridProps> = ({ initialGrid }) => {
  const [grid] = useState<Grid>(initialGrid);
  const [activeCoordinates, setActiveCoordinates] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // State and handlers for modals
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTopBarModalOpen, setIsTopBarModalOpen] = useState(false);

  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);

  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);

  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isAnyModalOpen) return;
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart || isAnyModalOpen) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStart.x;
    const deltaY = touchEndY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) move('left'); else move('right');
      }
    } else {
      if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) move('up'); else move('down');
      }
    }
    setTouchStart(null);
  };

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    const { x, y } = activeCoordinates;
    let nextCoords = { x, y };

    if (direction === 'up') nextCoords = { x, y: y - 1 };
    if (direction === 'down') nextCoords = { x, y: y + 1 };
    if (direction === 'left') nextCoords = { x: x - 1, y };
    if (direction === 'right') nextCoords = { x: x + 1, y };

    if (grid[`${nextCoords.x},${nextCoords.y}`]) {
      setActiveCoordinates(nextCoords);
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

  const slidesToRender = getRenderableSlides();
  const activeSlide = slidesToRender.find(s => s.x === activeCoordinates.x && s.y === activeCoordinates.y);

  if (!activeSlide) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        Error: Slide not found at ({activeCoordinates.x}, {activeCoordinates.y}).
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
            <Video
              video={slide}
              isActive={slide.x === activeCoordinates.x && slide.y === activeCoordinates.y && !isAnyModalOpen}
              setIsModalOpen={setIsTopBarModalOpen}
              openAccountPanel={openAccountPanel}
              openCommentsModal={openCommentsModal}
              openInfoModal={openInfoModal}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows Overlay */}
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

      {/* Modals */}
      <AccountPanel isOpen={isAccountPanelOpen} onClose={closeAccountPanel} />
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={closeCommentsModal}
        videoId={activeSlide.id}
        initialCommentsCount={activeSlide.initialComments}
      />
      <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
    </div>
  );
};

export default VideoGrid;
