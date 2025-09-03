"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
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
import { GlobalVideoPlayer } from '@/components/GlobalVideoPlayer';
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

  const setActiveSlide = useStore((state) => state.setActiveSlide);
  const { activeColumnIndex, activeSlideIndex } = useStore(
    (state) => ({
      activeColumnIndex: state.activeColumnIndex,
      activeSlideIndex: state.activeSlideIndex,
    }),
    shallow
  );

  const slides = data?.pages.flatMap((page) => page.slides) ?? [];
  const itemCount = hasNextPage ? slides.length + 1 : slides.length;
  const isItemLoaded = (index: number) => !hasNextPage || index < slides.length;

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    const newSlideIndex = Math.round(scrollOffset / height);
    const currentSlide = slides[newSlideIndex];
    if (currentSlide && newSlideIndex !== activeSlideIndex && columnIndex === activeColumnIndex) {
      setActiveSlide(currentSlide, columnIndex, newSlideIndex);
    }
  }, [height, slides, activeSlideIndex, columnIndex, activeColumnIndex, setActiveSlide]);

  if (isLoading) {
    return <div style={{ width, height, flexShrink: 0 }} className="flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }
  if (isError) {
    return <div style={{ width, height, flexShrink: 0 }} className="flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div style={{ width, height, flexShrink: 0 }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={fetchNextPage}
      >
        {({ onItemsRendered, ref }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={itemCount}
            itemSize={height}
            onItemsRendered={onItemsRendered}
            ref={ref}
            onScroll={handleScroll}
          >
            {({ index, style }) => {
              const slide = slides[index];
              const isActive = index === activeSlideIndex && columnIndex === activeColumnIndex;
              return (
                <div style={style} key={slide ? slide.id : `loader-${index}`}>
                  {slide ? <Slide slide={slide} isActive={isActive} /> : <Skeleton className="w-full h-full" />}
                </div>
              );
            }}
          </FixedSizeList>
        )}
      </InfiniteLoader>
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

  const { isLoading: isLoadingColumns, isError: isErrorColumns } = useQuery({
    queryKey: ['columns'],
    queryFn: fetchColumns,
    onSuccess: (data) => {
      setColumns(data);
      // Set initial active slide
      if (data.length > 0) {
        // We can't set active slide data here as we haven't fetched it yet.
        // We'll set a default active index, and the Column component will fetch the data.
        setActiveSlide(null, 0, 0);
      }
    },
  });

  const onDragEnd = async (event: any, info: any) => {
    const velocity = info.velocity.x;
    let newColumnIndex = activeColumnIndex;

    if (Math.abs(velocity) > 300) {
      newColumnIndex = velocity < 0 ? Math.min(activeColumnIndex + 1, columns.length - 1) : Math.max(activeColumnIndex - 1, 0);
    } else {
      const offset = info.offset.x;
      if (Math.abs(offset) > width / 2) {
        newColumnIndex = offset < 0 ? Math.min(activeColumnIndex + 1, columns.length - 1) : Math.max(activeColumnIndex - 1, 0);
      }
    }

    if (newColumnIndex !== activeColumnIndex) {
        await animate(scope.current, { x: -newColumnIndex * width }, { type: 'spring', stiffness: 300, damping: 30 });
        setActiveSlide(null, newColumnIndex, 0); // Reset slide index on column change, slide data will be fetched by Column
    } else {
        // Snap back to the current column if not dragged far enough
        await animate(scope.current, { x: -activeColumnIndex * width }, { type: 'spring', stiffness: 300, damping: 30 });
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
      <GlobalVideoPlayer />
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