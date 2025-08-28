"use client";

import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
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
  openAccountPanel: () => void; // Add this prop
}

const Slide: React.FC<SlideProps> = ({ slide, isActive, setIsModalOpen, openAccountPanel }) => {
  // Mock login state for now, will be replaced with global state
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to true to test the menu

  const isSecret = slide.access === 'secret';
  const showSecretOverlay = isSecret && !isLoggedIn;

  return (
    <div className="webyx-section h-full w-full relative overflow-hidden">
      <div className={`tiktok-symulacja h-full w-full relative ${isLoggedIn ? 'is-logged-in' : ''}`}>
        <VideoPlayer
          hlsSrc={slide.hlsUrl}
          mp4Src={slide.mp4Url}
          poster={slide.poster}
          isActive={isActive && !showSecretOverlay}
          isSecretActive={showSecretOverlay}
        />

        {showSecretOverlay && (
          <div className="secret-overlay visible">
            <Lock className="secret-icon" size={64} />
            <h2 className="secret-title">Top Secret</h2>
            <p className="secret-subtitle">Log in to unlock</p>
          </div>
        )}

        <TopBar
          isLoggedIn={isLoggedIn}
          setIsModalOpen={setIsModalOpen}
          openAccountPanel={openAccountPanel} // Pass it down
        />
        <Sidebar
          avatarUrl={slide.avatar}
          initialLikes={slide.initialLikes}
          isLiked={slide.isLiked}
          likeId={slide.likeId}
          commentsCount={slide.initialComments}
        />
        <BottomBar user={slide.user} description={slide.description} />
      </div>
    </div>
  );
};

export default Slide;
