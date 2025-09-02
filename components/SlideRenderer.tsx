// components/SlideRenderer.tsx
"use client";

import React, { useEffect } from 'react';
import { Slide, VideoSlide, HtmlSlide } from '@/lib/types';
import HtmlContent from './HtmlContent';
import VideoPlayer from './VideoPlayer';
import { useVideoGrid } from '@/context/VideoGridContext';
import { Skeleton } from './ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideRendererProps {
  slide: Slide;
  isActive: boolean;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, isActive }) => {
  const { fetchFullSlide } = useVideoGrid();

  useEffect(() => {
    // If the slide is visible but doesn't have its full data, fetch it.
    if (slide.id && !slide.data) {
      fetchFullSlide(slide.id);
    }
  }, [slide.id, slide.data, fetchFullSlide]);

  const renderContent = () => {
    switch (slide.type) {
      case 'video':
        return <VideoPlayer slide={slide as VideoSlide} isActive={isActive} />;
      case 'html':
        const htmlSlide = slide as HtmlSlide;
        return (
          <HtmlContent
            data={htmlSlide.data!}
            username={htmlSlide.username}
            onNavigate={() => {}}
            isActive={isActive}
            avatarUrl={htmlSlide.avatar}
            initialLikes={htmlSlide.initialLikes}
            isLiked={htmlSlide.isLiked}
            slideId={htmlSlide.id}
            commentsCount={htmlSlide.initialComments}
            x={htmlSlide.x}
            y={htmlSlide.y}
          />
        );
      default:
        return (
            <div className="h-full w-full flex items-center justify-center bg-red-900 text-white">
                Unsupported slide type: {(slide as any).type}
            </div>
        );
    }
  };

  return (
    <div className="h-full w-full bg-black">
      <AnimatePresence>
        {!slide.data && (
          <motion.div
            key="skeleton"
            className="absolute inset-0 z-10"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Skeleton className="h-full w-full bg-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {slide.data && (
          <motion.div
            key="content"
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SlideRenderer;