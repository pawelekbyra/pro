"use client";

import React, { createContext, useEffect, useCallback, useMemo, useRef, ReactNode, useContext, useReducer } from 'react';
import { Grid, Slide, VideoSlide } from '@/lib/types';
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
  activeVideoData: VideoSlide | null; // Data for the global video player
  isNavigating: boolean;
  loadingColumns: Set<number>;
  activeModal: ModalType;
  error: Error | null;
}

type Action =
  | { type: 'SET_GRID_DATA'; payload: Columns }
  | { type: 'ADD_GRID_DATA'; payload: Columns }
  | { type: 'UPDATE_ACTIVE_SLIDE'; payload: { x: number; y: number; id: string; slide?: Slide } }
  | { type: 'SET_SOUND_ACTIVE_SLIDE'; payload: string | null }
  | { type: 'START_NAVIGATION' }
  | { type: 'FINISH_NAVIGATION' }
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
  activeVideoData: null,
  isNavigating: true, // Start as true to prevent actions until initial load is done
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
      if (state.activeSlideId === action.payload.id) {
        return { ...state, isNavigating: false };
      }

      const { x, y, id, slide } = action.payload;
      const targetSlide = slide ?? state.columns[x]?.find(s => s.id === id);

      const newActiveVideoData = (targetSlide && targetSlide.type === 'video') ? (targetSlide as VideoSlide) : null;

      return {
        ...state,
        activeColumnIndex: x,
        activeSlideY: y,
        activeSlideId: id,
        soundActiveSlideId: id,
        activeVideoData: newActiveVideoData,
        isNavigating: false,
      };
    case 'SET_SOUND_ACTIVE_SLIDE':
      return { ...state, soundActiveSlideId: action.payload };
    case 'START_NAVIGATION':
      return { ...state, isNavigating: true };
    case 'FINISH_NAVIGATION':
      return { ...state, isNavigating: false };
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
      const { id: mergedId, x: mergedX } = action.payload;
      const newColumnsState = { ...state.columns };
      if (newColumnsState[mergedX]) {
        const slideIndex = newColumnsState[mergedX].findIndex(slide => slide.id === mergedId);
        if (slideIndex !== -1) {
          newColumnsState[mergedX][slideIndex] = action.payload;
        }
      }
      // If the merged slide is the active slide, update the activeVideoData
      if (state.activeSlideId === mergedId && action.payload.type === 'video') {
        return { ...state, columns: newColumnsState, activeVideoData: action.payload as VideoSlide };
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
  handleNavigation: (direction: 'left' | 'right') => Promise<void>;
  setActiveSlide: (x: number, y: number, id: string) => void;
  setSoundActiveSlide: (id: string | null) => void;
  setActiveVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  fetchFullSlide: (id: string) => Promise<Slide | undefined>;
  setActiveModal: (modal: ModalType) => void;
  openAccountPanel: () => void;
  toggleLike: (slideId: string, x: number) => Promise<void>;
  loadMoreItems: (x: number) => Promise<void>;
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
  const pendingFetches = useRef(new Set<string>());

  const { addToast } = useToast();

  useEffect(() => {
    if (state.error) {
      addToast(state.error.message, 'error');
    }
  }, [state.error, addToast]);

  const isAnyModalOpen = state.activeModal !== null;
  const isLoading = state.loadingColumns.size > 0;

  const fetchColumn = useCallback(async (x: number, metadataOnly: boolean = false) => {
    // Do not fetch if column data already exists and we are not forcing a full data fetch.
    if (stateRef.current.columns[x] && (metadataOnly || stateRef.current.columns[x][0]?.data)) {
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

  const loadMoreItems = useCallback(async (x: number) => {
      // This function is called by the infinite loader.
      // In our case, it means the user has scrolled to the end of a column.
      // We can use this to pre-warm the *next* column with full data.
      const nextColumnIndex = x + 1;
      // We can also pre-warm the previous one if needed
      const prevColumnIndex = x - 1;

      fetchColumn(nextColumnIndex, false);
      if (prevColumnIndex >= 0) {
          fetchColumn(prevColumnIndex, false);
      }
  }, [fetchColumn]);

  const fetchFullSlide = useCallback(async (id: string): Promise<Slide | undefined> => {
    const slide = Object.values(stateRef.current.columns).flat().find(s => s.id === id);
    if ((slide && slide.data) || pendingFetches.current.has(id)) {
        return slide;
    }

    try {
        pendingFetches.current.add(id);
        const response = await fetch(`/api/slide/${id}`);
        if (!response.ok) throw new Error('Failed to fetch full slide data');
        const data = await response.json();
        if (data.slide) {
            dispatch({ type: 'MERGE_SLIDE_DATA', payload: data.slide });
            return data.slide;
        }
    } catch (err) {
        console.error(`Failed to fetch full data for slide ${id}:`, err);
        dispatch({ type: 'SET_ERROR', payload: err as Error });
    } finally {
        pendingFetches.current.delete(id);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const x = state.activeColumnIndex;
    // Fetch current column and pre-warm adjacent columns
    fetchColumn(x, false);
    fetchColumn(x + 1, true);
    if (x > 0) {
      fetchColumn(x - 1, true);
    }
  }, [state.activeColumnIndex, fetchColumn]);

  useEffect(() => {
    // Set initial slide ID when the first column loads
    if (state.isNavigating && !state.activeSlideId && state.columns[state.activeColumnIndex]?.length > 0) {
      const initialSlide = state.columns[state.activeColumnIndex].find(s => s.y === state.activeSlideY);
      if (initialSlide) {
        // On initial load, fetch the full data for the first slide, then set it as active.
        fetchFullSlide(initialSlide.id).then((fullSlide) => {
          if (fullSlide) {
            dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x: fullSlide.x, y: fullSlide.y, id: fullSlide.id, slide: fullSlide } });
          }
        });
      }
    }
  }, [state.columns, state.activeColumnIndex, state.activeSlideY, state.activeSlideId, fetchFullSlide, state.isNavigating]);

  const columnKeys = useMemo(() => Object.keys(state.columns).map(Number).sort((a, b) => a - b), [state.columns]);

  const setActiveSlide = useCallback((x: number, y: number, id: string) => {
    const column = stateRef.current.columns[x];
    const slide = column?.find(s => s.id === id);
    dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x, y, id, slide } });
  }, []);

  const setSoundActiveSlide = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SOUND_ACTIVE_SLIDE', payload: id });
  }, []);

  const setActiveVideoRef = useCallback((ref: React.RefObject<HTMLVideoElement> | null) => {
    activeVideoRef.current = ref?.current ?? null;
  }, []);

  const handleNavigation = useCallback(async (direction: 'left' | 'right') => {
    const currentState = stateRef.current;
    if (currentState.isNavigating) return;

    dispatch({ type: 'START_NAVIGATION' });

    let targetSlide: Slide | undefined;
    const { activeColumnIndex, columns } = currentState;

    const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);
    const nextKeyIndex = direction === 'right' ? currentKeyIndex + 1 : currentKeyIndex - 1;

    if (nextKeyIndex >= 0 && nextKeyIndex < columnKeys.length) {
      const newColumnIndex = columnKeys[nextKeyIndex];
      // When moving to a new column, always target the first slide (y=0 or the first in the sorted array)
      targetSlide = columns[newColumnIndex]?.[0];
    }

    if (!targetSlide) {
      dispatch({ type: 'FINISH_NAVIGATION' });
      return;
    }

    try {
      // Ensure the target slide's full data is loaded before navigating
      const fullSlide = await fetchFullSlide(targetSlide.id);
      if (fullSlide) {
        dispatch({ type: 'UPDATE_ACTIVE_SLIDE', payload: { x: fullSlide.x, y: fullSlide.y, id: fullSlide.id, slide: fullSlide } });
      } else {
        dispatch({ type: 'FINISH_NAVIGATION' });
      }
    } catch (err) {
      console.error("Navigation failed:", err);
      dispatch({ type: 'SET_ERROR', payload: err as Error });
      dispatch({ type: 'FINISH_NAVIGATION' });
    }
  }, [fetchFullSlide, columnKeys]);

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
    handleNavigation,
    setActiveSlide,
    setSoundActiveSlide,
    setActiveVideoRef,
    fetchFullSlide,
    setActiveModal,
    openAccountPanel,
    toggleLike,
    loadMoreItems,
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
