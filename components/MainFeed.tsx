"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { VideoSlide } from '@/lib/types';

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
    setActiveSlide,
    playVideo,
    pauseVideo,
  } = useStore();

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

  useEffect(() => {
    if (slides.length > 0) {
      const initialSlide = slides[0];
      setActiveSlide(initialSlide);
      if (initialSlide.type === 'video') {
        playVideo();
      } else {
        pauseVideo();
      }
    }
  }, [slides, setActiveSlide, playVideo, pauseVideo]);

  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <Swiper
      direction="vertical"
      className="w-full h-screen"
      modules={[Mousewheel]}
      mousewheel={true}
      onSlideChange={(swiper) => {
        const newSlide = slides[swiper.activeIndex];
        if (newSlide) {
          setActiveSlide(newSlide);
          if (newSlide.type === 'video') {
            playVideo();
          } else {
            pauseVideo();
          }
        }
      }}
      onReachEnd={() => {
        if (hasNextPage) {
          fetchNextPage();
        }
      }}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={slide.id}>
          <Slide slide={slide} isActive={false} />
        </SwiperSlide>
      ))}
       {hasNextPage && (
        <SwiperSlide>
            <div className="w-full h-full flex items-center justify-center bg-black">
                <Skeleton className="w-full h-full" />
            </div>
        </SwiperSlide>
      )}
    </Swiper>
  );
};

export default MainFeed;
