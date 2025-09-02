"use client";

import React, { useState, useEffect } from 'react';
import { VideoSlide } from '@/lib/types';
import { useVideoGrid } from '@/context/VideoGridContext';
import { Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import Sidebar from './Sidebar';
import VideoInfo from './VideoInfo';
import BottomBar from './BottomBar';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  slide: VideoSlide;
  isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slide, isActive }) => {
  const { state, setSoundActiveSlide, activeVideoRef } = useVideoGrid();
  const { soundActiveSlideId } = state;
  const isMuted = soundActiveSlideId !== slide.id;
  const [areBarsVisible, setAreBarsVisible] = useState(true);

  useEffect(() => {
    if (isActive) {
      setAreBarsVisible(true);
    }
  }, [isActive]);

  const toggleMute = () => {
    if (isMuted) {
      setSoundActiveSlide(slide.id);
    } else {
      setSoundActiveSlide(null);
    }
  };

  // This component now only renders the UI overlay.
  // The actual video is handled by GlobalVideoPlayer.
  // We render nothing if the slide is not active to avoid layering multiple UI's.
  if (!isActive) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
      {/* The background is now transparent as the video is playing underneath from GlobalVideoPlayer */}

      <VideoInfo
        user={slide.username}
        description={slide.data?.description || 'No description available.'}
      />

      <AnimatePresence>
        {areBarsVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
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
              {/* BottomBar now gets the ref from the context */}
              <BottomBar videoRef={activeVideoRef} isActive={isActive} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <>
        <button
          onClick={toggleMute}
          className="absolute top-16 right-4 bg-black/50 p-2 rounded-full text-white z-20"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        <motion.button
          onClick={() => setAreBarsVisible(!areBarsVisible)}
          className="absolute bottom-24 left-4 bg-transparent text-white z-20 p-2 rounded-full bg-black/50"
          aria-label="Toggle UI visibility"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: areBarsVisible ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          {areBarsVisible ? <Eye size={24} /> : <EyeOff size={24} />}
        </motion.button>
      </>
    </div>
  );
};

export default VideoPlayer;
