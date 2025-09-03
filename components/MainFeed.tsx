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

  const slides = useMemo(() => data?.pages.flatMap(page => page.slides) ?? [], [data]);

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
      muted: true,
      playsInline: true,
      controls: false,
    }));
  }, [slides]);

  // --- START OF NEW FIX ---
  // Nowa logika do obsługi pierwszego slajdu
  useEffect(() => {
    if (slides.length > 0 && !activeVideo) {
      const firstVideoItem = videoItems.find(item => item.id === slides[0].id);
      if (firstVideoItem) {
        setActiveVideo(firstVideoItem.metadata?.slide);
      }
    }
  }, [slides, activeVideo, setActiveVideo, videoItems]);
  // --- END OF NEW FIX ---

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

  const renderSlideOverlay = (item: VideoItem) => {
    const slide = item.metadata?.slide as SlideType | undefined;
    if (!slide) return null;

    const isActive = slide.id === activeVideo?.id;
    return <Slide slide={slide} isActive={isActive} />;
  };

  if (isLoading) {
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
