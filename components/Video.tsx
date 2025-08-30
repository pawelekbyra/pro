"use client";

import React, { useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useVideoPlayback } from '@/lib/useVideoPlayback';
import VideoPlayer from './VideoPlayer';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import VideoInfo from './VideoInfo';
import TopBar from './TopBar';
import { Lock } from 'lucide-react';

// This type should align with what the API returns for a single video
export type VideoData = {
  id: string;
  username: string;
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

interface VideoProps {
  video: VideoData;
  isActive: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  openAccountPanel: () => void;
  openCommentsModal: () => void;
  openInfoModal: () => void;
  onTimeUpdate: (videoId: string, time: number) => void;
  startTime: number;
  onPlaybackFailure: () => void;
}

const Video: React.FC<VideoProps> = ({ video, isActive, setIsModalOpen, openAccountPanel, openCommentsModal, openInfoModal, onTimeUpdate, startTime, onPlaybackFailure }) => {
  const { isLoggedIn, isLoading } = useUser();

  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPlaying } = useVideoPlayback(videoRef);

  const isSecret = video.access === 'secret';
  // Don't show the overlay while the user state is loading
  const showSecretOverlay = isSecret && !isLoading && !isLoggedIn;

  return (
    <div className="webyx-section h-full w-full relative overflow-hidden">
      <div
        className={`tiktok-symulacja h-full w-full relative ${isLoggedIn ? 'is-logged-in' : ''}`}
        style={{ paddingBottom: 'var(--safe-area-bottom)' }}
      >
        <VideoPlayer
          hlsSrc={video.hlsUrl}
          mp4Src={video.mp4Url}
          poster={video.poster}
          videoRef={videoRef}
          isActive={isActive && !showSecretOverlay}
          isSecretActive={showSecretOverlay}
          videoId={video.id} // Pass videoId instead of likeId
          onTimeUpdate={onTimeUpdate}
          startTime={startTime}
          onPlaybackFailure={onPlaybackFailure}
          isPlaying={isPlaying}
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
          avatarUrl={video.avatar}
          initialLikes={video.initialLikes}
          isLiked={video.isLiked}
          videoId={video.id} // Pass videoId instead of likeId
          commentsCount={video.initialComments}
          openCommentsModal={openCommentsModal}
          openAccountPanel={openAccountPanel}
          openInfoModal={openInfoModal}
        />
        <VideoInfo user={video.username} description={video.description} />
        <BottomBar videoRef={videoRef} isActive={isActive && !showSecretOverlay} />
      </div>
    </div>
  );
};

export default Video;
