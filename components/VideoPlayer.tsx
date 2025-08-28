"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useHls } from '@/lib/useHls';

interface VideoPlayerProps {
  hlsSrc?: string | null;
  mp4Src: string;
  poster: string;
  isActive: boolean;
  isSecretActive: boolean;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  seekTime: number | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  hlsSrc,
  mp4Src,
  poster,
  isActive,
  isSecretActive,
  onTimeUpdate,
  onLoadedMetadata,
  seekTime,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState(hlsSrc || mp4Src);
  const [isHls, setIsHls] = useState(!!hlsSrc);

  const handleHlsFatalError = () => {
    console.warn('HLS failed, falling back to MP4.');
    setIsHls(false);
    setCurrentSrc(mp4Src);
  };

  useHls({
    videoRef,
    src: isHls ? currentSrc : null,
    onFatalError: handleHlsFatalError,
  });

  useEffect(() => {
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
    }
  }, [isActive]);

  // Effect to handle external seeking
  useEffect(() => {
    if (seekTime !== null && videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - seekTime) > 0.5) {
        videoRef.current.currentTime = seekTime;
      }
    }
  }, [seekTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onLoadedMetadata(videoRef.current.duration);
    }
  };

  const videoClassName = [
    'videoPlayer',
    'absolute top-0 left-0 w-full h-full object-cover',
    isSecretActive ? 'secret-active' : '',
  ].filter(Boolean).join(' ');

  return (
    <video
      ref={videoRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      className={videoClassName}
      poster={poster}
      muted
      loop
      playsInline
      webkit-playsinline
      preload="metadata"
      key={currentSrc}
    >
    </video>
  );
};

export default VideoPlayer;
