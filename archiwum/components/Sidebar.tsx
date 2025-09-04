import React, { memo } from 'react';
import { Heart, MessageSquare, Rat, FileQuestion, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import { formatCount } from '@/lib/utils';
import { shallow } from 'zustand/shallow';

interface SidebarProps {
  initialLikes: number;
  initialIsLiked: boolean;
  slideId: string;
  commentsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  initialLikes,
  initialIsLiked,
  slideId,
  commentsCount,
}) => {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const {
    isLoggedIn,
    setActiveModal,
    toggleLike,
    likeChanges
  } = useStore(state => ({
    isLoggedIn: state.isLoggedIn,
    setActiveModal: state.setActiveModal,
    toggleLike: state.toggleLike,
    likeChanges: state.likeChanges,
  }), shallow);

  const likeState = likeChanges[slideId];
  const currentLikes = likeState ? likeState.likes : initialLikes;
  const isLiked = likeState ? likeState.isLiked : initialIsLiked;

  const handleLike = () => {
    if (!isLoggedIn) {
      setActiveModal('login');
      return;
    }
    toggleLike(slideId, initialLikes, initialIsLiked);
    addToast(isLiked ? (t('unlikedToast') || 'Unliked') : (t('likedToast') || 'Liked!'), 'success');
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
        <button onClick={() => setActiveModal('account')} className="w-full h-full flex items-center justify-center text-white">
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

      <motion.button
        onClick={handleLike}
        className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold"
        data-slide-id={slideId}
        whileTap={{ scale: 0.9 }}
      >
        <Heart
          size={32}
          strokeWidth={1.4}
          className={`transition-colors duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className="icon-label">{formatCount(currentLikes)}</span>
      </motion.button>

      <motion.button
        data-testid="comments-button"
        onClick={() => setActiveModal('comments')}
        className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold"
        whileTap={{ scale: 0.9 }}
      >
        <MessageSquare size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{formatCount(commentsCount)}</span>
      </motion.button>

      <button onClick={handleShare} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Share size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{t('shareText') || 'Share'}</span>
      </button>

      <button onClick={() => setActiveModal('info')} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold mt-4">
        <FileQuestion size={32} strokeWidth={1.4} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">WTF?!</span>
      </button>
    </aside>
  );
};

export default memo(Sidebar);
