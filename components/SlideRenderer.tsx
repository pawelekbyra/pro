// components/SlideRenderer.tsx
"use client";

import React from 'react';
import { Slide } from '@/lib/types';
import HtmlContent from './HtmlContent';

interface SlideRendererProps {
  slide: Slide;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide }) => {
  return (
    <div className="h-full w-full">
      <HtmlContent data={slide.data} username={slide.username} onNavigate={() => {}} />
    </div>
  );
};

export default SlideRenderer;