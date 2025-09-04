import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  activeVideo: Slide | null;
  isMuted: boolean;
  isPlaying: boolean;
  videoElement: React.RefObject<HTMLVideoElement> | null;
  preloadedVideoUrl: string | null;
  currentTime: number;
  duration: number;

  // Actions
  setActiveVideo: (video: Slide | null) => void;
  setActiveModal: (modal: ModalType) => void;
  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleMute: () => void;
  setVideoElement: (element: React.RefObject<HTMLVideoElement>) => void;
  setPreloadedVideoUrl: (url: string) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;

  // Computed properties (selectors)
  isAnyModalOpen: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  activeVideo: null,
  isMuted: false, // Start with sound on, per user request
  isPlaying: false,
  videoElement: null,
  preloadedVideoUrl: null,
  currentTime: 0,
  duration: 0,

  // --- ACTIONS ---
  // This should NOT automatically play. The player component will handle that.
  setActiveVideo: (video) => set({ activeVideo: video, currentTime: 0, duration: 0 }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  setIsMuted: (isMuted) => set({ isMuted: isMuted }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setVideoElement: (element) => set({ videoElement: element }),

  setPreloadedVideoUrl: (url) => set({ preloadedVideoUrl: url }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration: duration }),

  seek: (time) => {
    const { videoElement } = get();
    if (videoElement?.current) {
      videoElement.current.currentTime = time;
    }
  },

  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
