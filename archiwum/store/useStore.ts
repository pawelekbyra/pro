import { create } from 'zustand';
import { Slide } from '@/lib/types';
import React from 'react';

export type ModalType = 'account' | 'comments' | 'info' | 'login' | null;

interface LikeState {
    likes: number;
    isLiked: boolean;
}

interface AppState {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  isAnyModalOpen: () => boolean;

  // User state
  isLoggedIn: boolean;

  // Slide state
  activeSlide: Slide | null;
  setActiveSlide: (slide: Slide | null) => void;
  likeChanges: Record<string, LikeState>;
  toggleLike: (slideId: string, initialLikes: number, initialIsLiked: boolean) => void;

}

export const useStore = create<AppState>((set, get) => ({
  // --- STATE ---
  activeModal: null,
  isLoggedIn: false, // Assume user is not logged in initially
  activeSlide: null,
  likeChanges: {},

  // --- ACTIONS ---
  setActiveModal: (modal) => set({ activeModal: modal }),
  setActiveSlide: (slide) => set({ activeSlide: slide }),

  toggleLike: (slideId, initialLikes, initialIsLiked) => set((state) => {
    const currentChanges = state.likeChanges[slideId];
    const isCurrentlyLiked = currentChanges ? currentChanges.isLiked : initialIsLiked;
    const currentLikes = currentChanges ? currentChanges.likes : initialLikes;

    const newIsLiked = !isCurrentlyLiked;
    const newLikes = newIsLiked ? currentLikes + 1 : currentLikes - 1;

    return {
        likeChanges: {
            ...state.likeChanges,
            [slideId]: { likes: newLikes, isLiked: newIsLiked },
        },
    };
  }),

  // --- COMPUTED / SELECTORS ---
  isAnyModalOpen: () => get().activeModal !== null,
}));
