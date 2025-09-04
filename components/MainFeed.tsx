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
  const [activeIndex, setActiveIndex] = useState(0);
  const { setActiveSlide, setCurrentHlsUrl, setNextHlsUrl, setIsVideoLoaded } = useStore();

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
      const nextSlide = slides[1];
      setActiveSlide(initialSlide);

      if (initialSlide.type === 'video') {
        setCurrentHlsUrl((initialSlide as VideoSlide).data?.hlsUrl ?? null);
      }
      if (nextSlide && nextSlide.type === 'video') {
        setNextHlsUrl((nextSlide as VideoSlide).data?.hlsUrl ?? null);
      }
    }
  }, [slides, setActiveSlide, setCurrentHlsUrl, setNextHlsUrl]);

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
        setActiveIndex(swiper.activeIndex);
        const newSlide = slides[swiper.activeIndex];
        const nextSlide = slides[swiper.activeIndex + 1];
        if (newSlide) {
          setActiveSlide(newSlide);
          setIsVideoLoaded(false); // Reset loaded state for new slide

          if (newSlide.type === 'video') {
            setCurrentHlsUrl((newSlide as VideoSlide).data?.hlsUrl ?? null);
          } else {
            setCurrentHlsUrl(null);
          }

          if (nextSlide && nextSlide.type === 'video') {
            setNextHlsUrl((nextSlide as VideoSlide).data?.hlsUrl ?? null);
          } else {
            setNextHlsUrl(null);
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
          <Slide slide={slide} isActive={index === activeIndex} />
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
