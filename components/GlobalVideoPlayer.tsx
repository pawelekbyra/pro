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
    setIsPlaying,
  } = useStore(
    (state) => ({
      activeVideo: state.activeVideo,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      togglePlay: state.togglePlay,
      setVideoElement: state.setVideoElement,
      setIsPlaying: state.setIsPlaying,
    }),
    shallow
  );

  // Initialize HLS.js and set the video element in the store
  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef);
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          maxBufferSize: 30,
          maxBufferLength: 10,
        });
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
      }
    }
    return () => {
      hlsRef.current?.destroy();
    }
  }, [setVideoElement]);

  // Master effect to handle changing the active video source
  useEffect(() => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video) return;

    if (!activeVideo || activeVideo.type !== 'video' || !activeVideo.data?.hlsUrl) {
      video.pause();
      setIsPlaying(false);
      if (hls) {
        hls.stopLoad();
      }
      video.removeAttribute('src');
      return;
    }

    const videoUrl = activeVideo.data.hlsUrl;

    video.pause();
    setIsPlaying(false);

    const startPlayback = () => {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Autoplay was prevented.", e);
        setIsPlaying(false);
      });
    };

    if (hls && videoUrl) {
      hls.off(Hls.Events.MANIFEST_PARSED);
      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        startPlayback();
      });
      hls.loadSource(videoUrl);
    } else if (videoUrl) {
      video.src = videoUrl;
      const onCanPlay = () => {
        startPlayback();
        video.removeEventListener('canplay', onCanPlay);
      };
      video.addEventListener('canplay', onCanPlay);
    }
  }, [activeVideo, setIsPlaying]);

  // Effect to handle manual play/pause toggle by the user
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      if (video.currentSrc || video.src) {
        video.play().catch(e => console.error("Play failed", e));
      }
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

  // Effect to handle video events like ending, time updates, etc.
  useEffect(() => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video) return;

    const handleEnded = () => {
      useStore.getState().setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      useStore.getState().setCurrentTime(video.currentTime);
    };

    // Use HLS events for more reliable metadata
    const handleManifestLoaded = () => {
        if (video.duration && isFinite(video.duration)) {
            useStore.getState().setDuration(video.duration);
        }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    hls?.on(Hls.Events.MANIFEST_LOADED, handleManifestLoaded);
    // Fallback for non-HLS
    video.addEventListener('durationchange', handleManifestLoaded);


    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      hls?.off(Hls.Events.MANIFEST_LOADED, handleManifestLoaded);
      video.removeEventListener('durationchange', handleManifestLoaded);
    };
  }, []); // This effect should only run once to attach listeners.

  return (
    <div className="absolute inset-0 z-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        controls
      />
      {/* The click-to-play logic is now handled by the SlideUI component overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.2 }}
            >
              <Play className="w-16 h-16 text-white/70" fill="white" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalVideoPlayer;
