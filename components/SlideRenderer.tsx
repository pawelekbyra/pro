// components/SlideRenderer.tsx
"use client";

import React, { useEffect } from 'react';
import { Slide, VideoSlide, HtmlSlide } from '@/lib/types';
import HtmlContent from './HtmlContent';
import VideoPlayer from './VideoPlayer';
import { useVideoGrid } from '@/context/VideoGridContext';
import { Skeleton } from './ui/skeleton';

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

  if (!slide.data) {
    // Render a loading skeleton while the full slide data is being fetched.
    return <Skeleton className="h-full w-full bg-zinc-900" />;
  }

  const renderContent = () => {
    switch (slide.type) {
      case 'video':
        // The `as` cast is safe here because we would have a type error
        // if the data didn't match the `VideoSlide` interface.
        return <VideoPlayer slide={slide as VideoSlide} isActive={isActive} />;
      case 'html':
        // The non-null assertion `!` is safe due to the check above.
        return <HtmlContent data={(slide as HtmlSlide).data!} username={slide.username} onNavigate={() => {}} isActive={isActive} />;
      default:
        return (
            <div className="h-full w-full flex items-center justify-center bg-red-900 text-white">
                Unsupported slide type: {(slide as any).type}
            </div>
        );
    }
  };

  return (
    <div className="h-full w-full">
      {renderContent()}
    </div>
  );
};

export default SlideRenderer;