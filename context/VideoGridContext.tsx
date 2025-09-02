"use client";

import React, { createContext, useEffect, useCallback, useMemo, useRef, ReactNode, useContext, useReducer } from 'react';
import { Grid, Slide } from '@/lib/types';
import { useToast } from './ToastContext';
export type ModalType = 'account' | 'comments' | 'info' | 'topbar' | null;

// --- State and Reducer ---

type Columns = { [key: number]: Slide[] };

interface State {
  columns: Columns;
  activeColumnIndex: number;
  activeSlideY: number;
  activeSlideId: string | null;
  soundActiveSlideId: string | null;
  prefetchHint: { x: number, y: number } | null;
  loadingColumns: Set<number>;
  activeModal: ModalType;
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
  | { type: 'SET_ACTIVE_MODAL'; payload: ModalType }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'MERGE_SLIDE_DATA'; payload: Slide }
  | { type: 'OPTIMISTIC_TOGGLE_LIKE'; payload: { slideId: string, x: number } };

const initialState: State = {
  columns: {},
  activeColumnIndex: 0,
  activeSlideY: 0,
  activeSlideId: null,
  soundActiveSlideId: null,
  prefetchHint: null,
  loadingColumns: new Set(),
  activeModal: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GRID_DATA':
      return { ...state, columns: action.payload };
    case 'ADD_GRID_DATA':
      const combinedColumns = { ...state.columns };
      for (const x in action.payload) {
        if (combinedColumns[x]) {
          combinedColumns[x] = [...combinedColumns[x], ...action.payload[x]];
        } else {
          combinedColumns[x] = action.payload[x];
        }
      }
      return { ...state, columns: combinedColumns };
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
    case 'SET_ACTIVE_MODAL':
      return { ...state, activeModal: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'MERGE_SLIDE_DATA':
      const { id, x } = action.payload;
      const newColumnsState = { ...state.columns };
      if (newColumnsState[x]) {
        const slideIndex = newColumnsState[x].findIndex(slide => slide.id === id);
        if (slideIndex !== -1) {
          newColumnsState[x][slideIndex] = action.payload;
        }
      }
      return { ...state, columns: newColumnsState };
    case 'OPTIMISTIC_TOGGLE_LIKE':
      const { slideId, x: slideX } = action.payload;
      const optimisticColumns = { ...state.columns };
      if (optimisticColumns[slideX]) {
        const slideIndex = optimisticColumns[slideX].findIndex(s => s.id === slideId);
        if (slideIndex > -1) {
          const slide = optimisticColumns[slideX][slideIndex];
          const newIsLiked = !slide.isLiked;
          const newLikesCount = newIsLiked ? slide.initialLikes + 1 : slide.initialLikes - 1;

          optimisticColumns[slideX][slideIndex] = {
            ...slide,
            isLiked: newIsLiked,
            initialLikes: newLikesCount,
          };
        }
      }
      return { ...state, columns: optimisticColumns };
    default:
      return state;
  }
}

// --- Context ---

interface VideoGridContextType {
  state: State;
  isLoading: boolean;
  isAnyModalOpen: boolean;
  activeVideoRef: React.RefObject<HTMLVideoElement | null>;
  moveHorizontal: (direction: 'left' | 'right') => void;
  setActiveSlide: (x: number, y: number, id: string) => void;
  setSoundActiveSlide: (id: string | null) => void;
  setActiveVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  setPrefetchHint: (hint: { x: number; y: number } | null) => void;
  fetchFullSlide: (id: string) => Promise<void>;
  setActiveModal: (modal: ModalType) => void;
  openAccountPanel: () => void;
  toggleLike: (slideId: string, x: number) => Promise<void>;
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

  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) {
      addToast(state.error.message, 'error');
    }
  }, [state.error, addToast]);

  const isAnyModalOpen = state.activeModal !== null;
  const isLoading = state.loadingColumns.size > 0;

  const fetchColumn = useCallback(async (x: number, metadataOnly: boolean = false) => {
    const currentState = stateRef.current;
    if (currentState.columns[x] && (!metadataOnly || currentState.columns[x].every(s => !s.data))) {
      return;
    }
    dispatch({ type: 'START_LOADING_COLUMN', payload: x });
    try {
      const response = await fetch(`/api/slides?x=${x}&meta_only=${metadataOnly}`);
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
  }, []);

  const fetchFullSlide = useCallback(async (id: string) => {
      const slide = Object.values(state.columns).flat().find(s => s.id === id);
      if (slide && slide.data) {
          return;
      }
      try {
          const response = await fetch(`/api/slide/${id}`);
          if (!response.ok) throw new Error('Failed to fetch full slide data');
          const data = await response.json();
          if (data.slide) {
              dispatch({ type: 'MERGE_SLIDE_DATA', payload: data.slide });
          }
      } catch (err) {
          console.error(`Failed to fetch full data for slide ${id}:`, err);
          dispatch({ type: 'SET_ERROR', payload: err as Error });
      }
  }, [state.columns]);

  useEffect(() => {
    const x = state.activeColumnIndex;
    fetchColumn(x, false);
    fetchColumn(x + 1, true);
    if (x > 0) {
      fetchColumn(x - 1, true);
    }
  }, [state.activeColumnIndex, fetchColumn]);

  useEffect(() => {
    // Set initial slide ID when the first column loads
    if (!state.activeSlideId && state.columns[state.activeColumnIndex]?.length > 0) {
      const initialSlide = state.columns[state.activeColumnIndex].find(s => s.y === state.activeSlideY);
      if (initialSlide) {
        dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x: initialSlide.x, y: initialSlide.y, id: initialSlide.id } });
      }
    }
  }, [state.columns, state.activeColumnIndex, state.activeSlideY, state.activeSlideId]);

  const columnKeys = useMemo(() => Object.keys(state.columns).map(Number).sort((a, b) => a - b), [state.columns]);

  const setActiveSlide = useCallback((x: number, y: number, id: string) => {
    dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x, y, id } });
  }, []);

  const setSoundActiveSlide = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SOUND_ACTIVE_SLIDE', payload: id });
  }, []);

  const setActiveVideoRef = useCallback((ref: React.RefObject<HTMLVideoElement> | null) => {
    activeVideoRef.current = ref?.current ?? null;
  }, []);

  const setPrefetchHint = useCallback((hint: { x: number; y: number } | null) => {
    dispatch({ type: 'SET_PREFETCH_HINT', payload: hint });
  }, []);

  const moveHorizontal = useCallback((direction: 'left' | 'right') => {
    const currentKeyIndex = columnKeys.indexOf(state.activeColumnIndex);
    let nextKeyIndex;
    if (direction === 'left') {
      nextKeyIndex = Math.max(0, currentKeyIndex - 1);
    } else {
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

  const setActiveModal = useCallback((modal: ModalType) => {
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: modal });
  }, []);

  const openAccountPanel = useCallback(() => {
    setActiveModal('account');
  }, [setActiveModal]);

  const toggleLike = useCallback(async (slideId: string, x: number) => {
    dispatch({ type: 'OPTIMISTIC_TOGGLE_LIKE', payload: { slideId, x } });

    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      dispatch({ type: 'OPTIMISTIC_TOGGLE_LIKE', payload: { slideId, x } });
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    }
  }, []);

  const activeSlide = useMemo(() => {
    const column = state.columns[state.activeColumnIndex];
    if (!column) return undefined;
    return column.find(slide => slide.y === state.activeSlideY);
  }, [state.columns, state.activeColumnIndex, state.activeSlideY]);

  const value: VideoGridContextType = {
    state,
    isLoading,
    isAnyModalOpen,
    activeVideoRef,
    moveHorizontal,
    setActiveSlide,
    setSoundActiveSlide,
    setActiveVideoRef,
    setPrefetchHint,
    fetchFullSlide,
    setActiveModal,
    openAccountPanel,
    toggleLike,
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
