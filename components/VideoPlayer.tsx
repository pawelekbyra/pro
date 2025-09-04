"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './ui/skeleton';

interface VideoPlayerProps {
  hlsUrl: string;
  isActive: boolean; // Is the slide currently active/visible?
  isMuted: boolean;
  onToggleMute: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  hlsUrl,
  isActive,
  isMuted,
  onToggleMute,
  onTimeUpdate,
  onDurationChange,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    const setupHls = () => {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsVideoReady(true);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsVideoReady(true);
        });
      }
    };

    setupHls();

    const timeUpdateHandler = () => onTimeUpdate(video.currentTime);
    const durationChangeHandler = () => onDurationChange(video.duration);

    video.addEventListener('timeupdate', timeUpdateHandler);
    video.addEventListener('durationchange', durationChangeHandler);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', timeUpdateHandler);
      video.removeEventListener('durationchange', durationChangeHandler);
      video.removeEventListener('ended', onEnded);
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, onTimeUpdate, onDurationChange, onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;

    if (isActive) {
      video.play().catch(e => console.error("Video play prevented:", e));
    } else {
      video.pause();
      video.currentTime = 0; // Reset video on slide change
    }
  }, [isActive, isVideoReady]);

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
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        playsInline
        preload="auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVideoReady ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={onToggleMute}
      />
    </>
  );
};

export default VideoPlayer;
