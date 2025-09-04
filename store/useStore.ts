import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  // Slide state
  activeSlide: Slide | null;
  setActiveSlide: (slide: Slide | null) => void;

  // Global video player state
  isMuted: boolean;
  isPlaying: boolean;
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
  activeSlide: null,

  // Video Player
  isMuted: true,
  isPlaying: false,
  currentTime: 0,
  duration: 0,


  // --- ACTIONS ---
  setActiveModal: (modal) => set({ activeModal: modal }),
  setActiveSlide: (slide) => set({ activeSlide: slide }),

  // Video Player
  setIsMuted: (isMuted) => set({ isMuted }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  playVideo: () => set({ isPlaying: true }),
  pauseVideo: () => set({ isPlaying: false }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  seek: (time) => set({ currentTime: time }), // This is a simplified seek


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
