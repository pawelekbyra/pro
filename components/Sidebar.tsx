"use client";

import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Info, Languages, Coffee } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useTranslation } from '@/context/LanguageContext';

interface SidebarProps {
  avatarUrl: string;
  likesCount: number;
  isLiked: boolean;
  handleLike: () => void;
  commentsCount: number;
  openCommentsModal: () => void;
  openInfoModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ avatarUrl, likesCount, isLiked, handleLike, commentsCount, openCommentsModal, openInfoModal }) => {
  const { t, toggleLanguage } = useTranslation();
  const { addToast } = useToast();

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(count);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => addToast(t('linkCopied'), 'success'))
      .catch(() => addToast(t('linkCopyError'), 'error'));
  };

  const handleInfo = () => openInfoModal();
  const handleLanguage = () => toggleLanguage();
  const handleTip = () => addToast(t('tipThanks'), 'success');

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
        <button className="w-full h-full" aria-label={t('userAvatar')}>
          <Image src={avatarUrl} alt={t('userAvatar')} className="rounded-full border-2 border-white object-cover" width={48} height={48} />
        </button>
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white"
          style={{ backgroundColor: 'var(--accent-color)'}}
        >
          +
        </div>
      </div>

      <button onClick={handleLike} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold" aria-label={t('like')}>
        <Heart
          size={32}
          className={`transition-colors duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className="icon-label">{formatCount(likesCount)}</span>
      </button>

      <button onClick={openCommentsModal} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold" aria-label={t('comment')}>
        <MessageCircle size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{formatCount(commentsCount)}</span>
      </button>

      <button onClick={handleShare} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold" aria-label={t('share')}>
        <Share2 size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('share')}</span>
      </button>

      <button onClick={handleInfo} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold" aria-label={t('info')}>
        <Info size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('info')}</span>
      </button>

      <button onClick={handleLanguage} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold" aria-label={t('toggleLanguage')}>
        <Languages size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('language')}</span>
      </button>

      <button onClick={handleTip} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold" aria-label={t('tip')}>
        <Coffee size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('tip')}</span>
      </button>
    </aside>
  );
};

export default Sidebar;
