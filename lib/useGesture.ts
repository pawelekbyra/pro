"use client";

import { useState, TouchEvent, MouseEvent } from 'react';

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe in pixels

interface GestureHandlers {
  onTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: TouchEvent<HTMLDivElement>) => void;
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseUp: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (e: MouseEvent<HTMLDivElement>) => void;
}

export const useGesture = (
  moveHorizontal: (direction: 'left' | 'right') => void,
  isAnyModalOpen: boolean
): GestureHandlers => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  };
};
