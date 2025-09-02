"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useHls } from '@/lib/useHls';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, setActiveVideoRef } = useVideoGrid();
  const { activeVideoData, soundActiveSlideId } = state;
  const isMuted = soundActiveSlideId !== activeVideoData?.id;

  // Set the active video ref in the context once the component mounts
  useEffect(() => {
    if (videoRef.current) {
      setActiveVideoRef(videoRef);
    }
    // Cleanup on unmount
    return () => setActiveVideoRef(null);
  }, [setActiveVideoRef]);

  const handleHlsFatalError = useCallback(() => {
    // In a real app, you might want to switch to the mp4Url here
    console.warn('HLS fatal error in GlobalVideoPlayer. Fallback not implemented.');
  }, []);

  const videoSrc = activeVideoData?.data?.hlsUrl || activeVideoData?.data?.mp4Url;
  const isHls = activeVideoData?.data?.hlsUrl && videoSrc === activeVideoData.data.hlsUrl;

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

    if (activeVideoData && video.src) {
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
      // When there's no active video, also clear the src to stop buffering
      if (video.src) {
        video.removeAttribute('src');
        video.load();
      }
    }
  }, [activeVideoData, isMuted, videoSrc]);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 h-full w-full object-cover -z-10" // Placed in the background
      loop
      playsInline
      muted // Always muted initially, unmute is handled by context state
      poster={activeVideoData?.poster}
      style={{ opacity: activeVideoData ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
    />
  );
};

export default GlobalVideoPlayer;
