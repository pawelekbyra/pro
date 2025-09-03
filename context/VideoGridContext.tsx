"use client";

import React, { createContext, useEffect, useCallback, useMemo, useRef, ReactNode, useContext, useReducer } from 'react';
import { Grid, Slide, VideoSlide } from '@/lib/types';
import { useToast } from './ToastContext';
import { debounce } from '@/lib/utils';

export type ModalType = 'account' | 'comments' | 'info' | null;

// --- State and Reducer ---

type Columns = { [key: number]: Slide[] };

interface State {
  columns: Columns;
  columnKeys: number[];
  activeColumnIndex: number;
  activeSlideY: number;
  activeSlideId: string | null;
  soundActiveSlideId: string | null;
  activeVideoData: VideoSlide | null;
  isNavigating: boolean;
  isLoading: boolean;
  activeModal: ModalType;
  error: Error | null;
  areBarsVisible: boolean; // Added for UI visibility
}

type Action =
  | { type: 'SET_GRID_DATA'; payload: { columns: Columns; columnKeys: number[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_NAVIGATION'; payload: { newColumnIndex: number } }
  | { type: 'FINISH_NAVIGATION'; payload: { slide: Slide } }
  | { type: 'SET_ACTIVE_SLIDE'; payload: { x: number; y: number; id: string } }
  | { type: 'SET_SOUND_ACTIVE_SLIDE'; payload: string | null }
  | { type: 'SET_ACTIVE_MODAL'; payload: ModalType }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'MERGE_SLIDE_DATA'; payload: Slide }
  | { type: 'OPTIMISTIC_TOGGLE_LIKE'; payload: { slideId: string, x: number } }
  | { type: 'TOGGLE_BARS_VISIBLE' }; // Added for UI visibility

const initialState: State = {
  columns: {},
  columnKeys: [],
  activeColumnIndex: 0,
  activeSlideY: 0,
  activeSlideId: null,
  soundActiveSlideId: null,
  activeVideoData: null,
  isNavigating: true,
  isLoading: true,
  activeModal: null,
  error: null,
  areBarsVisible: true, // Added for UI visibility
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GRID_DATA': {
      const { columns, columnKeys } = action.payload;
      const firstSlide = columns[state.activeColumnIndex]?.[state.activeSlideY];
      const videoData = (firstSlide && firstSlide.type === 'video') ? (firstSlide as VideoSlide) : null;
      return {
        ...state,
        columns,
        columnKeys,
        isLoading: false,
        isNavigating: false,
        activeSlideId: firstSlide?.id || null,
        soundActiveSlideId: firstSlide?.id || null,
        activeVideoData: videoData,
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'START_NAVIGATION':
      return {
        ...state,
        isNavigating: true,
        activeColumnIndex: action.payload.newColumnIndex,
        activeSlideY: 0,
      };
    case 'FINISH_NAVIGATION': {
      const newSlide = action.payload.slide;
      const newActiveVideoData = newSlide?.type === 'video' ? (newSlide as VideoSlide) : null;
      return {
        ...state,
        isNavigating: false,
        activeSlideId: newSlide.id,
        activeSlideY: newSlide.y,
        soundActiveSlideId: newSlide.id,
        activeVideoData: newActiveVideoData,
        areBarsVisible: true, // Show bars on new slide
      };
    }
    case 'SET_ACTIVE_SLIDE': {
      if (state.isNavigating || state.activeSlideId === action.payload.id) {
        return state;
      }
      const newActiveSlide = state.columns[action.payload.x]?.find(s => s.id === action.payload.id);
      const newActiveVideoData = (newActiveSlide && newActiveSlide.type === 'video') ? (newActiveSlide as VideoSlide) : null;
      return {
        ...state,
        activeColumnIndex: action.payload.x,
        activeSlideY: action.payload.y,
        activeSlideId: action.payload.id,
        soundActiveSlideId: action.payload.id,
        activeVideoData: newActiveVideoData,
        areBarsVisible: true, // Show bars on new slide
      };
    }
    case 'SET_SOUND_ACTIVE_SLIDE':
        return { ...state, soundActiveSlideId: action.payload };
    case 'SET_ACTIVE_MODAL':
      return { ...state, activeModal: action.payload };
    case 'TOGGLE_BARS_VISIBLE':
        return { ...state, areBarsVisible: !state.areBarsVisible };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'MERGE_SLIDE_DATA': {
      const { id: mergedId, x: mergedX } = action.payload;
      const newColumnsState = { ...state.columns };
      if (newColumnsState[mergedX]) {
        const slideIndex = newColumnsState[mergedX].findIndex(slide => slide.id === mergedId);
        if (slideIndex !== -1) {
          newColumnsState[mergedX][slideIndex] = action.payload;
        }
      }
      if (state.activeSlideId === mergedId && action.payload.type === 'video') {
        return { ...state, columns: newColumnsState, activeVideoData: action.payload as VideoSlide };
      }
      return { ...state, columns: newColumnsState };
    }
    case 'OPTIMISTIC_TOGGLE_LIKE': {
      const { slideId, x: slideX } = action.payload;
      const optimisticColumns = { ...state.columns };
      if (optimisticColumns[slideX]) {
        const slideIndex = optimisticColumns[slideX].findIndex(s => s.id === slideId);
        if (slideIndex > -1) {
          const slide = optimisticColumns[slideX][slideIndex];
          const newIsLiked = !slide.isLiked;
          const newLikesCount = newIsLiked ? slide.initialLikes + 1 : slide.initialLikes - 1;
          optimisticColumns[slideX][slideIndex] = { ...slide, isLiked: newIsLiked, initialLikes: newLikesCount };
        }
      }
      return { ...state, columns: optimisticColumns };
    }
    default:
      return state;
  }
}

// --- Context ---

interface VideoGridContextType {
  state: State;
  isAnyModalOpen: boolean;
  activeVideoRef: React.RefObject<HTMLVideoElement | null>;
  handleNavigation: (direction: 'left' | 'right') => Promise<void>;
  setActiveSlide: (x: number, y: number, id: string) => void;
  setSoundActiveSlide: (id: string | null) => void;
  setActiveVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  setActiveModal: (modal: ModalType) => void;
  toggleLike: (slideId: string, x: number) => Promise<void>;
  loadMoreItems: (x: number) => Promise<void>;
  toggleBarsVisible: () => void; // Added
  activeSlide?: Slide;
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
  const pendingFetches = useRef(new Set<string>());
  const { addToast } = useToast();

  useEffect(() => { if (state.error) { addToast(state.error.message, 'error'); } }, [state.error, addToast]);

  const fetchGridData = useCallback(async () => {
    if (Object.keys(stateRef.current.columns).length > 0) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/slides');
      if (!response.ok) throw new Error('Failed to fetch initial grid');
      const data = await response.json();
      const grid: Grid = data.grid;

      const newColumns: Columns = {};
      for (const key in grid) {
        const slide = grid[key];
        if (!newColumns[slide.x]) newColumns[slide.x] = [];
        newColumns[slide.x].push(slide);
      }
      for (const col in newColumns) { newColumns[col].sort((a, b) => a.y - b.y); }
      const columnKeys = Object.keys(newColumns).map(Number).sort((a, b) => a - b);
      dispatch({ type: 'SET_GRID_DATA', payload: { columns: newColumns, columnKeys } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    }
  }, []);

  useEffect(() => { fetchGridData(); }, [fetchGridData]);

  const fetchFullSlide = useCallback(async (id: string): Promise<Slide | undefined> => {
    const currentState = stateRef.current;
    const slide = Object.values(currentState.columns).flat().find(s => s.id === id);
    if ((slide && slide.data) || pendingFetches.current.has(id)) return slide;
    pendingFetches.current.add(id);
    try {
      const response = await fetch(`/api/slide/${id}`);
      if (!response.ok) throw new Error('Failed to fetch full slide data');
      const data = await response.json();
      if (data.slide) {
        dispatch({ type: 'MERGE_SLIDE_DATA', payload: data.slide });
        return data.slide;
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    } finally {
      pendingFetches.current.delete(id);
    }
    return undefined;
  }, []);

  const activeSlide = useMemo(() => {
    const column = state.columns[state.activeColumnIndex];
    if (!column) return undefined;
    return column.find(slide => slide.y === state.activeSlideY);
  }, [state.columns, state.activeColumnIndex, state.activeSlideY]);


  useEffect(() => { if (activeSlide && !activeSlide.data) { fetchFullSlide(activeSlide.id); } }, [activeSlide, fetchFullSlide]);

  const setActiveSlide = useCallback(debounce((x: number, y: number, id: string) => {
      dispatch({ type: 'SET_ACTIVE_SLIDE', payload: { x, y, id } });
    }, 150), []);

  const setSoundActiveSlide = useCallback((id: string | null) => { dispatch({ type: 'SET_SOUND_ACTIVE_SLIDE', payload: id }); }, []);
  const toggleBarsVisible = useCallback(() => { dispatch({ type: 'TOGGLE_BARS_VISIBLE' }); }, []);

  const handleNavigation = useCallback(async (direction: 'left' | 'right') => {
    const { isNavigating, activeColumnIndex, columnKeys } = stateRef.current;
    if (isNavigating) return;
    const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);
    const nextKeyIndex = direction === 'right' ? currentKeyIndex + 1 : currentKeyIndex - 1;
    if (nextKeyIndex < 0 || nextKeyIndex >= columnKeys.length) return;
    const newColumnIndex = columnKeys[nextKeyIndex];
    dispatch({ type: 'START_NAVIGATION', payload: { newColumnIndex } });
    const targetSlide = stateRef.current.columns[newColumnIndex]?.[0];
    if (!targetSlide) {
      dispatch({ type: 'SET_ERROR', payload: new Error("New column has no slides.") });
      return;
    }
    try {
      const fullSlide = await fetchFullSlide(targetSlide.id);
      if (fullSlide) {
        dispatch({ type: 'FINISH_NAVIGATION', payload: { slide: fullSlide } });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    }
  }, [fetchFullSlide]);

  const loadMoreItems = useCallback(async (x: number) => {
      await fetchGridData();
  }, [fetchGridData]);

  const toggleLike = useCallback(async (slideId: string, x: number) => {
    dispatch({ type: 'OPTIMISTIC_TOGGLE_LIKE', payload: { slideId, x } });
    try {
      const response = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideId }) });
      if (!response.ok) throw new Error('Failed to update like status');
    } catch (error) {
      dispatch({ type: 'OPTIMISTIC_TOGGLE_LIKE', payload: { slideId, x } });
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    }
  }, []);

  const setActiveModal = useCallback((modal: ModalType) => { dispatch({ type: 'SET_ACTIVE_MODAL', payload: modal }); }, []);
  const setActiveVideoRef = useCallback((ref: React.RefObject<HTMLVideoElement> | null) => { activeVideoRef.current = ref?.current ?? null; }, []);

  const value: VideoGridContextType = {
    state,
    isAnyModalOpen: state.activeModal !== null,
    activeVideoRef,
    handleNavigation,
    setActiveSlide,
    setSoundActiveSlide,
    setActiveVideoRef,
    setActiveModal,
    toggleLike,
    loadMoreItems,
    toggleBarsVisible,
    activeSlide,
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
