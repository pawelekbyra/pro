import { create } from 'zustand';
import { Slide } from '@/lib/types';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  isLoading: boolean;
  error: Error | null;
  activeVideo: Slide | null; // Renamed from activeSlide

  // Actions
  setActiveVideo: (video: Slide | null) => void;
  setActiveModal: (modal: ModalType) => void;

  // Computed properties (selectors)
  isAnyModalOpen: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isLoading: true,
  error: null,
  activeVideo: null,

  // --- ACTIONS ---
  setActiveVideo: (video) => set({ activeVideo: video }),

  setActiveModal: (modal) => set({ activeModal: modal }),


  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
