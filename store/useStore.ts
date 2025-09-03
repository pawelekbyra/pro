import { create } from 'zustand';
import { Slide } from '@/lib/types';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface AppState {
  activeModal: ModalType;
  activeVideo: Slide | null;
  isMuted: boolean;
  isPlaying: boolean;

  // Actions
  setActiveVideo: (video: Slide | null) => void;
  setActiveModal: (modal: ModalType) => void;
  setIsMuted: (isMuted: boolean) => void;
  togglePlay: () => void;

  // Computed properties (selectors)
  isAnyModalOpen: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  activeVideo: null,
  isMuted: true,
  isPlaying: false,

  // --- ACTIONS ---
  setActiveVideo: (video) => set({ activeVideo: video, isPlaying: true }), // Automatically play new videos

  setActiveModal: (modal) => set({ activeModal: modal }),

  setIsMuted: (isMuted) => set({ isMuted: isMuted }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
