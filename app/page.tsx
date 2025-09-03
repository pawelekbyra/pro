"use client";

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, useAnimate } from 'framer-motion';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import type { Slide as SlideType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Slide from '@/components/Slide';
import { shallow } from 'zustand/shallow';

// --- React Query Client ---
const queryClient = new QueryClient();

// --- Custom Hooks ---
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

// --- API Fetching Functions ---
const fetchColumns = async (): Promise<number[]> => {
  const res = await fetch('/api/slides/grid/columns');
  if (!res.ok) throw new Error('Failed to fetch columns');
  return res.json();
};

const fetchSlidesForColumn = async ({ pageParam = 0, queryKey }: any) => {
  const [, columnIndex] = queryKey;
  const res = await fetch(`/api/slides/grid/${columnIndex}?cursor=${pageParam}`);
  if (!res.ok) throw new Error(`Failed to fetch slides for column ${columnIndex}`);
  const data = await res.json();
  return data; // Expected to be { slides: SlideType[], nextCursor: number | null }
};

// --- Column Component ---
const Column = memo(({ columnIndex, width, height }: { columnIndex: number, width: number, height: number }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['slides', columnIndex],
    queryFn: fetchSlidesForColumn,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { setActiveSlide, activeSlide, activeColumnIndex, activeSlideIndex } = useStore(
    (state) => ({
        setActiveSlide: state.setActiveSlide,
        activeSlide: state.activeSlide,
        activeColumnIndex: state.activeColumnIndex,
        activeSlideIndex: state.activeSlideIndex,
    }),
    shallow
  );

  const slides = useMemo(() => data?.pages.flatMap((page) => page.slides) ?? [], [data]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    const newSlideIndex = Math.round(scrollTop / height);
    const newSlide = slides[newSlideIndex];

    // Only update if the slide is different from the currently active one.
    if (newSlide && newSlide.id !== activeSlide?.id) {
      setActiveSlide(newSlide, columnIndex, newSlideIndex);
    }
  }, [height, slides, columnIndex, setActiveSlide, activeSlide]);

  const loadMoreItems = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastSlideRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        loadMoreItems();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isLoading, hasNextPage, loadMoreItems]);


  if (isLoading) {
    return <div style={{ width, height, flexShrink: 0 }} className="flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }
  if (isError) {
    return <div style={{ width, height, flexShrink: 0 }} className="flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div
      style={{ width, height, flexShrink: 0 }}
      className="scroll-snap-y-mandatory overflow-y-auto"
      onScroll={handleScroll}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeSlideIndex && columnIndex === activeColumnIndex;
        const isLastSlide = index === slides.length - 1;
        return (
          <div
            key={slide.id}
            ref={isLastSlide ? lastSlideRef : null}
            style={{ height, width }}
            className="scroll-snap-align-start"
          >
            <Slide slide={slide} isActive={isActive} />
          </div>
        );
      })}
      {hasNextPage && (
        <div style={{ height, width }} className="flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}
    </div>
  );
});
Column.displayName = 'Column';

// --- Main Grid Component ---
function GridView() {
  const { width, height } = useWindowSize();
  const [scope, animate] = useAnimate();

  const { columns, activeColumnIndex, setColumns, setActiveSlide } = useStore(
    (state) => ({
      columns: state.columns,
      activeColumnIndex: state.activeColumnIndex,
      setColumns: state.setColumns,
      setActiveSlide: state.setActiveSlide,
    }),
    shallow
  );

  const { data: columnsData, isLoading: isLoadingColumns, isError: isErrorColumns } = useQuery({
    queryKey: ['columns'],
    queryFn: fetchColumns,
  });

  // Handle side-effects from the query in useEffect, per react-query v5 best practices
  useEffect(() => {
    if (columnsData) {
      setColumns(columnsData);
      if (columnsData.length > 0) {
        setActiveSlide(null, 0, 0);
      }
    }
  }, [columnsData, setColumns, setActiveSlide]);

  const onDragEnd = async (event: any, info: any) => {
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    let newColumnIndex = activeColumnIndex;

    // Softer animation trigger logic
    if (Math.abs(velocity) > 200 || Math.abs(offset) > width * 0.4) {
        newColumnIndex = velocity < 0
            ? Math.min(activeColumnIndex + 1, columns.length - 1)
            : Math.max(activeColumnIndex - 1, 0);
    }

    if (newColumnIndex !== activeColumnIndex) {
        // Set the new active column *before* animating for a more responsive feel
        setActiveSlide(null, newColumnIndex, 0);
        await animate(scope.current, { x: -newColumnIndex * width }, { type: 'spring', stiffness: 250, damping: 25 });
    } else {
        // Snap back to the current column if not dragged far enough
        await animate(scope.current, { x: -activeColumnIndex * width }, { type: 'spring', stiffness: 400, damping: 35 });
    }
};

  if (isLoadingColumns || !width || !height) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }
  if (isErrorColumns) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading configuration.</div>;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <motion.div
        ref={scope}
        className="flex h-full"
        drag="x"
        dragConstraints={{ right: 0, left: -(columns.length - 1) * width }}
        onDragEnd={onDragEnd}
        style={{ x: -activeColumnIndex * width }}
      >
        {columns.map((colIndex) => (
          <Column key={colIndex} columnIndex={colIndex} width={width} height={height} />
        ))}
      </motion.div>
    </div>
  );
}

// --- Main Page Export ---
export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <GridView />
    </QueryClientProvider>
  );
}