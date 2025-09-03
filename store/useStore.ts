import { create } from 'zustand';
import { Slide } from '@/lib/types';

export type ModalType = 'account' | 'comments' | 'info' | null;

interface GridState {
  columns: Slide[][];
  activeColumnIndex: number;
  activeSlideIndex: number;
  activeModal: ModalType;
  isLoading: boolean;
  error: Error | null;

  // Actions
  setColumns: (columns: Slide[][]) => void;
  appendSlides: (columnIndex: number, slides: Slide[]) => void;
  setActiveIndices: (colIndex: number, slideIndex: number) => void;
  setActiveModal: (modal: ModalType) => void;
  toggleLike: (colIndex: number, slideIndex: number) => void;

  // Computed properties (selectors)
  getActiveSlide: () => Slide | null;
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

  // --- ACTIONS ---
  setColumns: (columns) => set({ columns, isLoading: false }),

  appendSlides: (columnIndex, slides) =>
    set((state) => {
      const newColumns = [...state.columns];
      if (newColumns[columnIndex]) {
        newColumns[columnIndex] = [...newColumns[columnIndex], ...slides];
      }
      return { columns: newColumns };
    }),

  setActiveIndices: (colIndex, slideIndex) =>
    set((state) => {
      // Basic bounds checking
      if (colIndex < 0 || colIndex >= state.columns.length) {
        return {};
      }
      if (slideIndex < 0 || slideIndex >= state.columns[colIndex].length) {
        return {};
      }
      return { activeColumnIndex: colIndex, activeSlideIndex: slideIndex };
    }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  toggleLike: (colIndex, slideIndex) =>
    set((state) => {
      const newColumns = [...state.columns];
      const slide = newColumns[colIndex]?.[slideIndex];

      if (!slide) return {};

      const updatedSlide = {
        ...slide,
        isLiked: !slide.isLiked,
        initialLikes: slide.isLiked ? slide.initialLikes - 1 : slide.initialLikes + 1,
      };

      newColumns[colIndex][slideIndex] = updatedSlide;
      return { columns: newColumns };
    }),

  // --- COMPUTED / SELECTORS ---
  getActiveSlide: () => {
    const { columns, activeColumnIndex, activeSlideIndex } = get();
    return columns[activeColumnIndex]?.[activeSlideIndex] || null;
  },

  isAnyModalOpen: () => get().activeModal !== null,
}));
