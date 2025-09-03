// app/page.tsx
"use client";

import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { AnimatePresence } from 'framer-motion';
import GlobalVideoPlayer from '@/components/GlobalVideoPlayer';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const {
    state: { activeSlideData, activeModal, isLoading },
    setActiveModal,
  } = useVideoGrid();

  return (
    <>
      <GlobalVideoPlayer />
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center text-white">
            Loading...
          </div>
        )}
        {activeSlideData && !isLoading && (
          <SlideRenderer slide={activeSlideData} isActive={true} />
        )}
      </div>
      <AnimatePresence>
        {activeModal === 'account' && <AccountPanel onClose={() => setActiveModal(null)} />}
        {activeModal === 'comments' && activeSlideData && (
          <CommentsModal
            isOpen={activeModal === 'comments'}
            slideId={activeSlideData.id}
            initialCommentsCount={activeSlideData.initialComments}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'info' && <InfoModal isOpen={activeModal === 'info'} onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
      {activeSlideData && (
        <Sidebar
          avatar={activeSlideData.avatar}
          initialLikes={activeSlideData.initialLikes}
          isLiked={activeSlideData.isLiked}
          slideId={activeSlideData.id}
          commentsCount={activeSlideData.initialComments}
          x={activeSlideData.x}
        />
      )}
    </>
  );
}