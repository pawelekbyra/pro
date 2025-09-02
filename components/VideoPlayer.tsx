"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoSlide } from '@/lib/types';
import { useVideoGrid } from '@/context/VideoGridContext';
import { useHls } from '@/lib/useHls';
import { Volume2, VolumeX } from 'lucide-react';
import Sidebar from './Sidebar';
import VideoInfo from './VideoInfo';

interface VideoPlayerProps {
  slide: VideoSlide;
  isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slide, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, setSoundActiveSlide, setActiveVideoRef } = useVideoGrid();
  const { soundActiveSlideId } = state;
  const isMuted = soundActiveSlideId !== slide.id;
  const [videoSrc, setVideoSrc] = useState(slide.data?.hlsUrl || slide.data?.mp4Url);

  useEffect(() => {
    if (isActive) {
      setActiveVideoRef(videoRef);
    }
    // No cleanup needed here, DesktopLayout will handle nulling the ref
    // when the active slide changes and this component unmounts.
  }, [isActive, setActiveVideoRef]);

  const handleHlsFatalError = useCallback(() => {
    console.warn('HLS fatal error. Falling back to MP4 source.');
    setVideoSrc(slide.data?.mp4Url || undefined);
  }, [slide.data?.mp4Url]);

  useHls({
    videoRef,
    src: videoSrc,
    onFatalError: handleHlsFatalError,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(err => {
        if (err.name !== 'NotAllowedError') {
          console.error("Video play failed:", err);
        }
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
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
      >
        <source src={slide.data?.mp4Url} type="video/mp4" />
      </video>

      <VideoInfo
        user={slide.username}
        description={slide.data?.description || 'No description available.'}
      />

      {isActive && (
        <>
          <button
            onClick={toggleMute}
            className="absolute top-16 right-4 bg-black/50 p-2 rounded-full text-white z-10"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>

          <Sidebar
            avatarUrl={slide.avatar}
            initialLikes={slide.initialLikes}
            isLiked={slide.isLiked}
            slideId={slide.id}
            commentsCount={slide.initialComments}
            x={slide.x}
          />
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
