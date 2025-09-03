"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { VideoSlide } from '@/lib/types';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const activeSlide = useStore((state) => state.activeSlide);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Initialize HLS.js if not already done
    if (!hlsRef.current && Hls.isSupported()) {
      hlsRef.current = new Hls();
      hlsRef.current.attachMedia(videoElement);
    }

    const hls = hlsRef.current;
    const isVideoSlide = activeSlide && activeSlide.type === 'video';

    const playVideo = () => {
      // Mute the video to allow autoplay in most browsers
      videoElement.muted = true;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Autoplay was prevented:", error);
        });
      }
    };

    if (isVideoSlide) {
      const slideData = activeSlide.data as VideoSlide['data'];
      const hlsUrl = slideData?.hlsUrl;

      if (hlsUrl) {
        videoElement.style.display = 'block'; // Make player visible

        if (hls) {
          hls.loadSource(hlsUrl);
          hls.once(Hls.Events.MANIFEST_PARSED, playVideo);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          // For native HLS on Safari
          videoElement.src = hlsUrl;
          videoElement.addEventListener('loadeddata', playVideo);
        }
      } else {
        // It's a video slide but has no URL, so hide the player
        videoElement.style.display = 'none';
        videoElement.pause();
        videoElement.src = '';
      }
    } else {
      // Not a video slide, so stop playback and hide
      videoElement.style.display = 'none';
      videoElement.pause();
      videoElement.src = '';
      if (hls) {
        hls.stopLoad();
      }
    }

    return () => {
      // Cleanup listeners to prevent memory leaks
      if (hls) {
        hls.off(Hls.Events.MANIFEST_PARSED, playVideo);
      }
      videoElement.removeEventListener('loadeddata', playVideo);
    };
  }, [activeSlide]);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
      style={{ display: 'none' }} // Initially hidden
      playsInline
      loop
    />
  );
};

export default GlobalVideoPlayer;
