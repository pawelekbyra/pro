"use client";

import React, { createContext, useEffect, useCallback, useRef, ReactNode, useContext, useReducer } from 'react';
import { Slide } from '@/lib/types';
import { useToast } from './ToastContext';

export type ModalType = 'account' | 'comments' | 'info' | null;

// --- State and Reducer ---

interface State {
  activeSlideData: Slide | null;
  isLoading: boolean;
  activeModal: ModalType;
  error: Error | null;
}

type Action =
  | { type: 'SET_SLIDE_DATA'; payload: Slide }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_MODAL'; payload: ModalType }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'TOGGLE_LIKE' };

const initialState: State = {
  activeSlideData: null,
  isLoading: true,
  activeModal: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SLIDE_DATA':
      return {
        ...state,
        activeSlideData: action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ACTIVE_MODAL':
      return { ...state, activeModal: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'TOGGLE_LIKE': {
      if (!state.activeSlideData) return state;
      const newIsLiked = !state.activeSlideData.isLiked;
      const newLikesCount = newIsLiked ? state.activeSlideData.initialLikes + 1 : state.activeSlideData.initialLikes - 1;
      return {
        ...state,
        activeSlideData: {
          ...state.activeSlideData,
          isLiked: newIsLiked,
          initialLikes: newLikesCount,
        },
      };
    }
    default:
      return state;
  }
}

// --- Context ---

interface VideoGridContextType {
  state: State;
  isAnyModalOpen: boolean;
  setActiveModal: (modal: ModalType) => void;
  toggleLike: () => Promise<void>;
}

const VideoGridContext = createContext<VideoGridContextType | undefined>(undefined);

export const VideoGridProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { addToast } = useToast();

  useEffect(() => { if (state.error) { addToast(state.error.message, 'error'); } }, [state.error, addToast]);

  const fetchSlideData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Fetch slide 0,0 directly
      const response = await fetch('/api/slides?x=0&y=0');
      if (!response.ok) throw new Error('Failed to fetch slide data');
      const data = await response.json();
      // Assuming the API returns the single slide object
      if (data.slide) {
        dispatch({ type: 'SET_SLIDE_DATA', payload: data.slide });
      } else {
        // Handle case where specific slide is not found in the response
        // For simplicity, let's try to find it in the grid if the structure is still array-like
        const grid = data.grid;
        const slide = grid ? Object.values(grid).find((s: any) => s.x === 0 && s.y === 0) : null;
        if(slide) {
          dispatch({ type: 'SET_SLIDE_DATA', payload: slide as Slide });
        } else {
          throw new Error('Slide 0,0 not found');
        }
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err as Error });
    }
  }, []);

  useEffect(() => {
    fetchSlideData();
  }, [fetchSlideData]);

  const toggleLike = useCallback(async () => {
    if (!state.activeSlideData) return;
    dispatch({ type: 'TOGGLE_LIKE' });
    try {
      const response = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideId: state.activeSlideData.id }) });
      if (!response.ok) throw new Error('Failed to update like status');
    } catch (error) {
      dispatch({ type: 'TOGGLE_LIKE' }); // Revert optimistic update
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    }
  }, [state.activeSlideData]);

  const setActiveModal = useCallback((modal: ModalType) => { dispatch({ type: 'SET_ACTIVE_MODAL', payload: modal }); }, []);

  const value: VideoGridContextType = {
    state,
    isAnyModalOpen: state.activeModal !== null,
    setActiveModal,
    toggleLike,
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
