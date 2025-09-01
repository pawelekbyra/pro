"use client";

import React, { useEffect } from 'react';
import VerticalFeed from './VerticalFeed';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AccountPanel from './AccountPanel';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import { Skeleton } from './ui/skeleton';
import { useVideoGrid } from '@/context/VideoGridContext';

interface VideoGridProps {
  initialCoordinates?: { x: number; y: number };
}

const VideoGrid: React.FC<VideoGridProps> = () => {
  const {
    columns,
    activeColumnIndex,
    isLoading,
    isAccountPanelOpen,
    isCommentsModalOpen,
    isInfoModalOpen,
    isAnyModalOpen,
    moveHorizontal,
    closeAccountPanel,
    closeCommentsModal,
    closeInfoModal,
    activeSlide,
    columnKeys
  } = useVideoGrid();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnyModalOpen) return;
      switch (e.key) {
        case 'ArrowLeft': moveHorizontal('left'); break;
        case 'ArrowRight': moveHorizontal('right'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyModalOpen, moveHorizontal]);

  // --- Render Logic ---
  if (isLoading && columnKeys.length === 0) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black" style={{ height: 'var(--app-height)' }}>
        <div className="absolute top-0 left-0 w-full z-30 flex justify-center items-center" style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)' }}><Skeleton className="h-4 w-28" /></div>
        <div className="absolute right-2 flex flex-col items-center gap-4 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-10" /></div>
        <div className="absolute bottom-0 left-0 w-full z-20 p-4" style={{ paddingBottom: 'calc(10px + var(--safe-area-bottom))' }}><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
      </div>
    );
  }

  if (columnKeys.length === 0 && !isLoading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">No videos found.</div>;
  }

  const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div
        className="relative h-full w-full flex"
        style={{
          transform: `translateX(-${currentKeyIndex * 100}%)`,
          transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {columnKeys.map((key) => (
          <div className="h-full w-full flex-shrink-0" key={key}>
            <VerticalFeed
              slides={columns[key]}
              isActive={key === activeColumnIndex}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-0 pointer-events-none text-white/50 z-10">
        {currentKeyIndex > 0 && <ArrowLeft className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse" size={48} />}
        {currentKeyIndex < columnKeys.length - 1 && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" size={48} />}
      </div>

      {/* Modals */}
      {activeSlide && (
        <>
          <AccountPanel isOpen={isAccountPanelOpen} onClose={closeAccountPanel} />
          {/* Assuming CommentsModal needs videoId from the active slide */}
          <CommentsModal isOpen={isCommentsModalOpen} onClose={closeCommentsModal} videoId={activeSlide.id} initialCommentsCount={activeSlide.initialComments} />
          <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
        </>
      )}
    </div>
  );
};

export default VideoGrid;