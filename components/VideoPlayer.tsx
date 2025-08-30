'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useHls } from '@/lib/useHls';
import { Heart, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  hlsSrc?: string | null;
  mp4Src: string;
  poster: string;
  isActive: boolean;
  isSecretActive: boolean;
  likeId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  hlsSrc,
  mp4Src,
  poster,
  isActive,
  isSecretActive,
  likeId,
  videoRef,
}) => {
  const [currentSrc, setCurrentSrc] = useState(hlsSrc || mp4Src);
  const [isHls, setIsHls] = useState(!!hlsSrc);

  // State for player UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleHlsFatalError = useCallback(() => {
    console.warn('HLS failed, falling back to MP4.');
    setIsHls(false);
    setCurrentSrc(mp4Src);
  }, [mp4Src]);

  // FIX #11: useHls hook is now called unconditionally
  useHls({
    videoRef,
    src: isHls ? currentSrc : null,
    onFatalError: handleHlsFatalError,
  });

  useEffect(() => {
    if (!isHls && videoRef.current) {
      videoRef.current.src = currentSrc;
    }
  }, [isHls, currentSrc, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video
        .play()
        .catch((error) => console.error('Autoplay was prevented:', error));
    } else {
      video.pause();
      video.currentTime = 0;
    }

    const updatePlayingState = () => setIsPlaying(!video.paused);
    video.addEventListener('play', updatePlayingState);
    video.addEventListener('pause', updatePlayingState);
    return () => {
      video.removeEventListener('play', updatePlayingState);
      video.removeEventListener('pause', updatePlayingState);
    };
  }, [isActive, videoRef]);

  const triggerLikeAnimation = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    // Find the actual like button and click it
    const likeButton = document.querySelector(
      `[data-like-id="${likeId}"]`
    ) as HTMLButtonElement;
    likeButton?.click();
  };

  const triggerPauseAnimation = () => {
    setShowPause(true);
    setTimeout(() => setShowPause(false), 500);
  };

  // FIX #5 & #6: Single and Double Tap Gesture Logic
  const handleVideoClick = () => {
    if (clickTimeout.current) {
      // Double click
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      triggerLikeAnimation();
    } else {
      // Single click
      clickTimeout.current = setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
            triggerPauseAnimation();
          }
        }
        clickTimeout.current = null;
      }, 250);
    }
  };

  const videoWrapperClassName = 'absolute top-0 left-0 w-full h-full';

  const videoClassName = `videoPlayer w-full h-full object-cover ${isSecretActive ? 'secret-active' : ''}`;

  return (
    <div className={videoWrapperClassName} onClick={handleVideoClick}>
      <video
        ref={videoRef}
        className={videoClassName}
        poster={poster}
        muted
        loop
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        key={currentSrc}
      />
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart size={80} className="text-white fill-white drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPause && (
          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeIn' }}
            className="absolute left-0 w-full flex items-center justify-center pointer-events-none"
            style={{
              top: 'var(--topbar-height)',
              height:
                'calc(100% - var(--topbar-height) - var(--bottombar-height))',
            }}
          >
            <Pause
              size={60}
              className="text-white/80 fill-white/30 drop-shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
