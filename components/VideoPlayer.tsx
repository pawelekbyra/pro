"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoSlide } from '@/lib/types';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useHls } from '@/lib/useHls';
import { Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import Sidebar from './Sidebar';
import VideoInfo from './VideoInfo';
import BottomBar from './BottomBar'; // Dodano import BottomBar
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  slide: VideoSlide;
  isActive: boolean;
  isPrefetchTarget: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slide, isActive, isPrefetchTarget }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, setSoundActiveSlide, setActiveVideoRef } = useVideoGrid();
  const { soundActiveSlideId } = state;
  const isMuted = soundActiveSlideId !== slide.id;
  const [videoSrc, setVideoSrc] = useState(slide.data?.hlsUrl || slide.data?.mp4Url);
  const [areBarsVisible, setAreBarsVisible] = useState(true);
  const isHls = videoSrc?.endsWith('.m3u8');

  useEffect(() => {
    if (isActive) {
      setActiveVideoRef(videoRef);
      setAreBarsVisible(true);
    }
  }, [isActive, setActiveVideoRef]);

  const handleHlsFatalError = useCallback(() => {
    console.warn('HLS fatal error. Falling back to MP4 source.');
    setVideoSrc(slide.data?.mp4Url || undefined);
  }, [slide.data?.mp4Url]);

  useHls({
    videoRef,
    src: isHls ? videoSrc : null,
    onFatalError: handleHlsFatalError,
  });

  useEffect(() => {
    if (videoRef.current && !isHls && videoSrc) {
      videoRef.current.src = videoSrc;
    }
  }, [videoSrc, isHls]);

  // Effect for smart preloading
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.preload = 'auto';
    } else if (isPrefetchTarget) {
      video.preload = 'metadata';
    } else {
      video.preload = 'none';
    }
  }, [isActive, isPrefetchTarget]);

  // Effect for robust playback control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (isActive) {
      // Use a Promise-based approach to handle play()
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Autoplay was prevented. This is common in browsers.
          // We don't need to log it as an error unless it's something else.
          if (err.name !== 'NotAllowedError') {
            console.error("Video play failed:", err);
          }
        });
      }
    } else {
      video.pause();
    }
  }, [isActive, isMuted, videoSrc]); // videoSrc dependency ensures this runs if the source changes

  const toggleMute = () => {
    if (isMuted) {
      setSoundActiveSlide(slide.id);
    } else {
      setSoundActiveSlide(null);
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted
        poster={slide.data?.poster}
      />

      <VideoInfo
        user={slide.username}
        description={slide.data?.description || 'No description available.'}
      />

      <AnimatePresence>
        {isActive && areBarsVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 w-full h-full z-40 pointer-events-none"
          >
            <div className="pointer-events-auto">
              <Sidebar
                avatarUrl={slide.avatar}
                initialLikes={slide.initialLikes}
                isLiked={slide.isLiked}
                slideId={slide.id}
                commentsCount={slide.initialComments}
                x={slide.x}
              />
              <BottomBar videoRef={videoRef} isActive={isActive} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {isActive && (
        <>
          <button
            onClick={toggleMute}
            className="absolute top-16 right-4 bg-black/50 p-2 rounded-full text-white z-10"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>

          <motion.button
            onClick={() => setAreBarsVisible(!areBarsVisible)}
            className="absolute bottom-24 left-4 bg-transparent text-white z-10 p-2 rounded-full bg-black/50"
            aria-label="Toggle UI visibility"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: areBarsVisible ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {areBarsVisible ? <Eye size={24} /> : <EyeOff size={24} />}
          </motion.button>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
