"use client";

import React, { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';

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
