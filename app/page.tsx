"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useStore } from '@/store/useStore';
import type { Slide as SlideType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// --- Mock Data Generation ---
// In a real app, this would be replaced by API calls.
const generateMockSlides = (columnIndex: number, start: number, count: number): SlideType[] => {
  return Array.from({ length: count }, (_, i) => {
    const slideIndex = start + i;
    return {
      id: `${columnIndex}-${slideIndex}`,
      x: columnIndex,
      y: slideIndex,
      type: 'video',
      initialLikes: Math.floor(Math.random() * 1000),
      initialComments: Math.floor(Math.random() * 200),
      isLiked: Math.random() > 0.5,
      avatar: `/avatars/placeholder.png`,
      userId: `user_${columnIndex}`,
      username: `User ${columnIndex}`,
      access: 'public',
      createdAt: Date.now(),
      data: {
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        mp4Url: '',
        poster: `https://picsum.photos/seed/${columnIndex}-${slideIndex}/400/800`,
        title: `Slide ${slideIndex}`,
        description: `This is a mock slide at column ${columnIndex}, index ${slideIndex}.`,
      },
    };
  });
};

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

import Slide from '@/components/Slide';


// --- Main Component ---
export default function Home() {
  const { width, height } = useWindowSize();
  const [scope, animate] = useAnimate();
  const {
    columns,
    activeColumnIndex,
    activeSlideIndex,
    setColumns,
    appendSlides,
    setActiveIndices,
  } = useStore();

  const infiniteLoaderRefs = useRef<(InfiniteLoader | null)[]>([]);

  // 1. Initial data load (mock)
  useEffect(() => {
    const initialColumns = Array.from({ length: 5 }, (_, i) => generateMockSlides(i, 0, 10));
    setColumns(initialColumns);
  }, [setColumns]);

  // 2. Horizontal navigation (Framer Motion)
  const onDragEnd = async (event: any, info: any) => {
    const velocity = info.velocity.x;
    let newColumnIndex = activeColumnIndex;

    if (Math.abs(velocity) > 300) { // Threshold for a swipe
      if (velocity < 0 && activeColumnIndex < columns.length - 1) {
        newColumnIndex++;
      } else if (velocity > 0 && activeColumnIndex > 0) {
        newColumnIndex--;
      }
    } else { // Snap based on position
      const offset = info.offset.x;
      if (Math.abs(offset) > width / 2) {
        newColumnIndex = offset < 0 ? Math.min(activeColumnIndex + 1, columns.length - 1) : Math.max(activeColumnIndex - 1, 0);
      }
    }

    await animate(scope.current, { x: -newColumnIndex * width }, { type: 'spring', stiffness: 300, damping: 30 });
    setActiveIndices(newColumnIndex, activeSlideIndex);
  };

  // 3. Vertical navigation (React Window)
  const Column = React.memo(({ columnIndex }: { columnIndex: number }) => {
    const slideColumn = columns[columnIndex];

    // Hooks must be called unconditionally at the top level.
    const loadMoreItems = useCallback(() => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const { columns, appendSlides } = useStore.getState();
          const currentColumnLength = columns[columnIndex]?.length || 0;
          const newSlides = generateMockSlides(columnIndex, currentColumnLength, 10);
          appendSlides(columnIndex, newSlides);
          resolve();
        }, 500); // Simulate network latency
      });
    }, [columnIndex]);

    if (!slideColumn) return null; // Early return is now after the hook call.

    const isItemLoaded = (index: number) => !!slideColumn[index];
    const itemCount = slideColumn.length + 1; // +1 for loader

    return (
      <div style={{ width, height, flexShrink: 0 }}>
        <InfiniteLoader
          ref={(ref) => {
            infiniteLoaderRefs.current[columnIndex] = ref;
          }}
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={itemCount}
              itemSize={height}
              onItemsRendered={onItemsRendered}
              ref={ref}
              onScroll={({ scrollOffset }) => {
                const newSlideIndex = Math.round(scrollOffset / height);
                if (newSlideIndex !== activeSlideIndex && columnIndex === activeColumnIndex) {
                  setActiveIndices(columnIndex, newSlideIndex);
                }
              }}
            >
              {({ index, style }) => {
                const slide = slideColumn[index];
                const isActive = index === activeSlideIndex && columnIndex === activeColumnIndex;
                return (
                  <div style={style}>
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

  if (!width || !height || columns.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
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
        {columns.map((_, index) => (
          <Column key={index} columnIndex={index} />
        ))}
      </motion.div>
    </div>
  );
}