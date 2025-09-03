"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalVideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const {
    activeVideo,
    isPlaying,
    isMuted,
    togglePlay,
    setVideoElement,
    preloadedVideoUrl
  } = useStore(
    (state) => ({
      activeVideo: state.activeVideo,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      togglePlay: state.togglePlay,
      setVideoElement: state.setVideoElement,
      preloadedVideoUrl: state.preloadedVideoUrl,
    }),
    shallow
  );

  // Initialize HLS.js and set the video element in the store
  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef);
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
      }
    }
    return () => {
      hlsRef.current?.destroy();
    }
  }, [setVideoElement]);

  // Effect for preloading the initial video
  useEffect(() => {
    const hls = hlsRef.current;
    if (hls && preloadedVideoUrl) {
      hls.loadSource(preloadedVideoUrl);
    } else if (videoRef.current && preloadedVideoUrl) {
      videoRef.current.src = preloadedVideoUrl;
    }
  }, [preloadedVideoUrl]);

  // Effect to handle changing the active video source (after preloading)
  useEffect(() => {
    const hls = hlsRef.current;

    if (activeVideo && activeVideo.type === 'video' && activeVideo.data) {
      const videoUrl = activeVideo.data.hlsUrl;

      // Don't interrupt the preloaded video if it's the same as the active one
      if (videoUrl && videoUrl === preloadedVideoUrl && videoRef.current?.src === videoUrl) {
        return;
      }

      if (hls && videoUrl) {
        hls.loadSource(videoUrl);
      } else if (videoRef.current && videoUrl) {
        videoRef.current.src = videoUrl;
      }
    }
  }, [activeVideo, preloadedVideoUrl]);

  // Effect to handle play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(e => console.error("Play failed", e));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Effect to handle mute/unmute
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Effect to handle video ending, time updates, and duration changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (useStore.getState().isPlaying) {
        useStore.getState().togglePlay();
      }
    };

    const handleTimeUpdate = () => {
      useStore.getState().setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      useStore.getState().setDuration(video.duration);
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, []); // Empty dependency array to run only once

  return (
    <div className="absolute inset-0 z-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        loop
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={togglePlay}
      >
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.2 }}
            >
              <Play className="w-16 h-16 text-white/70" fill="white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GlobalVideoPlayer;
