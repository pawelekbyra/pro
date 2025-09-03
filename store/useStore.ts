import { create } from 'zustand';
import { Slide } from '@/lib/types';
import { shallow } from 'zustand/shallow';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  isLoading: boolean;
  error: Error | null;
  activeVideo: Slide | null;
  isPreloading: boolean;
  preloadedSlide: Slide | null;
  isFirstVideoReady: boolean;
  isMuted: boolean;

  // Actions
  setActiveVideo: (video: Slide | null) => void;
  setActiveModal: (modal: ModalType) => void;
  setPreloadedSlide: (slide: Slide | null) => void;
  setIsFirstVideoReady: (isReady: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;

  // Computed properties (selectors)
  isAnyModalOpen: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isLoading: true,
  error: null,
  activeVideo: null,
  isPreloading: true,
  preloadedSlide: null,
  isFirstVideoReady: false,
  isMuted: true,

  // --- ACTIONS ---
  setActiveVideo: (video) => set({ activeVideo: video }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  setPreloadedSlide: (slide) => set({ preloadedSlide: slide, isPreloading: false }),

  setIsFirstVideoReady: (isReady) => set({ isFirstVideoReady: isReady }),

  setIsMuted: (isMuted) => set({ isMuted: isMuted }),


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
