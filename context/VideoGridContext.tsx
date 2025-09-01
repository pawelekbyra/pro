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
  loadingColumns: Set<number>;
  isAccountPanelOpen: boolean;
  isCommentsModalOpen: boolean;
  isInfoModalOpen: boolean;
  isTopBarModalOpen: boolean;
  error: Error | null;
}

type Action =
  | { type: 'SET_GRID_DATA'; payload: Columns }
  | { type: 'ADD_GRID_DATA'; payload: Columns }
  | { type: 'UPDATE_ACTIVE_SLIDE'; payload: { x: number; y: number; id: string } }
  | { type: 'SET_SOUND_ACTIVE_SLIDE'; payload: string | null }
  | { type: 'SET_PREFETCH_HINT'; payload: { x: number; y: number } | null }
  | { type: 'START_LOADING_COLUMN'; payload: number }
  | { type: 'FINISH_LOADING_COLUMN'; payload: number }
  | { type: 'SET_MODAL_OPEN'; payload: { modal: 'isAccountPanelOpen' | 'isCommentsModalOpen' | 'isInfoModalOpen' | 'isTopBarModalOpen'; isOpen: boolean } }
  | { type: 'SET_ERROR'; payload: Error | null };

const initialState: State = {
  columns: {},
  activeColumnIndex: 0,
  activeSlideY: 0,
  activeSlideId: null,
  soundActiveSlideId: null,
  prefetchHint: null,
  loadingColumns: new Set(),
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
    case 'ADD_GRID_DATA':
      return { ...state, columns: { ...state.columns, ...action.payload } };
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
    case 'START_LOADING_COLUMN':
      return { ...state, loadingColumns: new Set(state.loadingColumns).add(action.payload) };
    case 'FINISH_LOADING_COLUMN':
      const newLoadingColumns = new Set(state.loadingColumns);
      newLoadingColumns.delete(action.payload);
      return { ...state, loadingColumns: newLoadingColumns };
    case 'SET_MODAL_OPEN':
      return { ...state, [action.payload.modal]: action.payload.isOpen };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// --- Context ---

interface VideoGridContextType {
  state: State;
  isLoading: boolean;
  isAnyModalOpen: boolean;
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
}

const VideoGridContext = createContext<VideoGridContextType | undefined>(undefined);

export const VideoGridProvider = ({ children, initialCoordinates = { x: 0, y: 0 } }: { children: ReactNode, initialCoordinates?: { x: number; y: number } }) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    activeColumnIndex: initialCoordinates.x,
    activeSlideY: initialCoordinates.y,
  });

  const isAnyModalOpen = state.isAccountPanelOpen || state.isCommentsModalOpen || state.isInfoModalOpen || state.isTopBarModalOpen;
  const isLoading = state.loadingColumns.size > 0;

  const fetchColumn = useCallback(async (x: number) => {
    if (state.columns[x] || state.loadingColumns.has(x)) {
      return;
    }
    dispatch({ type: 'START_LOADING_COLUMN', payload: x });
    try {
      const response = await fetch(`/api/slides?x=${x}`);
      if (!response.ok) throw new Error(`Failed to fetch column ${x}`);
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
      for (const col in newColumns) {
        newColumns[col].sort((a, b) => a.y - b.y);
      }

      if (Object.keys(newColumns).length > 0) {
        dispatch({ type: 'ADD_GRID_DATA', payload: newColumns });
      }
    } catch (err) {
      console.error(`Failed to fetch and process column ${x}:`, err);
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    } finally {
      dispatch({ type: 'FINISH_LOADING_COLUMN', payload: x });
    }
  }, [state.columns, state.loadingColumns]);

  useEffect(() => {
    const x = state.activeColumnIndex;
    // Fetch current column and pre-fetch adjacent ones
    fetchColumn(x);
    fetchColumn(x + 1);
    if (x > 0) {
      fetchColumn(x - 1);
    }
  }, [state.activeColumnIndex, fetchColumn]);

  const columnKeys = useMemo(() => Object.keys(state.columns).map(Number).sort((a, b) => a - b), [state.columns]);

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
    const currentKeyIndex = columnKeys.indexOf(state.activeColumnIndex);
    let nextKeyIndex;
    if (direction === 'left') {
      nextKeyIndex = Math.max(0, currentKeyIndex - 1);
    } else { // 'right'
      nextKeyIndex = Math.min(columnKeys.length - 1, currentKeyIndex + 1);
    }

    if (nextKeyIndex !== currentKeyIndex) {
      const newColumnIndex = columnKeys[nextKeyIndex];
      const firstSlideInNewColumn = state.columns[newColumnIndex]?.[0];
      if (firstSlideInNewColumn) {
        dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x: newColumnIndex, y: firstSlideInNewColumn.y, id: firstSlideInNewColumn.id } });
      }
    }
  }, [state.activeColumnIndex, columnKeys, state.columns]);

  // --- Modal Handlers ---
  const openAccountPanel = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isAccountPanelOpen', isOpen: true } });
  const closeAccountPanel = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isAccountPanelOpen', isOpen: false } });
  const openCommentsModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isCommentsModalOpen', isOpen: true } });
  const closeCommentsModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isCommentsModalOpen', isOpen: false } });
  const openInfoModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isInfoModalOpen', isOpen: true } });
  const closeInfoModal = () => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isInfoModalOpen', isOpen: false } });
  const setIsTopBarModalOpen = (isOpen: boolean) => dispatch({ type: 'SET_MODAL_OPEN', payload: { modal: 'isTopBarModalOpen', isOpen } });


  const activeSlide = useMemo(() => {
    const column = state.columns[state.activeColumnIndex];
    if (!column) return undefined;
    return column.find(slide => slide.y === state.activeSlideY);
  }, [state.columns, state.activeColumnIndex, state.activeSlideY]);

  const value: VideoGridContextType = {
    state,
    isLoading,
    isAnyModalOpen,
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
