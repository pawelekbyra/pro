"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode, useContext } from 'react';
import { Grid, Slide } from '@/lib/types';

type Columns = { [x: number]: Slide[] };

interface VideoGridContextType {
  columns: Columns;
  activeColumnIndex: number;
  activeSlideY: number;
  activeSlideId: string | null;
  soundActiveSlideId: string | null;
  isLoading: boolean;
  isAccountPanelOpen: boolean;
  isCommentsModalOpen: boolean;
  isInfoModalOpen: boolean;
  isTopBarModalOpen: boolean;
  isAnyModalOpen: boolean;
  fetchAndProcessGrid: () => Promise<void>;
  moveHorizontal: (direction: 'left' | 'right') => void;
  setActiveSlide: (x: number, y: number, id: string) => void;
  setSoundActiveSlide: (id: string | null) => void;
  setPrefetchHint: (hint: { x: number; y: number } | null) => void;
  openAccountPanel: () => void;
  closeAccountPanel: () => void;
  openCommentsModal: () => void;
  closeCommentsModal: () => void;
  openInfoModal: () => void;
  closeInfoModal: () => void;
  setIsTopBarModalOpen: (isOpen: boolean) => void;
  initialCoordinates?: { x: number; y: number };
  activeSlide?: Slide;
  columnKeys: number[];
  prefetchHint: { x: number; y: number } | null;
}

const VideoGridContext = createContext<VideoGridContextType | undefined>(undefined);

export const VideoGridProvider = ({ children, initialCoordinates = { x: 0, y: 0 } }: { children: ReactNode, initialCoordinates?: { x: number; y: number } }) => {
  // --- State Declarations ---
  const [columns, setColumns] = useState<Columns>({});
  const [activeColumnIndex, setActiveColumnIndex] = useState(initialCoordinates.x);
  const [activeSlideY, setActiveSlideY] = useState(initialCoordinates.y);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [soundActiveSlideId, setSoundActiveSlide] = useState<string | null>(null);
  const [prefetchHint, setPrefetchHint] = useState<{ x: number, y: number } | null>(null);
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
  const setActiveSlide = useCallback((x: number, y: number, id: string) => {
    setActiveColumnIndex(x);
    setActiveSlideY(y);
    setActiveSlideId(id);
    setSoundActiveSlide(id); // Also set the sound active slide
    setPrefetchHint(null); // Reset prefetch hint when slide changes
  }, []);

  const moveHorizontal = useCallback((direction: 'left' | 'right') => {
    const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);
    let nextKeyIndex;
    if (direction === 'left') {
      nextKeyIndex = Math.max(0, currentKeyIndex - 1);
    } else { // 'right'
      nextKeyIndex = Math.min(columnKeys.length - 1, currentKeyIndex + 1);
    }

    if (nextKeyIndex !== currentKeyIndex) {
      const newColumnIndex = columnKeys[nextKeyIndex];
      setActiveColumnIndex(newColumnIndex);
      // When moving horizontally, reset vertical position to the top of the new column
      const firstSlideInNewColumn = columns[newColumnIndex]?.[0];
      if (firstSlideInNewColumn) {
        setActiveSlideY(firstSlideInNewColumn.y);
        setActiveSlideId(firstSlideInNewColumn.id);
      }
    }
  }, [activeColumnIndex, columnKeys, columns]);

  // --- Modal Handlers ---
  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);
  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);
  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

  const activeSlide = useMemo(() => {
    const column = columns[activeColumnIndex];
    if (!column) return undefined;
    return column.find(slide => slide.y === activeSlideY);
  }, [columns, activeColumnIndex, activeSlideY]);

  const value = {
    columns,
    activeColumnIndex,
    activeSlideY,
    activeSlideId,
    soundActiveSlideId,
    isLoading,
    isAccountPanelOpen,
    isCommentsModalOpen,
    isInfoModalOpen,
    isTopBarModalOpen,
    isAnyModalOpen,
    fetchAndProcessGrid,
    moveHorizontal,
    setActiveSlide,
    setSoundActiveSlide,
    setPrefetchHint,
    openAccountPanel,
    closeAccountPanel,
    openCommentsModal,
    closeCommentsModal,
    openInfoModal,
    closeInfoModal,
    setIsTopBarModalOpen,
    initialCoordinates,
    activeSlide,
    columnKeys,
    prefetchHint
  };

  return (
    <VideoGridContext.Provider value={value}>
      {children}
    </VideoGridContext.Provider>
  );
};

export const useVideoGrid = () => {
  const context = useContext(VideoGridContext);
  if (context === undefined) {
    throw new Error('useVideoGrid must be used within a VideoGridProvider');
  }
  return context;
};
