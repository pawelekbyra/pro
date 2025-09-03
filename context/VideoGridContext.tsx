"use client";

import React, { createContext, useEffect, useCallback, useMemo, useRef, ReactNode, useContext, useReducer } from 'react';
import { Grid, Slide, VideoSlide } from '@/lib/types';
import { useToast } from './ToastContext';

export type ModalType = 'account' | 'comments' | 'info' | null;

// --- State and Reducer ---

type Columns = { [key: number]: Slide[] };

interface State {
  columns: Columns;
  columnKeys: number[];
  activeColumnIndex: number;
  activeSlideIndex: number;
  activeSlideData: Slide | null;
  isLoading: boolean;
  activeModal: ModalType;
  error: Error | null;
  areBarsVisible: boolean;
  videoCurrentTime: number;
  videoDuration: number;
}

type Action =
  | { type: 'SET_GRID_DATA'; payload: { columns: Columns; columnKeys: number[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_COLUMN'; payload: { columnIndex: number } }
  | { type: 'SET_ACTIVE_SLIDE'; payload: { slideIndex: number } }
  | { type: 'SET_VIDEO_PROGRESS'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_ACTIVE_MODAL'; payload: ModalType }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'MERGE_SLIDE_DATA'; payload: Slide }
  | { type: 'OPTIMISTIC_TOGGLE_LIKE'; payload: { slideId: string, x: number } }
  | { type: 'TOGGLE_BARS_VISIBLE' };

const initialState: State = {
  columns: {},
  columnKeys: [],
  activeColumnIndex: 0,
  activeSlideIndex: 0,
  activeSlideData: null,
  isLoading: true,
  activeModal: null,
  error: null,
  areBarsVisible: true,
  videoCurrentTime: 0,
  videoDuration: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GRID_DATA': {
      const { columns, columnKeys } = action.payload;
      const initialSlide = columns[state.activeColumnIndex]?.[state.activeSlideIndex] || null;
      return {
        ...state,
        columns,
        columnKeys,
        isLoading: false,
        activeSlideData: initialSlide,
        videoCurrentTime: 0,
        videoDuration: 0,
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ACTIVE_COLUMN': {
      const { columnIndex } = action.payload;
      if (columnIndex === state.activeColumnIndex) return state;
      const newSlideIndex = 0;
      const newSlideData = state.columns[columnIndex]?.[newSlideIndex] || null;
      return {
        ...state,
        activeColumnIndex: columnIndex,
        activeSlideIndex: newSlideIndex,
        activeSlideData: newSlideData,
        areBarsVisible: true,
        videoCurrentTime: 0,
        videoDuration: 0,
      };
    }
    case 'SET_ACTIVE_SLIDE': {
      const { slideIndex } = action.payload;
      if (slideIndex === state.activeSlideIndex) return state;
      const newSlideData = state.columns[state.activeColumnIndex]?.[slideIndex] || null;
      return {
        ...state,
        activeSlideIndex: slideIndex,
        activeSlideData: newSlideData,
        areBarsVisible: true,
        videoCurrentTime: 0,
        videoDuration: 0,
      };
    }
    case 'SET_VIDEO_PROGRESS':
      return {
        ...state,
        videoCurrentTime: action.payload.currentTime,
        videoDuration: action.payload.duration,
      };
    case 'SET_ACTIVE_MODAL':
      return { ...state, activeModal: action.payload };
    case 'TOGGLE_BARS_VISIBLE':
        return { ...state, areBarsVisible: !state.areBarsVisible };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'MERGE_SLIDE_DATA': {
      const mergedSlide = action.payload;
      const newColumnsState = { ...state.columns };
      if (newColumnsState[mergedSlide.x]) {
        const slideIndex = newColumnsState[mergedSlide.x].findIndex(slide => slide.id === mergedSlide.id);
        if (slideIndex !== -1) {
          newColumnsState[mergedSlide.x][slideIndex] = mergedSlide;
        }
      }
      return {
        ...state,
        columns: newColumnsState,
        activeSlideData: state.activeSlideData?.id === mergedSlide.id ? mergedSlide : state.activeSlideData,
      };
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
  setActiveColumn: (columnIndex: number) => void;
  setActiveSlide: (slideIndex: number) => void;
  setVideoProgress: (currentTime: number, duration: number) => void;
  seekVideo: (time: number) => void;
  setActiveVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  setActiveModal: (modal: ModalType) => void;
  toggleLike: (slideId: string, x: number) => Promise<void>;
  toggleBarsVisible: () => void;
}

const VideoGridContext = createContext<VideoGridContextType | undefined>(undefined);

export const VideoGridProvider = ({ children, initialCoordinates = { x: 0, y: 0 } }: { children: ReactNode, initialCoordinates?: { x: number; y: number } }) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    activeColumnIndex: initialCoordinates.x,
    activeSlideIndex: initialCoordinates.y,
  });

  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const { addToast } = useToast();
  const pendingFetches = useRef(new Set<string>());


  useEffect(() => { if (state.error) { addToast(state.error.message, 'error'); } }, [state.error, addToast]);

  const fetchGridData = useCallback(async () => {
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

  const fetchFullSlide = useCallback(async (slide: Slide) => {
    if (!slide || slide.data || pendingFetches.current.has(slide.id)) return;
    pendingFetches.current.add(slide.id);
    try {
      const response = await fetch(`/api/slide/${slide.id}`);
      if (!response.ok) throw new Error('Failed to fetch full slide data');
      const data = await response.json();
      if (data.slide) {
        dispatch({ type: 'MERGE_SLIDE_DATA', payload: data.slide });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    } finally {
      pendingFetches.current.delete(slide.id);
    }
  }, []);

  useEffect(() => {
    if (state.activeSlideData) {
      fetchFullSlide(state.activeSlideData);
    }
  }, [state.activeSlideData, fetchFullSlide]);


  const setActiveColumn = useCallback((columnIndex: number) => {
    dispatch({ type: 'SET_ACTIVE_COLUMN', payload: { columnIndex } });
  }, []);

  const setActiveSlide = useCallback((slideIndex: number) => {
    dispatch({ type: 'SET_ACTIVE_SLIDE', payload: { slideIndex } });
  }, []);

  const setVideoProgress = useCallback((currentTime: number, duration: number) => {
    dispatch({ type: 'SET_VIDEO_PROGRESS', payload: { currentTime, duration } });
  }, []);

  const toggleBarsVisible = useCallback(() => { dispatch({ type: 'TOGGLE_BARS_VISIBLE' }); }, []);

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

  const seekVideo = useCallback((time: number) => {
    if (activeVideoRef.current) {
      activeVideoRef.current.currentTime = time;
    }
  }, []);

  const value: VideoGridContextType = {
    state,
    isAnyModalOpen: state.activeModal !== null,
    activeVideoRef,
    setActiveColumn,
    setActiveSlide,
    setVideoProgress,
    seekVideo,
    setActiveVideoRef,
    setActiveModal,
    toggleLike,
    toggleBarsVisible,
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
