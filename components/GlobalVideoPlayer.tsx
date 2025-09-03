"use client";

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

/**
 * A non-rendering component that manages a single, global Hls.js instance
 * for playing video slides. This prevents creating multiple Hls.js instances,
 * which is a major performance bottleneck.
 */
export const GlobalVideoPlayer = () => {
  const hlsRef = useRef<Hls | null>(null);

  // Subscribe to relevant state from the Zustand store.
  // We use `shallow` to prevent re-renders if other parts of the state change.
  const { activeSlide, videoElement } = useStore(
    (state) => ({
      activeSlide: state.activeSlide,
      videoElement: state.videoElement,
    }),
    shallow
  );

  // Effect to initialize and destroy the Hls.js instance
  useEffect(() => {
    if (Hls.isSupported()) {
      hlsRef.current = new Hls();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Effect to handle playback logic when the active slide or video element changes
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;

    const isVideoSlide = activeSlide?.type === 'video' && activeSlide.data?.hlsUrl;

    if (isVideoSlide && videoElement) {
      // Detach from any previous media element first
      hls.detachMedia();
      // Attach to the new video element
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(activeSlide.data.hlsUrl!);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.muted = true; // Ensure video is muted
          videoElement.play().catch(err => {
            console.error("Video play was prevented by the browser:", err);
          });
        });
      });
    } else {
      // If not a video slide or no video element, stop playback
      hls.stopLoad();
      hls.detachMedia();
    }

  }, [activeSlide, videoElement]);

  return null; // This component does not render anything
};
