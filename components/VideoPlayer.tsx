"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useHls } from '@/lib/useHls';
import { Heart, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoGrid } from '@/context/VideoGridContext';
import { Slide } from '@/lib/types';

interface VideoPlayerProps {
  hlsSrc?: string | null;
  mp4Src: string;
  poster: string;
  isActive: boolean;
  isSecretActive: boolean;
  videoId: string;
  slide: Slide;
  videoRef: React.RefObject<HTMLVideoElement>;
  onTimeUpdate: (videoId: string, time: number) => void;
  startTime: number;
  onPlaybackFailure: () => void;
  isPlaying: boolean;
}

const DOUBLE_CLICK_DELAY_MS = 200;

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsSrc, mp4Src, poster, isActive, isSecretActive, videoId, slide, videoRef, onTimeUpdate, startTime, onPlaybackFailure, isPlaying }) => {
  const { prefetchHint, activeSlideId, isAnyModalOpen } = useVideoGrid();
  const [currentSrc, setCurrentSrc] = useState(hlsSrc || mp4Src);
  const [isHls, setIsHls] = useState(!!hlsSrc);

  // State for player UI
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

    const isThisVideoActive = videoId === activeSlideId;

    // Smart Playback Logic
    if (isActive && !isAnyModalOpen && isThisVideoActive) {
      // This is the active slide, play it with sound
      video.muted = false;
      if (startTime > 0 && Math.abs(video.currentTime - startTime) > 0.5) {
        video.currentTime = startTime;
      }
      video.play().catch(error => {
        console.error(`Autoplay was prevented for video ${videoId}:`, error);
        // Mute and try to play again if unmuted playback fails
        if (error.name === 'NotAllowedError') {
          video.muted = true;
          video.play().catch(innerError => {
             console.error(`Muted autoplay also failed for video ${videoId}:`, innerError);
             onPlaybackFailure();
          });
        } else {
          onPlaybackFailure();
        }
      });
    } else {
      // This is not the active slide, or the feed is inactive. Pause and mute it.
      if (!video.paused) {
        if (video.currentTime > 0) {
          onTimeUpdate(videoId, video.currentTime);
        }
        video.pause();
      }
      video.muted = true;
    }
  }, [isActive, isAnyModalOpen, activeSlideId, videoId, videoRef, onTimeUpdate, startTime, onPlaybackFailure]);

  const triggerLikeAnimation = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    // Find the actual like button and click it
    const likeButton = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLButtonElement;
    likeButton?.click();
  };

  const triggerPauseAnimation = () => {
    setShowPause(true);
    setTimeout(() => setShowPause(false), 500);
  }

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
            onTimeUpdate(videoId, video.currentTime); // Save time on manual pause
            video.pause();
            triggerPauseAnimation();
          }
        }
        clickTimeout.current = null;
      }, DOUBLE_CLICK_DELAY_MS);
    }
  };

  const videoWrapperClassName = 'absolute top-0 left-0 w-full h-full';

  const videoClassName = `videoPlayer w-full h-full object-cover ${isSecretActive ? 'secret-active' : ''}`;

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // If an error occurs and we are already on the MP4 fallback,
    // it means both HLS and MP4 have failed. Time to give up on this video.
    if (!isHls) {
      console.error("MP4 fallback also failed. Triggering playback failure handler.");
      onPlaybackFailure();
    }
  };

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
        preload={isActive ? 'metadata' : (prefetchHint && prefetchHint.x === slide.x && prefetchHint.y === slide.y ? 'auto' : 'none')}
        key={currentSrc}
        onError={handleVideoError}
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
              height: 'calc(100% - var(--topbar-height) - var(--bottombar-height))'
            }}
          >
            <Pause size={60} className="text-white/80 fill-white/30 drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
