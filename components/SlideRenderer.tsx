// components/SlideRenderer.tsx
"use client";

import React from 'react';
import { Slide, VideoSlide, HtmlSlide } from '@/lib/types';
import HtmlContent from './HtmlContent';
import VideoPlayer from './VideoPlayer';
import { Skeleton } from './ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideRendererProps {
  slide: Slide;
  isActive: boolean;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, isActive }) => {
  // Data fetching is now handled by the VideoGridContext, making this component purely presentational.

  const renderContent = () => {
    // This function will only be called when slide.data is available.
    switch (slide.type) {
      case 'video':
        // VideoPlayer is now a UI-only component. The actual video playback
        // is managed by the GlobalVideoPlayer, driven by the context.
        return <VideoPlayer slide={slide as VideoSlide} isActive={isActive} />;
      case 'html':
        const htmlSlide = slide as HtmlSlide;
        return (
          <HtmlContent
            data={htmlSlide.data!}
            isActive={isActive}
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
      <AnimatePresence mode="wait">
        {!slide.data ? (
          <motion.div
            key="skeleton"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Skeleton className="h-full w-full bg-zinc-900" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SlideRenderer;