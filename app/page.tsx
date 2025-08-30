"use client";

import { useEffect } from 'react';
import VideoGrid from '@/components/VideoGrid';

export default function Home() {
  // Dynamically set app height for mobile browsers to fix the 100vh issue
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  return (
    <main style={{ height: 'var(--app-height)' }}>
      <VideoGrid />
    </main>
  );
}