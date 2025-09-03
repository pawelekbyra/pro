"use client";

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A component that renders a single, global video player.
 * It uses Hls.js for playback and is controlled by the global Zustand store.
 * This ensures only one video is ever playing, fixing performance issues.
 */
export const GlobalVideoPlayer = () => {
  const hlsRef = useRef<Hls | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { activeSlide } = useStore(
    (state) => ({ activeSlide: state.activeSlide }),
    shallow
  );

  const isVideoSlide = activeSlide?.type === 'video' && activeSlide.data?.hlsUrl;

  // Initialize and destroy Hls.js instance
  useEffect(() => {
    if (Hls.isSupported()) {
      hlsRef.current = new Hls({
        // Reduce buffering to start playback faster
        maxBufferLength: 30,
      });
    }
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  // Handle video playback logic
  useEffect(() => {
    const hls = hlsRef.current;
    const videoElement = videoRef.current;

    if (!hls || !videoElement) return;

    if (isVideoSlide && activeSlide.data) {
      const slideData = activeSlide.data; // Create a local constant
      // Attach HLS to our single video element
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        // Use the local constant which is guaranteed to be defined
        hls.loadSource(slideData.hlsUrl!);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.muted = true; // All videos are muted
          videoElement.playsInline = true;
          videoElement.play().catch(err => {
            console.error("Video play failed:", err);
          });
        });
      });
    } else {
      // If not a video slide, stop loading and detach
      hls.stopLoad();
      hls.detachMedia();
    }
  }, [isVideoSlide, activeSlide]); // Dependency array simplified

  return (
    <AnimatePresence>
      {isVideoSlide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 w-full h-full z-0"
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            playsInline
            // Poster can be set for a smoother transition
            poster={activeSlide?.data?.poster}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
