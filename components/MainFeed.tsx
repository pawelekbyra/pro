import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [isLooping, setIsLooping] = useState(false);
  const isJumping = useRef(false);

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

  const loopedSlides = useMemo(() => {
      if (!isLooping || slides.length === 0) return slides;
      return [...slides, ...slides, ...slides];
  }, [slides, isLooping]);

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    } else if (slides.length > 0) {
        setIsLooping(true);
    }
  }, [hasNextPage, fetchNextPage, slides.length]);

  useEffect(() => {
    if (isLooping && scrollContainerRef.current) {
        const slideHeight = scrollContainerRef.current.clientHeight;
        const initialScrollTop = slides.length * slideHeight;
        scrollContainerRef.current.scrollTop = initialScrollTop;
    }
  }, [isLooping, slides.length]);

  useEffect(() => {
      if (!isLooping) return;

      const observer = new IntersectionObserver(
          (entries) => {
              if (isJumping.current) return;
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      const slideHeight = scrollContainerRef.current!.clientHeight;
                      isJumping.current = true;
                      if (entry.target === topSentinelRef.current) {
                          const newScrollTop = scrollContainerRef.current!.scrollTop + (slides.length * slideHeight);
                          scrollContainerRef.current!.scrollTop = newScrollTop;
                      } else if (entry.target === bottomSentinelRef.current) {
                          const newScrollTop = scrollContainerRef.current!.scrollTop - (slides.length * slideHeight);
                          scrollContainerRef.current!.scrollTop = newScrollTop;
                      }
                      setTimeout(() => { isJumping.current = false; }, 100);
                  }
              });
          },
          { root: scrollContainerRef.current, threshold: 0.1 }
      );

      if (topSentinelRef.current) observer.observe(topSentinelRef.current);
      if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

      return () => {
          observer.disconnect();
      };
  }, [isLooping, slides]);


  if (isLoading && slides.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  if (isError) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white">Error loading slides.</div>;
  }

  return (
    <div ref={scrollContainerRef} className="w-full h-screen overflow-y-scroll snap-y snap-mandatory">
      {isLooping && <div ref={topSentinelRef} />}
      {loopedSlides.map((slide, index) => (
        <div key={`${slide.id}-${index}`} className="h-full w-full snap-start">
          <Slide slide={slide} />
        </div>
      ))}
      {isLooping && <div ref={bottomSentinelRef} />}
    </div>
  );
};

export default MainFeed;
