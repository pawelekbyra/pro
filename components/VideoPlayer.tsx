"use client";

import React from 'react';
import { VideoSlide } from '@/lib/types';
import VideoInfo from './VideoInfo';

interface VideoPlayerProps {
  slide: VideoSlide;
  isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slide, isActive }) => {
  // This component is now a simple UI overlay.
  if (!isActive) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
      <VideoInfo
        user={slide.username}
        description={slide.data?.description || 'No description available.'}
      />
    </div>
  );
};

export default VideoPlayer;
