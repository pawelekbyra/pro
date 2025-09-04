"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

interface VideoPlayerProps {
  hlsUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const {
    isMuted,
    playVideo,
    pauseVideo,
    setCurrentTime,
    setDuration,
  } = useStore(
    (state) => ({
      isMuted: state.isMuted,
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isIntersecting) {
      video.play().catch(e => console.error("Video play prevented:", e));
      playVideo();
    } else {
      video.pause();
      video.currentTime = 0;
      pauseVideo();
    }
  }, [isIntersecting, playVideo, pauseVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.6, // 60% of the video must be visible to play
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

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
      playsInline
      loop
      preload="auto"
    />
  );
};

export default VideoPlayer;
