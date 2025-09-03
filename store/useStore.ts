import { create } from 'zustand';
import { Slide } from '@/lib/types';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface GridState {
  columns: number[];
  activeColumnIndex: number;
  activeSlideIndex: number;
  activeModal: ModalType;
  isLoading: boolean;
  error: Error | null;

  // New state for the global video player
  activeSlide: Slide | null;
  videoElement: HTMLVideoElement | null;

  // Actions
  setColumns: (columns: number[]) => void;
  setActiveSlide: (slide: Slide | null, colIndex: number, slideIndex: number) => void;
  setActiveModal: (modal: ModalType) => void;
  setVideoElement: (element: HTMLVideoElement | null) => void;

  // Computed properties (selectors)
  isAnyModalOpen: () => boolean;
}

export const useStore = create<GridState>((set, get) => ({
  // --- STATE ---
  columns: [],
  activeColumnIndex: 0,
  activeSlideIndex: 0,
  activeModal: null,
  isLoading: true,
  error: null,
  activeSlide: null,
  videoElement: null,

  // --- ACTIONS ---
  setColumns: (columns) => set({ columns, isLoading: false }),

  setActiveSlide: (slide, colIndex, slideIndex) =>
    set((state) => {
      if (colIndex < 0 || colIndex >= state.columns.length) {
        return {};
      }
      return {
        activeSlide: slide,
        activeColumnIndex: colIndex,
        activeSlideIndex: slideIndex,
      };
    }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  setVideoElement: (element) => set({ videoElement: element }),


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
