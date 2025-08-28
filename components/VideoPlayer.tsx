"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useHls } from '@/lib/useHls';

interface VideoPlayerProps {
  hlsSrc?: string | null;
  mp4Src: string;
  poster: string;
  isActive: boolean;
  isSecretActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsSrc, mp4Src, poster, isActive, isSecretActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState(hlsSrc || mp4Src);
  const [isHls, setIsHls] = useState(!!hlsSrc);

  const handleHlsFatalError = () => {
    console.warn('HLS failed, falling back to MP4.');
    setIsHls(false);
    setCurrentSrc(mp4Src);
  };

  // Use the custom hook only if we are trying to play an HLS stream
  useHls({
    videoRef,
    src: isHls ? currentSrc : null,
    onFatalError: handleHlsFatalError,
  });

  useEffect(() => {
    // If we are not using HLS, we need to set the src directly
    if (!isHls && videoRef.current) {
      videoRef.current.src = currentSrc;
    }
  }, [isHls, currentSrc]);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(error => {
        console.error("Autoplay was prevented:", error);
      });
    } else {
      videoRef.current?.pause();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const videoClassName = [
    'videoPlayer',
    'absolute top-0 left-0 w-full h-full object-cover',
    isSecretActive ? 'secret-active' : '',
  ].filter(Boolean).join(' ');

  return (
    <video
      ref={videoRef}
      className={videoClassName}
      poster={poster}
      muted
      loop
      playsInline
      webkit-playsinline
      preload="metadata"
      // The key forces a re-mount of the video element when the src changes
      // This is important for switching between HLS and MP4
      key={currentSrc}
    >
      {/* The source tag is managed by the useHls hook or the useEffect above */}
    </video>
  );
};

export default VideoPlayer;
