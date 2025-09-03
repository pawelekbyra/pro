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
  const {
    activeVideo,
    setActiveVideo,
    isPreloading,
    preloadedSlide,
    isMuted,
  } = useStore(
    (state) => ({
      activeVideo: state.activeVideo,
      setActiveVideo: state.setActiveVideo,
      isPreloading: state.isPreloading,
      preloadedSlide: state.preloadedSlide,
      isMuted: state.isMuted,
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
    initialPageParam: preloadedSlide ? preloadedSlide.id : '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !isPreloading,
  });

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
        // autoPlay is unreliable, we will handle playback manually.
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

  const handleItemVisible = useCallback((item: VideoItem) => {
    const slide = item.metadata?.slide as SlideType | undefined;
    if (slide && slide.id !== activeVideo?.id) {
      setActiveVideo(slide);
    }
  }, [activeVideo, setActiveVideo]);

  // Effect to set the first item as active as soon as it's available.
  useEffect(() => {
    if (!activeVideo && videoItems.length > 0) {
      handleItemVisible(videoItems[0]);
    }
  }, [videoItems, activeVideo, handleItemVisible]);

  // Effect to MANUALLY play the video when it becomes active.
  // This is the core fix for the Android playback issue.
  useEffect(() => {
    if (activeVideo) {
      // Find the video element in the DOM.
      // This relies on react-vertical-feed rendering a `data-id` attribute.
      const videoElement = document.querySelector(`[data-id="${activeVideo.id}"] video`) as HTMLVideoElement | null;

      if (videoElement) {
        // We have a gesture from the user (language select), so we can try to play with sound.
        videoElement.play().catch(error => {
          console.error("Video play failed:", error);
          // Optional: handle the error, e.g., by showing a play button.
        });
      }
    }
  }, [activeVideo]);

  const renderSlideOverlay = (item: VideoItem) => {
    const slide = item.metadata?.slide as SlideType | undefined;
    if (!slide) return null;
    const isActive = slide.id === activeVideo?.id;
    return <Slide slide={slide} isActive={isActive} />;
  };

  if (isLoading && slides.length === 0) {
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
