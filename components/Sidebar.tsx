"use client";

import React, { useState } from 'react';
import { Heart, MessageSquare, Rat, FileQuestion } from 'lucide-react';
import { PiShareFat } from 'react-icons/pi';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';

interface SidebarProps {
  avatarUrl:string;
  initialLikes: number;
  isLiked: boolean;
  videoId: string;
  commentsCount: number;
  openCommentsModal: () => void;
  openAccountPanel: () => void;
  openInfoModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  avatarUrl,
  initialLikes,
  isLiked: initialIsLiked,
  videoId,
  commentsCount,
  openCommentsModal,
  openAccountPanel,
  openInfoModal,
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const { addToast } = useToast();
  const { isLoggedIn } = useUser();
  const { t, lang, toggleLanguage } = useTranslation();

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(count);
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      addToast(t('likeAlert') || 'Log in to like.', 'error');
      return;
    }
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      if (!response.ok) throw new Error('Failed to like post');
      addToast(newIsLiked ? (t('likedToast') || 'Liked!') : (t('unlikedToast') || 'Unliked'), 'success');
    } catch (error) {
      console.error(error);
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      addToast(t('likeError') || 'Network error, please try again', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('shareTitle') || 'Check out this video!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast(t('linkCopied') || 'Link copied to clipboard!', 'success');
    }
  };

  return (
    <aside
      className="absolute right-0 flex flex-col items-center gap-[6px] z-20"
      style={{
        top: 'calc((var(--app-height) - var(--topbar-height) - var(--bottombar-height)) / 2 + var(--topbar-height))',
        transform: 'translateY(-50%)',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
      }}
    >
      <div className="relative w-12 h-12 mb-1.5">
        <button onClick={openAccountPanel} className="w-full h-full flex items-center justify-center text-white">
          <Rat size={48} strokeWidth={1.4} />
        </button>
        {!isLoggedIn && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white pointer-events-none"
            style={{ backgroundColor: 'hsl(var(--primary))'}}
          >
            +
          </div>
        )}
      </div>

      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold"
        data-video-id={videoId}
      >
        <Heart
          size={32}
          strokeWidth={1.4}
          className={`transition-colors duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className="icon-label">{formatCount(likesCount)}</span>
      </button>

      <button onClick={openCommentsModal} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <MessageSquare size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{formatCount(commentsCount)}</span>
      </button>

      <button onClick={handleShare} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <PiShareFat size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('shareText') || 'Share'}</span>
      </button>

      <button onClick={openInfoModal} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold mt-4">
        <FileQuestion size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">WTF?!</span>
      </button>
    </aside>
  );
};

export default Sidebar;
