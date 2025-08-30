"use client";

import React from 'react';
import { Slide } from '@/lib/types';
import Video from './Video';
import HtmlContent from './HtmlContent';
import FlappyDivGame from './FlappyDivGame';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// This is a generic type for props that are passed down to all slide types
// We can extend it if some slides need more common props.
interface CommonSlideProps {
  isActive: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  openAccountPanel: () => void;
  openCommentsModal: () => void;
  openInfoModal: () => void;
  onTimeUpdate: (videoId: string, time: number) => void;
  startTime: number;
  onPlaybackFailure: () => void;
  onNavigate: (coordinates: { x: number; y: number }) => void;
}

interface SlideRendererProps extends CommonSlideProps {
  slide: Slide;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, ...commonProps }) => {
  const renderSlideContent = () => {
    switch (slide.type) {
      case 'video':
        // We need to adapt the Video component to accept the new data structure
        // For now, we pass the props it expects.
        const videoDataForComponent = {
            id: slide.id,
            username: slide.username,
            description: slide.data.description,
            mp4Url: slide.data.mp4Url,
            hlsUrl: slide.data.hlsUrl,
            poster: slide.data.poster,
            avatar: slide.avatar,
            access: slide.access,
            initialLikes: slide.initialLikes,
            isLiked: slide.isLiked,
            initialComments: slide.initialComments,
        };
        return <Video video={videoDataForComponent} {...commonProps} />;
      case 'html':
        return <HtmlContent data={slide.data} username={slide.username} onNavigate={commonProps.onNavigate} />;
      case 'game':
        return <FlappyDivGame slide={slide} />;
      default:
        // You can return a default component or null if the type is unknown
        return <div className="text-white">Unsupported slide type</div>;
    }
  };

  const containerClass = slide.type === 'html' ? 'overflow-y-auto' : 'overflow-hidden';

  return (
    <div className={`webyx-section h-full w-full relative ${containerClass}`}>
        <div
            className={`tiktok-symulacja h-full w-full relative`}
            style={{ paddingBottom: 'var(--safe-area-bottom)' }}
        >
            {renderSlideContent()}

            {/* Common UI elements for all slide types */}
            <TopBar
                setIsModalOpen={commonProps.setIsModalOpen}
                openAccountPanel={commonProps.openAccountPanel}
            />
            <Sidebar
                avatarUrl={slide.avatar}
                initialLikes={slide.initialLikes}
                isLiked={slide.isLiked}
                videoId={slide.id}
                commentsCount={slide.initialComments}
                openCommentsModal={commonProps.openCommentsModal}
                openAccountPanel={commonProps.openAccountPanel}
                openInfoModal={commonProps.openInfoModal}
            />
        </div>
    </div>
  );
};

export default SlideRenderer;