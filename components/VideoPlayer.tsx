"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

interface VideoPlayerProps {
  hlsUrl: string;
  posterUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl, posterUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

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

    if (Hls.isSupported()) {
      if (!hlsRef.current) {
        const hls = new Hls();
        hls.attachMedia(video);
        hlsRef.current = hls;
      }
      hlsRef.current.loadSource(hlsUrl);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, setCurrentTime, setDuration]);

  // This effect synchronizes the video element's state with our desired state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const shouldPlay = isIntersecting && userPlaybackIntent !== 'pause';

    if (shouldPlay) {
      video.play().catch(e => console.error("Video play prevented:", e));
      // We also update the global state if it's not already correct
      if (!useStore.getState().isPlaying) {
        playVideo();
      }
    } else {
      video.pause();
       // We also update the global state if it's not already correct
       if (useStore.getState().isPlaying) {
        pauseVideo();
      }
    }
  }, [isIntersecting, userPlaybackIntent, playVideo, pauseVideo]);


  // This effect handles the observer that detects if the video is on screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        // When video goes out of view, reset its time and pause it
        if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.currentTime = 0;
          pauseVideo();
        }
      },
      {
        root: null,
        rootMargin: '100% 0px', // Preload one viewport height away
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
  }, [pauseVideo]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  return (
    <video
      ref={videoRef}
      onClick={togglePlay}
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
      playsInline
      loop
      preload="auto"
      poster={posterUrl}
    />
  );
};

export default VideoPlayer;
