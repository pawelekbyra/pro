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

  const { activeVideo, isPlaying, isMuted, togglePlay, setActiveVideo } = useStore(
    (state) => ({
      activeVideo: state.activeVideo,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      togglePlay: state.togglePlay,
      setActiveVideo: state.setActiveVideo,
    }),
    shallow
  );

  // Initialize HLS.js
  useEffect(() => {
    if (typeof window !== 'undefined' && videoRef.current) {
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.attachMedia(video);
        hlsRef.current = hls;
      }
    }
    return () => hlsRef.current?.destroy();
  }, []);

  // Effect to handle changing the video source
  useEffect(() => {
    const hls = hlsRef.current;

    // Only proceed if the active slide is a video and has data
    if (activeVideo && activeVideo.type === 'video' && activeVideo.data) {
      const videoUrl = activeVideo.data.hlsUrl;

      if (hls && videoUrl) {
        hls.loadSource(videoUrl);
      } else if (videoRef.current && videoUrl) {
        // For native HLS support (Safari)
        videoRef.current.src = videoUrl;
      }
    }
  }, [activeVideo]);

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

  // Effect to handle video ending
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // For now, just pause. In the future, could advance to next video.
      if (isPlaying) {
        togglePlay();
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isPlaying, togglePlay]);

  return (
    <div className="absolute inset-0 z-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        loop // Loop the video for now
      />
      {/* Clickable overlay for play/pause */}
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
