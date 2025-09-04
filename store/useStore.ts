import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  // Video player state
  isMuted: boolean;
  isPlaying: boolean;
  preloadedVideoUrl: string | null;
  videoElement: React.RefObject<HTMLVideoElement> | null;
  activeVideo: Slide | null;

  // Video player actions
  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;
  setPreloadedVideoUrl: (url: string | null) => void;
  setVideoElement: (ref: React.RefObject<HTMLVideoElement>) => void;
  setActiveVideo: (video: Slide | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isMuted: true,
  isPlaying: false,
  preloadedVideoUrl: null,
  videoElement: null,
  activeVideo: null,


  // --- ACTIONS ---
  setActiveModal: (modal) => set({ activeModal: modal }),
  setIsMuted: (isMuted) => set({ isMuted }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPreloadedVideoUrl: (url) => set({ preloadedVideoUrl: url }),
  setVideoElement: (ref) => set({ videoElement: ref }),
  setActiveVideo: (video) => set({ activeVideo: video }),

  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
