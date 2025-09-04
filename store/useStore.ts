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
  currentHlsUrl: string | null;
  nextHlsUrl: string | null;
  isVideoLoaded: boolean;
  currentTime: number;
  duration: number;

  // Video player actions
  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;
  setCurrentHlsUrl: (url: string | null) => void;
  setNextHlsUrl: (url: string | null) => void;
  setIsVideoLoaded: (isLoaded: boolean) => void;
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
  currentHlsUrl: null,
  nextHlsUrl: null,
  isVideoLoaded: false,
  currentTime: 0,
  duration: 0,


  // --- ACTIONS ---
  setActiveModal: (modal) => set({ activeModal: modal }),
  setActiveSlide: (slide) => set({ activeSlide: slide }),

  // Video Player
  setIsMuted: (isMuted) => set({ isMuted }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentHlsUrl: (url) => set({ currentHlsUrl: url, currentTime: 0, duration: 0 }), // Reset times on new video
  setNextHlsUrl: (url) => set({ nextHlsUrl: url }),
  setIsVideoLoaded: (isLoaded) => set({ isVideoLoaded: isLoaded }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  seek: (time) => set({ currentTime: time }), // This is a simplified seek


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
