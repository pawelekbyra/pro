"use client";

import React, { useState, useRef, useEffect } from 'react';

interface VideoProgressBarProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const VideoProgressBar: React.FC<VideoProgressBarProps> = ({ duration, currentTime, onSeek, onDragStart, onDragEnd }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = (clientX - rect.left) / rect.width;
    const seekTime = Math.max(0, Math.min(duration, percent * duration));
    onSeek(seekTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onDragStart?.();
    handleSeek(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    // We need to re-cast the event type for handleSeek
    handleSeek(e as unknown as React.MouseEvent<HTMLDivElement>);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    onDragEnd?.();
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div
      ref={progressBarRef}
      className="video-progress group absolute top-[-22px] left-0 w-full h-10 cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      {/* Track */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/20 rounded-full -translate-y-1/2 group-hover:h-1.5 transition-all" />

      {/* Buffered (optional, can be added later) */}
      {/* <div className="absolute top-1/2 left-0 h-1 bg-white/40 rounded-full -translate-y-1/2" style={{ width: `${bufferedPercent}%` }} /> */}

      {/* Progress */}
      <div
        className="absolute top-1/2 left-0 h-1 bg-white rounded-full -translate-y-1/2 group-hover:h-1.5 transition-all"
        style={{ width: `${progressPercent}%` }}
      />

      {/* Dot */}
      <div
        className="absolute top-1/2 w-3.5 h-3.5 bg-pink-500 border-2 border-white rounded-full -translate-y-1/2 -translate-x-1/2 transition-transform group-hover:scale-125"
        style={{ left: `${progressPercent}%` }}
      />
    </div>
  );
};

export default VideoProgressBar;
