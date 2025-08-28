"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Info, Languages, Coffee } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';

interface SidebarProps {
  avatarUrl: string;
  initialLikes: number;
  isLiked: boolean;
  likeId: string;
  commentsCount: number;
  openCommentsModal: () => void;
  openInfoModal: () => void;
  openAccountPanel: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  avatarUrl,
  initialLikes,
  isLiked: initialIsLiked,
  likeId,
  commentsCount,
  openCommentsModal,
  openInfoModal,
  openAccountPanel,
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
        body: JSON.stringify({ likeId }),
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

  const handleShowTipJar = () => {
    // This assumes a global function or an element with this ID exists, as per the prototype
    const bmcButton = document.querySelector('#bmc-wbtn') as HTMLElement;
    if (bmcButton) {
      bmcButton.click();
    } else {
      addToast('BuyMeACoffee widget not found.', 'error');
    }
  }

  return (
    <aside
      className="absolute right-0 flex flex-col items-center gap-2 z-20"
      style={{
        top: 'calc((var(--app-height) - var(--topbar-height) - var(--bottombar-height)) / 2 + var(--topbar-height))',
        transform: 'translateY(-50%)',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
      }}
    >
      <div className="relative w-12 h-12 mb-1.5">
        <button onClick={openAccountPanel} className="w-full h-full">
          <Image src={avatarUrl} alt="User avatar" width={48} height={48} className="w-full h-full rounded-full border-2 border-white object-cover" />
        </button>
        {!isLoggedIn && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white pointer-events-none"
            style={{ backgroundColor: 'var(--accent-color)'}}
          >
            +
          </div>
        )}
      </div>

      <button onClick={handleLike} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Heart
          size={32}
          className={`transition-colors duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className="icon-label">{formatCount(likesCount)}</span>
      </button>

      <button onClick={openCommentsModal} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <MessageCircle size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{formatCount(commentsCount)}</span>
      </button>

      <button onClick={handleShare} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Share2 size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('shareText') || 'Share'}</span>
      </button>

      <button onClick={openInfoModal} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Info size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('infoText') || 'Info'}</span>
      </button>

      <button onClick={toggleLanguage} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Languages size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{lang.toUpperCase()}</span>
      </button>

      <button onClick={handleShowTipJar} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Coffee size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('tipText') || 'Tip'}</span>
      </button>
    </aside>
  );
};

export default Sidebar;
