"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Grid, Slide } from '@/lib/types';
import VerticalFeed from './VerticalFeed';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AccountPanel from './AccountPanel';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import { Skeleton } from './ui/skeleton';

type Columns = { [x: number]: Slide[] };

interface VideoGridProps {
  initialCoordinates?: { x: number; y: number };
}

const VideoGrid: React.FC<VideoGridProps> = ({ initialCoordinates = { x: 0, y: 0 } }) => {
  // --- State Declarations ---
  const [columns, setColumns] = useState<Columns>({});
  const [activeColumnIndex, setActiveColumnIndex] = useState(initialCoordinates.x);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTopBarModalOpen, setIsTopBarModalOpen] = useState(false);
  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

  // --- Data Fetching and Processing ---
  const fetchAndProcessGrid = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/slides');
      if (!response.ok) throw new Error('Failed to fetch slides');
      const data = await response.json();

      const grid: Grid = data.grid;
      const newColumns: Columns = {};

      for (const key in grid) {
        const slide = grid[key];
        if (!newColumns[slide.x]) {
          newColumns[slide.x] = [];
        }
        newColumns[slide.x].push(slide);
      }

      // Sort slides within each column by y-coordinate
      for (const x in newColumns) {
        newColumns[x].sort((a, b) => a.y - b.y);
      }

      if (Object.keys(newColumns).length > 0) {
        setColumns(newColumns);
      }
    } catch (error) {
      console.error("Failed to fetch and process slides:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndProcessGrid();
  }, [fetchAndProcessGrid]);

  const columnKeys = useMemo(() => Object.keys(columns).map(Number).sort((a, b) => a - b), [columns]);

  // --- Navigation ---
  const moveHorizontal = useCallback((direction: 'left' | 'right') => {
    const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);
    let nextKeyIndex;
    if (direction === 'left') {
      nextKeyIndex = Math.max(0, currentKeyIndex - 1);
    } else { // 'right'
      nextKeyIndex = Math.min(columnKeys.length - 1, currentKeyIndex + 1);
    }

    if (nextKeyIndex !== currentKeyIndex) {
      setActiveColumnIndex(columnKeys[nextKeyIndex]);
    }
  }, [activeColumnIndex, columnKeys]);

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

  // --- Modal Handlers ---
  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);
  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);
  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

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

  const activeSlide = columns[activeColumnIndex]?.[0]; // For modal data
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
              onHorizontalSwipe={moveHorizontal}
              openAccountPanel={openAccountPanel}
              openCommentsModal={openCommentsModal}
              openInfoModal={openInfoModal}
              setIsTopBarModalOpen={setIsTopBarModalOpen}
              isAnyModalOpen={isAnyModalOpen}
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