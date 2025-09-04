import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | 'login' | null;

interface LikeState {
    likes: number;
    isLiked: boolean;
}

interface AppState {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  // User state
  isLoggedIn: boolean;

  // Slide state
  activeSlide: Slide | null;
  setActiveSlide: (slide: Slide | null) => void;
  likeChanges: Record<string, LikeState>;
  toggleLike: (slideId: string, initialLikes: number, initialIsLiked: boolean) => void;

  // Global video player state
  isMuted: boolean;
  isPlaying: boolean;
  userPlaybackIntent: 'play' | 'pause' | null;
  currentTime: number;
  duration: number;

  // Video player actions
  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isLoggedIn: false, // Assume user is not logged in initially
  activeSlide: null,
  likeChanges: {},

  // Video Player
  isMuted: true,
  isPlaying: false,
  userPlaybackIntent: null,
  currentTime: 0,
  duration: 0,


  // --- ACTIONS ---
  setActiveModal: (modal) => set({ activeModal: modal }),
  setActiveSlide: (slide) => set({ activeSlide: slide }),

  toggleLike: (slideId, initialLikes, initialIsLiked) => set((state) => {
    const currentChanges = state.likeChanges[slideId];
    const isCurrentlyLiked = currentChanges ? currentChanges.isLiked : initialIsLiked;
    const currentLikes = currentChanges ? currentChanges.likes : initialLikes;

    const newIsLiked = !isCurrentlyLiked;
    const newLikes = newIsLiked ? currentLikes + 1 : currentLikes - 1;

    return {
        likeChanges: {
            ...state.likeChanges,
            [slideId]: { likes: newLikes, isLiked: newIsLiked },
        },
    };
  }),

  // Video Player
  setIsMuted: (isMuted) => set({ isMuted }),
  togglePlay: () => set((state) => {
    const newIsPlaying = !state.isPlaying;
    return {
      isPlaying: newIsPlaying,
      userPlaybackIntent: newIsPlaying ? 'play' : 'pause',
    };
  }),
  playVideo: () => set({ isPlaying: true }),
  pauseVideo: () => set({ isPlaying: false }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  seek: (time) => set({ currentTime: time }), // This is a simplified seek


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
