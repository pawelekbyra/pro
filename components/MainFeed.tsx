"use client";

import React, { useMemo, useEffect, useCallback } from 'react';
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
  const { activeVideo, setActiveVideo } = useStore(
    (state) => ({
      activeVideo: state.activeVideo,
      setActiveVideo: state.setActiveVideo,
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
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const slides = useMemo(() => {
    return data?.pages.flatMap(page => page.slides) ?? [];
  }, [data]);

  // We must provide VideoItems to the library, but they will be dummies.
  // The real video is played by GlobalVideoPlayer.
  // These items are just for scrolling and layout.
  const feedItems: VideoItem[] = useMemo(() => {
    return slides.map((slide) => ({
      id: slide.id,
      src: slide.data?.hlsUrl || slide.id, // Provide a src, even a dummy one.
      metadata: { slide },
      muted: true, // The dummy videos in the feed are always muted.
      playsInline: true,
      autoPlay: false, // We control playback globally.
    }));
  }, [slides]);

  const handleEndReached = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  const handleItemVisible = useCallback((item: VideoItem) => {
    const slide = item.metadata?.slide as SlideType | undefined;
    if (slide && slide.id !== activeVideo?.id) {
      setActiveVideo(slide);
    }
  }, [activeVideo, setActiveVideo]);

  useEffect(() => {
    if (!activeVideo && slides.length > 0) {
      setActiveVideo(slides[0]);
    }
  }, [slides, activeVideo, setActiveVideo]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div className="w-full h-screen relative">
      <VerticalFeed
        items={feedItems}
        onEndReached={handleEndReached}
        onItemVisible={handleItemVisible}
        className="h-full"
        // We only render the UI overlay. The video itself is global.
        // The library's video component will be in the background, muted and invisible.
        renderItemOverlay={(item) => {
          const slide = item.metadata?.slide as SlideType | undefined;
          if (!slide) return null;
          const isActive = slide.id === activeVideo?.id;
          return <Slide slide={slide} isActive={isActive} />;
        }}
        loadingComponent={<Skeleton className="w-full h-full" />}
      />
    </div>
  );
};

export default MainFeed;
