"use client";

import React, { createContext, useEffect, useCallback, useMemo, ReactNode, useContext, useReducer } from 'react';
import { Grid, Slide } from '@/lib/types';

type Columns = { [x: number]: Slide[] };

// --- State and Reducer ---

interface State {
  columns: Columns;
  activeColumnIndex: number;
  activeSlideY: number;
  activeSlideId: string | null;
  soundActiveSlideId: string | null;
  prefetchHint: { x: number, y: number } | null;
  isLoading: boolean;
  isAccountPanelOpen: boolean;
  isCommentsModalOpen: boolean;
  isInfoModalOpen: boolean;
  isTopBarModalOpen: boolean;
  error: Error | null;
}

type Action =
  | { type: 'SET_GRID_DATA'; payload: Columns }
  | { type: 'UPDATE_ACTIVE_SLIDE'; payload: { x: number; y: number; id: string } }
  | { type: 'SET_SOUND_ACTIVE_SLIDE'; payload: string | null }
  | { type: 'SET_PREFETCH_HINT'; payload: { x: number; y: number } | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODAL_OPEN'; payload: { modal: 'isAccountPanelOpen' | 'isCommentsModalOpen' | 'isInfoModalOpen' | 'isTopBarModalOpen'; isOpen: boolean } }
  | { type: 'SET_ERROR'; payload: Error | null };

const initialState: State = {
  columns: {},
  activeColumnIndex: 0,
  activeSlideY: 0,
  activeSlideId: null,
  soundActiveSlideId: null,
  prefetchHint: null,
  isLoading: true,
  isAccountPanelOpen: false,
  isCommentsModalOpen: false,
  isInfoModalOpen: false,
  isTopBarModalOpen: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GRID_DATA':
      return { ...state, columns: action.payload };
    case 'UPDATE_ACTIVE_SLIDE':
      return {
        ...state,
        activeColumnIndex: action.payload.x,
        activeSlideY: action.payload.y,
        activeSlideId: action.payload.id,
        soundActiveSlideId: action.payload.id,
        prefetchHint: null,
      };
    case 'SET_SOUND_ACTIVE_SLIDE':
      return { ...state, soundActiveSlideId: action.payload };
    case 'SET_PREFETCH_HINT':
      return { ...state, prefetchHint: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_MODAL_OPEN':
      return { ...state, [action.payload.modal]: action.payload.isOpen };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

// --- Context ---

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
  error: Error | null;
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
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    activeColumnIndex: initialCoordinates.x,
    activeSlideY: initialCoordinates.y,
  });

  const {
    columns,
    activeColumnIndex,
    activeSlideY,
    activeSlideId,
    soundActiveSlideId,
    prefetchHint,
    isLoading,
    isAccountPanelOpen,
    isCommentsModalOpen,
    isInfoModalOpen,
    isTopBarModalOpen,
    error,
  } = state;

  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

  // --- Data Fetching and Processing ---
  const fetchAndProcessGrid = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
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

      for (const x in newColumns) {
        newColumns[x].sort((a, b) => a.y - b.y);
      }

      if (Object.keys(newColumns).length > 0) {
        dispatch({ type: 'SET_GRID_DATA', payload: newColumns });
      }
    } catch (err) {
      console.error("Failed to fetch and process slides:", err);
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    fetchAndProcessGrid();
  }, [fetchAndProcessGrid]);

  const columnKeys = useMemo(() => Object.keys(columns).map(Number).sort((a, b) => a - b), [columns]);

  // --- Navigation ---
  const setActiveSlide = useCallback((x: number, y: number, id: string) => {
    dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x, y, id } });
  }, []);

  const setSoundActiveSlide = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SOUND_ACTIVE_SLIDE', payload: id });
  }, []);

  const setPrefetchHint = useCallback((hint: { x: number; y: number } | null) => {
    dispatch({ type: 'SET_PREFETCH_HINT', payload: hint });
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
      const firstSlideInNewColumn = columns[newColumnIndex]?.[0];
      if (firstSlideInNewColumn) {
        dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x: newColumnIndex, y: firstSlideInNewColumn.y, id: firstSlideInNewColumn.id } });
      }
    }
  }, [activeColumnIndex, columnKeys, columns]);

  // --- Modal Handlers ---
  const openAccountPanel = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isAccountPanelOpen', isOpen: true } });
  const closeAccountPanel = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isAccountPanelOpen', isOpen: false } });
  const openCommentsModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isCommentsModalOpen', isOpen: true } });
  const closeCommentsModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isCommentsModalOpen', isOpen: false } });
  const openInfoModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isInfoModalOpen', isOpen: true } });
  const closeInfoModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isInfoModalOpen', isOpen: false } });
  const setIsTopBarModalOpen = (isOpen: boolean) => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isTopBarModalOpen', isOpen } });


  const activeSlide = useMemo(() => {
    const column = columns[activeColumnIndex];
    if (!column) return undefined;
    return column.find(slide => slide.y === activeSlideY);
  }, [columns, activeColumnIndex, activeSlideY]);

  const value: VideoGridContextType = {
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
    error,
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
