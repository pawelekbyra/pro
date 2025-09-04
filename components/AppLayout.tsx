"use client";

import React, { useEffect } from 'react';
import Preloader from './Preloader';
import { useTranslation } from '@/context/LanguageContext';
import TopBar from './TopBar';
import GlobalVideoPlayer from './GlobalVideoPlayer';
import VideoControls from './VideoControls';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    activeSlide,
    currentTime,
    duration,
    isPlaying,
    isMuted,
    togglePlay,
    seek,
    setIsMuted
  } = useStore(
    (state) => ({
      activeSlide: state.activeSlide,
      currentTime: state.currentTime,
      duration: state.duration,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      togglePlay: state.togglePlay,
      seek: state.seek,
      setIsMuted: state.setIsMuted,
    }),
    shallow
  );

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  const isVideoSlide = activeSlide?.type === 'video';

  return (
    <div className="flex h-full flex-col relative">
      <GlobalVideoPlayer />
      <TopBar />
      <div className="flex-1 overflow-auto z-10">
        {children}
      </div>
      {isVideoSlide && (
        <VideoControls
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onToggleMute={() => setIsMuted(!isMuted)}
          onSeek={seek}
        />
      )}
    </div>
  );
}
