import { create } from 'zustand';
import { Slide } from '@/lib/types';
import { shallow } from 'zustand/shallow';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  isLoading: boolean;
  error: Error | null;
  activeVideo: Slide | null; // Renamed from activeSlide
  isPreloading: boolean; // Nowe: śledzi, czy preloader jest aktywny
  preloadedSlide: Slide | null; // Nowe: przechowuje wstępnie załadowany slajd

  // Actions
  setActiveVideo: (video: Slide | null) => void;
  setActiveModal: (modal: ModalType) => void;
  setPreloadedSlide: (slide: Slide | null) => void; // Nowe: akcja do ustawiania preładowanego slajdu

  // Computed properties (selectors)
  isAnyModalOpen: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isLoading: true,
  error: null,
  activeVideo: null,
  isPreloading: true, // Zaczynamy w trybie preloadingu
  preloadedSlide: null,

  // --- ACTIONS ---
  setActiveVideo: (video) => set({ activeVideo: video }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  setPreloadedSlide: (slide) => set({ preloadedSlide: slide, isPreloading: false }),


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
