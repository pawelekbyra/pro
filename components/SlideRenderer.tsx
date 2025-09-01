// components/SlideRenderer.tsx
"use client";

import React from 'react';
import { Slide } from '@/lib/types';
import HtmlContent from './HtmlContent';

interface SlideRendererProps {
  slide: Slide;
  isActive: boolean;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, isActive }) => {
  return (
    <div className="h-full w-full">
      <HtmlContent data={slide.data} username={slide.username} onNavigate={() => {}} isActive={isActive} />
    </div>
  );
};

export default SlideRenderer;