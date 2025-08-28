"use client";

import React, { useState, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import VideoPlayer from './VideoPlayer';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import TopBar from './TopBar';
import { Lock, Heart } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useTranslation } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export type SlideData = {
  id: string;
  likeId: string;
  user: string;
  description: string;
  mp4Url: string;
  hlsUrl: string | null;
  poster: string;
  avatar: string;
  access: 'public' | 'secret';
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;
};

interface SlideProps {
  slide: SlideData;
  isActive: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  openAccountPanel: () => void;
  openCommentsModal: () => void;
  openInfoModal: () => void;
}

const Slide: React.FC<SlideProps> = ({ slide, isActive, setIsModalOpen, openAccountPanel, openCommentsModal, openInfoModal }) => {
  const { isLoggedIn, isLoading } = useUser();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [isLiked, setIsLiked] = useState(slide.isLiked);
  const [likesCount, setLikesCount] = useState(slide.initialLikes);
  const [showHeart, setShowHeart] = useState(false);

  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    if (seekTime !== null) {
      setSeekTime(null);
    }
  };

  const handleLoadedMetadata = (dur: number) => {
    setDuration(dur);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setSeekTime(time);
  };

  const handleLike = async () => {
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    if (newIsLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }

    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likeId: slide.likeId }),
      });
      if (!response.ok) throw new Error('Failed to like post');
      addToast(newIsLiked ? t('likeSuccess') : t('likeUndo'), 'success');
    } catch (error) {
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      addToast(t('networkError'), 'error');
    }
  };

  const handleVideoAreaClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleLike();
    } else {
      clickTimeout.current = setTimeout(() => {
        setIsPlaying(prev => !prev);
        clickTimeout.current = null;
      }, 250);
    }
  };

  const isSecret = slide.access === 'secret';
  const showSecretOverlay = isSecret && !isLoading && !isLoggedIn;

  return (
    <div className="webyx-section h-full w-full relative overflow-hidden">
      <div className={`tiktok-symulacja h-full w-full relative ${isLoggedIn ? 'is-logged-in' : ''}`}>
        <div className="absolute inset-0 z-10" onClick={handleVideoAreaClick} />

        <AnimatePresence>
          {showHeart && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Heart className="w-24 h-24 text-white fill-white" />
            </motion.div>
          )}
        </AnimatePresence>

        <VideoPlayer
          hlsSrc={slide.hlsUrl}
          mp4Src={slide.mp4Url}
          poster={slide.poster}
          isActive={isActive && !showSecretOverlay && isPlaying}
          isSecretActive={showSecretOverlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          seekTime={seekTime}
        />

        {showSecretOverlay && (
          <div className="secret-overlay visible">
            <Lock className="secret-icon" size={64} />
            <h2 className="secret-title">Top Secret</h2>
            <p className="secret-subtitle">Log in to unlock</p>
          </div>
        )}

        <TopBar
          setIsModalOpen={setIsModalOpen}
          openAccountPanel={openAccountPanel}
        />
        <Sidebar
          avatarUrl={slide.avatar}
          likesCount={likesCount}
          isLiked={isLiked}
          handleLike={handleLike}
          commentsCount={slide.initialComments}
          openCommentsModal={openCommentsModal}
          openInfoModal={openInfoModal}
        />
        <BottomBar
          user={slide.user}
          description={slide.description}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
};

export default Slide;
