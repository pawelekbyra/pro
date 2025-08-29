"use client";

import React, { useRef } from 'react';
import { useUser } from '@/context/UserContext';
import VideoPlayer from './VideoPlayer';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import VideoInfo from './VideoInfo';
import TopBar from './TopBar';
import { Lock } from 'lucide-react';

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

  const videoRef = useRef<HTMLVideoElement>(null);

  const isSecret = slide.access === 'secret';
  // Don't show the overlay while the user state is loading
  const showSecretOverlay = isSecret && !isLoading && !isLoggedIn;

  return (
    <div className="webyx-section h-full w-full relative overflow-hidden">
      <div
        className={`tiktok-symulacja h-full w-full relative ${isLoggedIn ? 'is-logged-in' : ''}`}
        style={{ paddingBottom: 'var(--safe-area-bottom)' }}
      >
        <VideoPlayer
          hlsSrc={slide.hlsUrl}
          mp4Src={slide.mp4Url}
          poster={slide.poster}
          videoRef={videoRef}
          isActive={isActive && !showSecretOverlay}
          isSecretActive={showSecretOverlay}
          likeId={slide.likeId}
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
          initialLikes={slide.initialLikes}
          isLiked={slide.isLiked}
          likeId={slide.likeId}
          commentsCount={slide.initialComments}
          openCommentsModal={openCommentsModal}
          openAccountPanel={openAccountPanel}
          openInfoModal={openInfoModal}
        />
        <VideoInfo user={slide.user} description={slide.description} />
        <BottomBar videoRef={videoRef} isActive={isActive && !showSecretOverlay} />
      </div>
    </div>
  );
};

export default Slide;
