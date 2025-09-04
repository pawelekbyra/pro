"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './ui/skeleton';

interface VideoPlayerProps {
  hlsUrl: string;
  // posterUrl is no longer needed, we use the first frame.
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const {
    isMuted,
    userPlaybackIntent,
    togglePlay,
    playVideo,
    pauseVideo,
    setCurrentTime,
    setDuration,
  } = useStore(
    (state) => ({
      isMuted: state.isMuted,
      userPlaybackIntent: state.userPlaybackIntent,
      togglePlay: state.togglePlay,
      playVideo: state.playVideo,
      pauseVideo: state.pauseVideo,
      setCurrentTime: state.setCurrentTime,
      setDuration: state.setDuration,
    }),
    shallow
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hls = new Hls();
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hlsRef.current = hls;

    const onFragLoaded = () => {
      setIsVideoReady(true);
      hls.off(Hls.Events.FRAG_LOADED, onFragLoaded); // Detach listener after first fire
    };
    hls.on(Hls.Events.FRAG_LOADED, onFragLoaded);

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      hls.destroy();
    };
  }, [hlsUrl, setCurrentTime, setDuration]);

  // This effect synchronizes the video element's state with our desired state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;

    const shouldPlay = isIntersecting && userPlaybackIntent !== 'pause';

    if (shouldPlay) {
      video.play().catch(e => console.error("Video play prevented:", e));
      if (!useStore.getState().isPlaying) {
        playVideo();
      }
    } else {
      video.pause();
       if (useStore.getState().isPlaying) {
        pauseVideo();
      }
    }
  }, [isIntersecting, userPlaybackIntent, isVideoReady, playVideo, pauseVideo]);


  // This effect handles the observer that detects if the video is on screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '100% 0px',
        threshold: 0.6,
      }
    );

    const currentVideoRef = videoRef.current;
    if (currentVideoRef) {
      observer.observe(currentVideoRef);
    }

    return () => {
      if (currentVideoRef) {
        observer.unobserve(currentVideoRef);
      }
    };
  }, []);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  return (
    <>
      <AnimatePresence>
        {!isVideoReady && (
            <Skeleton className="absolute inset-0 w-full h-full" />
        )}
      </AnimatePresence>
      <motion.video
        ref={videoRef}
        onClick={togglePlay}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        playsInline
        loop
        preload="auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVideoReady ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </>
  );
};

export default VideoPlayer;
