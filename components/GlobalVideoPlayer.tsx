"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useHls } from '@/lib/useHls';
import { VideoSlide } from '@/lib/types';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state } = useVideoGrid();
  const { activeSlideData } = state;

  // For now, video is always muted. This can be expanded later.
  const isMuted = true;

  const handleHlsFatalError = useCallback(() => {
    console.warn('HLS fatal error in GlobalVideoPlayer. Fallback not implemented.');
  }, []);

  const videoSlide = activeSlideData?.type === 'video' ? (activeSlideData as VideoSlide) : null;
  const videoSrc = videoSlide?.data?.hlsUrl || videoSlide?.data?.mp4Url;
  const isHls = videoSlide?.data?.hlsUrl && videoSrc === videoSlide.data.hlsUrl;

  useHls({
    videoRef,
    src: isHls ? videoSrc : null,
    onFatalError: handleHlsFatalError,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (video && !isHls && videoSrc) {
      if (video.src !== videoSrc) {
        video.src = videoSrc;
      }
    }
  }, [videoSrc, isHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (videoSlide && videoSrc) {
      if (video.src !== videoSrc) {
        video.src = videoSrc;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name !== 'NotAllowedError') {
            console.error("Video play failed:", err);
          }
        });
      }
    } else {
      video.pause();
      if (video.src) {
        video.removeAttribute('src');
        video.load();
      }
    }
  }, [videoSlide, isMuted, videoSrc]);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 h-full w-full object-cover -z-10"
      loop
      playsInline
      muted
      poster={videoSlide?.data?.poster}
      style={{ opacity: videoSlide ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
    />
  );
};

export default GlobalVideoPlayer;
