"use client";

import React, { createContext, useCallback, ReactNode, useContext, useReducer } from 'react';
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

// Uproszczony stan początkowy
const initialState: State = {
  activeSlideData: null,
  isLoading: false, // Nie ładujemy danych przy starcie
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
  setSlideData: (slide: Slide) => void; // Nowa funkcja do ustawiania slajdu
  toggleLike: () => Promise<void>;
}

const VideoGridContext = createContext<VideoGridContextType | undefined>(undefined);

export const VideoGridProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { addToast } = useToast();

  // Usunięto logikę pobierania danych (fetchSlideData i useEffect)

  const setSlideData = useCallback((slide: Slide) => {
    dispatch({ type: 'SET_SLIDE_DATA', payload: slide });
  }, []);

  const toggleLike = useCallback(async () => {
    if (!state.activeSlideData) return;
    dispatch({ type: 'TOGGLE_LIKE' });
    try {
      const response = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideId: state.activeSlideData.id }) });
      if (!response.ok) throw new Error('Failed to update like status');
    } catch (error) {
      dispatch({ type: 'TOGGLE_LIKE' }); // Revert optimistic update
      addToast((error as Error).message, 'error');
    }
  }, [state.activeSlideData, addToast]);

  const setActiveModal = useCallback((modal: ModalType) => { dispatch({ type: 'SET_ACTIVE_MODAL', payload: modal }); }, []);

  const value: VideoGridContextType = {
    state,
    isAnyModalOpen: state.activeModal !== null,
    setActiveModal,
    setSlideData,
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
