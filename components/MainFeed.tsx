"use client";

import React, { useMemo, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VerticalFeed, VideoItem } from 'react-vertical-feed';
import { useStore } from '@/store/useStore';
import type { Slide as SlideType } from '@/lib/types';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { shallow } from 'zustand/shallow';

const fetchSlides = async ({ pageParam = '' }) => {
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=5`);
  if (!res.ok) {
    throw new Error('Failed to fetch slides');
  }
  const data = await res.json();
  return data;
};

const MainFeed = () => {
  const {
    activeVideo,
    setActiveVideo,
    isPreloading,
    preloadedSlide,
    isMuted,
    setIsFirstVideoReady
  } = useStore(
    (state) => ({
      activeVideo: state.activeVideo,
      setActiveVideo: state.setActiveVideo,
      isPreloading: state.isPreloading,
      preloadedSlide: state.preloadedSlide,
      isMuted: state.isMuted,
      setIsFirstVideoReady: state.setIsFirstVideoReady,
    }),
    shallow
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['slides'],
    queryFn: fetchSlides,
    initialPageParam: preloadedSlide ? preloadedSlide.createdAt.toString() : '', // Użyj kursora z preładowanego slajdu
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !isPreloading, // Włącz query dopiero po zakończeniu preloadingu
  });

  // Dodaj preładowany slajd na początek listy
  const slides = useMemo(() => {
      const allSlides = data?.pages.flatMap(page => page.slides) ?? [];
      if (preloadedSlide && !allSlides.some(s => s.id === preloadedSlide.id)) {
          return [preloadedSlide, ...allSlides];
      }
      return allSlides;
  }, [data, preloadedSlide]);

  const videoItems: VideoItem[] = useMemo(() => {
    return slides
      .filter(
        (slide): slide is SlideType & { type: 'video'; data: { hlsUrl: string } } =>
          slide.type === 'video' && typeof slide.data?.hlsUrl === 'string'
      )
      .map((slide) => ({
        id: slide.id,
        src: slide.data.hlsUrl,
        metadata: { slide },
        autoPlay: true,
      muted: isMuted,
      playsInline: true,
      controls: false,
    }));
  }, [slides, isMuted]);

  const handleEndReached = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  const handleItemVisible = (item: VideoItem) => {
    const slide = item.metadata?.slide as SlideType | undefined;
    if (slide && slide.id !== activeVideo?.id) {
      setActiveVideo(slide);
    }
  };

  // NOWA POPRAWKA: Automatycznie wywołaj handleItemVisible dla pierwszego elementu
  useEffect(() => {
    if (!activeVideo && videoItems.length > 0) {
      handleItemVisible(videoItems[0]);
    }
  }, [videoItems, activeVideo, handleItemVisible]);

  const renderSlideOverlay = (item: VideoItem) => {
    const slide = item.metadata?.slide as SlideType | undefined;
    if (!slide) return null;

    const isActive = slide.id === activeVideo?.id;
    return <Slide slide={slide} isActive={isActive} />;
  };

  if (isPreloading || isLoading) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div className="w-full h-screen">
      <VerticalFeed
        items={videoItems}
        onEndReached={handleEndReached}
        onItemVisible={handleItemVisible}
        className="h-full"
        renderItemOverlay={renderSlideOverlay}
        loadingComponent={<Skeleton className="w-full h-full" />}
      />
    </div>
  );
};

export default MainFeed;
