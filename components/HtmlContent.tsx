"use client";

import React, { useMemo } from 'react';
import { HtmlSlideData } from '@/lib/types';
import DOMPurify from 'dompurify';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';

interface HtmlContentProps {
  data: HtmlSlideData;
  username: string;
  onNavigate: (coordinates: { x: number; y: number }) => void;
  isActive: boolean;
  avatarUrl: string;
  initialLikes: number;
  isLiked: boolean;
  slideId: string;
  commentsCount: number;
  x: number;
  y: number;
}

const HtmlContent: React.FC<HtmlContentProps> = ({
  data,
  username,
  isActive,
  avatarUrl,
  initialLikes,
  isLiked,
  slideId,
  commentsCount,
  x,
  y,
}) => {
  const sanitizedHtml = useMemo(() => {
    if (typeof window !== 'undefined' && data.htmlContent) {
      return DOMPurify.sanitize(data.htmlContent);
    }
    return '';
  }, [data.htmlContent]);

  const shouldShowSidebar = y === 0 || y === 2;
  const shouldShowBottomBar = x === 0 && y === 0;

  return (
    <div className="h-full w-full relative bg-black overflow-y-auto">
      <div
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
      {shouldShowSidebar && (
        <Sidebar
          avatarUrl={avatarUrl}
          initialLikes={initialLikes}
          isLiked={isLiked}
          slideId={slideId}
          commentsCount={commentsCount}
          x={x}
        />
      )}
      {shouldShowBottomBar && (
        <BottomBar
          videoRef={null}
          isActive={isActive}
        />
      )}
    </div>
  );
};

export default HtmlContent;
