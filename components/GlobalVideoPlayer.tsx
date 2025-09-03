"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { VideoSlide } from '@/lib/types';
import { shallow } from 'zustand/shallow';

const GlobalVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { activeSlide, isActive } = useStore(
    (state) => {
        const slide = state.activeSlide;
        const isActive = slide?.id === state.activeSlide?.id &&
                         state.activeColumnIndex === state.activeColumnIndex &&
                         state.activeSlideIndex === state.activeSlideIndex;
        return { activeSlide: state.activeSlide, isActive };
    },
    shallow
  );

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Initialize HLS.js
    if (!hlsRef.current) {
      if (Hls.isSupported()) {
        hlsRef.current = new Hls();
        hlsRef.current.attachMedia(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support
      }
    }

    const hls = hlsRef.current;
    const isVideoSlide = activeSlide && activeSlide.type === 'video';

    if (isVideoSlide && isActive) {
      const slideData = activeSlide.data as VideoSlide['data'];
      const hlsUrl = slideData?.hlsUrl;

      if (hlsUrl) {
        console.log(`GlobalPlayer: Loading HLS stream: ${hlsUrl}`);
        videoElement.style.display = 'block';
        if (hls) {
          hls.loadSource(hlsUrl);
          hls.once(Hls.Events.MANIFEST_PARSED, () => {
            videoElement.muted = false;
            videoElement.play().catch(err => console.error("Global player play failed", err));
          });
        } else {
          // For native HLS on Safari
          videoElement.src = hlsUrl;
          videoElement.addEventListener('loadedmetadata', () => {
            videoElement.muted = false;
            videoElement.play().catch(err => console.error("Global player play failed (native)", err));
          });
        }
      }
    } else {
      // Not a video slide or not active, so stop playback and hide
      console.log("GlobalPlayer: No active video slide. Pausing and hiding.");
      videoElement.pause();
      videoElement.src = '';
      videoElement.style.display = 'none';
      if (hls) {
        hls.stopLoad();
      }
    }

    return () => {
      // Don't destroy HLS instance, just stop loading
      // if (hls) {
      //   hls.stopLoad();
      // }
    };
  }, [activeSlide, isActive]);

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
