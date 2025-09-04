"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Slide from '@/components/Slide';
import { Skeleton } from '@/components/ui/skeleton';

// --- Swiper Imports ---
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

const fetchSlides = async ({ pageParam = '' }) => {
  // We fetch a larger number of slides to make the feed feel substantial.
  const res = await fetch(`/api/slides?cursor=${pageParam}&limit=10`);
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

  // Effect to fetch more slides when user gets close to the end
  useEffect(() => {
    if (hasNextPage && activeIndex >= slides.length - 3) {
      fetchNextPage();
    }
  }, [activeIndex, slides.length, hasNextPage, fetchNextPage]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <Swiper
      direction={'vertical'}
      className="w-full h-screen"
      slidesPerView={1}
      spaceBetween={0}
      onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
      mousewheel
      speed={600}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={`${slide.id}-${index}`}>
          <Slide
            slide={slide}
            isActive={index === activeIndex}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MainFeed;
