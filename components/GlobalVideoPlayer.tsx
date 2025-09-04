"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const prefetchHlsRef = useRef<Hls | null>(null);

  const {
    currentHlsUrl,
    nextHlsUrl,
    isPlaying,
    isMuted,
    activeSlide,
    isVideoLoaded,
    setIsVideoLoaded,
    setCurrentTime,
    setDuration,
    currentTime,
  } = useStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If the difference is small, it's likely from a timeUpdate event, not a seek.
    // This prevents a loop where the effect and the event trigger each other.
    if (Math.abs(video.currentTime - currentTime) > 1) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    if (!prefetchHlsRef.current) {
      prefetchHlsRef.current = new Hls();
    }
    if (nextHlsUrl) {
      console.log("Prefetching HLS URL:", nextHlsUrl);
      prefetchHlsRef.current.loadSource(nextHlsUrl);
    }
  }, [nextHlsUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    if (hlsRef.current === null) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsVideoLoaded(true);
        // Autoplay is handled by the isPlaying effect
      });
       hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
        }
      });
    }

    const hls = hlsRef.current;

    if (currentHlsUrl) {
      hls.loadSource(currentHlsUrl);
      hls.attachMedia(video);
    }

    return () => {
      // We don't destroy HLS instance here to keep it global
    };
  }, [currentHlsUrl, setIsVideoLoaded, setCurrentTime, setDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(e => console.error("Play was prevented.", e));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  const isVideoSlide = activeSlide?.type === 'video';

  return (
    <video
      ref={videoRef}
      className={`absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${isVideoSlide && isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
      playsInline
    />
  );
};

export default GlobalVideoPlayer;
