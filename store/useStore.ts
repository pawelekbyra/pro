import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  // Video player state
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
  preloadedVideoUrl: string | null;
  setPreloadedVideoUrl: (url: string | null) => void;
  videoElement: React.RefObject<HTMLVideoElement> | null;
  setVideoElement: (ref: React.RefObject<HTMLVideoElement>) => void;
  activeVideo: Slide | null;
  setActiveVideo: (video: Slide | null) => void;
  isPlaying: boolean;
  togglePlay: () => void;

  // Modal state
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  isMuted: true,
  preloadedVideoUrl: null,
  videoElement: null,
  activeVideo: null,
  isPlaying: false,
  activeModal: null,

  // --- ACTIONS ---
  setIsMuted: (isMuted) => set({ isMuted }),
  setPreloadedVideoUrl: (url) => set({ preloadedVideoUrl: url }),
  setVideoElement: (ref) => set({ videoElement: ref }),
  setActiveVideo: (video) => set({ activeVideo: video }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setActiveModal: (modal) => set({ activeModal: modal }),

  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
