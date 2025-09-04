"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useSwiperSlide } from 'swiper/react';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const swiperSlide = useSwiperSlide();

  const { isPlaying, isMuted } = useStore(
    (state) => ({
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
    }),
    shallow
  );

  const isActuallyPlaying = isPlaying && swiperSlide.isActive;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      if (!hlsRef.current) {
        hlsRef.current = new Hls();
        hlsRef.current.attachMedia(video);
      }
      hlsRef.current.loadSource(hlsUrl);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActuallyPlaying) {
      video.play().catch(e => console.error("Video play prevented:", e));
    } else {
      video.pause();
      video.currentTime = 0; // Reset video on pause
    }
  }, [isActuallyPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  return (
    <video
      ref={videoRef}
      className={`absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${swiperSlide.isActive ? 'opacity-100' : 'opacity-0'}`}
      playsInline
      loop
    />
  );
};

export default VideoPlayer;
