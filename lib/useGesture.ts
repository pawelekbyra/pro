"use client";

import { useState, TouchEvent, MouseEvent } from 'react';

// Defines the minimum horizontal distance in pixels to be considered a swipe.
const SWIPE_THRESHOLD = 50;

/**
 * Defines the shape of the object returned by the useGesture hook.
 * It contains event handlers for touch and mouse events.
 */
interface GestureHandlers {
  onTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: TouchEvent<HTMLDivElement>) => void;
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseUp: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (e: MouseEvent<HTMLDivElement>) => void;
}

/**
 * A custom React hook to manage horizontal swipe gestures for both touch and mouse interactions.
 * It encapsulates all gesture-related state and logic.
 *
 * @param moveHorizontal - A callback function to be executed on a successful horizontal swipe.
 *                         It receives 'left' or 'right' as an argument.
 * @param isAnyModalOpen - A boolean that disables the gesture handling if a modal is open.
 * @returns An object containing onTouch and onMouse event handlers to be spread onto a component.
 */
export const useGesture = (
  moveHorizontal: (direction: 'left' | 'right') => void,
  isAnyModalOpen: boolean
): GestureHandlers => {
  // State to store the starting coordinates of a touch or drag.
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  // State to track if the user is currently dragging with the mouse.
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Records the starting position of a drag/touch gesture.
   */
  const handleDragStart = (x: number, y: number) => {
    if (isAnyModalOpen) return; // Disable gestures if a modal is open
    setTouchStart({ x, y });
  };

  /**
   * Calculates the swipe direction and distance at the end of a gesture.
   * If the horizontal swipe distance exceeds the threshold, it calls the moveHorizontal callback.
   */
  const handleDragEnd = (x: number, y: number) => {
    if (!touchStart || isAnyModalOpen) return;
    const deltaX = x - touchStart.x;
    const deltaY = y - touchStart.y;

    // Check if the swipe is primarily horizontal and exceeds the threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      moveHorizontal(deltaX > 0 ? 'left' : 'right');
    }

    // Reset gesture state
    setTouchStart(null);
    setIsDragging(false);
  };

  // --- Touch Event Handlers ---
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => handleDragStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

  // --- Mouse Event Handlers ---
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default browser behavior like text selection
    setIsDragging(true);
    handleDragStart(e.clientX, e.clientY);
  };
  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleDragEnd(e.clientX, e.clientY);
  };
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    // If the mouse leaves the element while dragging, consider it the end of the gesture.
    if (isDragging) {
      handleMouseUp(e);
    }
  };

  // Return the handlers to be attached to the target component
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  };
};
