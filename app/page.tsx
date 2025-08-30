"use client";

import { useState, useEffect } from 'react';
import { Grid } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import VideoGrid from '@/components/VideoGrid';

export default function Home() {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGridData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/videos');
        if (!response.ok) throw new Error('Failed to fetch grid data');
        const data = await response.json();
        setGrid(data.grid);
      } catch (error) {
        console.error("Failed to fetch grid data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGridData();
  }, []);

  // Dynamically set app height for mobile browsers
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  if (loading || !grid) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black" style={{ height: 'var(--app-height)' }}>
        {/* Top Bar Skeleton */}
        <div className="absolute top-0 left-0 w-full z-30 flex justify-center items-center" style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)' }}>
          <Skeleton className="h-4 w-28" />
        </div>
        {/* Sidebar Skeleton */}
        <div className="absolute right-2 flex flex-col items-center gap-4 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
        {/* Bottom Bar Skeleton */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4" style={{ paddingBottom: 'calc(10px + var(--safe-area-bottom))' }}>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <main style={{ height: 'var(--app-height)' }}>
      <VideoGrid initialGrid={grid} />
    </main>
  );
}