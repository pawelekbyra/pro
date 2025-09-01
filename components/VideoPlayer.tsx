"use client";

import React, { useRef, useEffect } from 'react';
import { VideoSlide } from '@/lib/types';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useHls } from '@/lib/useHls';
import { Volume2, VolumeX } from 'lucide-react';
import { useState, useCallback } from 'react';

interface VideoPlayerProps {
  slide: VideoSlide;
  isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slide, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, setSoundActiveSlide } = useVideoGrid();
  const { soundActiveSlideId } = state;
  const isMuted = soundActiveSlideId !== slide.id;
  const [videoSrc, setVideoSrc] = useState(slide.data?.hlsUrl || slide.data?.mp4Url);

  const handleHlsFatalError = useCallback(() => {
    console.warn('HLS fatal error. Falling back to MP4 source.');
    setVideoSrc(slide.data?.mp4Url || null);
  }, [slide.data?.mp4Url]);

  // Use HLS hook to manage video source
  useHls({
    videoRef,
    src: videoSrc,
    onFatalError: handleHlsFatalError,
  });

  // Effect to control play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(err => {
        // Autoplay is often blocked, this is expected.
        if (err.name !== 'NotAllowedError') {
          console.error("Video play failed:", err);
        }
      });
    } else {
      video.pause();
      video.currentTime = 0; // Reset video on slide change
    }
  }, [isActive]);

  // Effect to control mute state from global context
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

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
        poster={slide.data?.poster}
        // Muted is controlled by useEffect to sync with global state
      >
        {/* The useHls hook will set the src, but we can provide a fallback for non-JS or non-HLS browsers */}
        <source src={slide.data?.mp4Url} type="video/mp4" />
      </video>
      {isActive && (
        <button
          onClick={toggleMute}
          className="absolute top-16 right-4 bg-black/50 p-2 rounded-full text-white z-10"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
