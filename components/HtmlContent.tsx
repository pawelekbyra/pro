"use client";

import React, { useMemo } from 'react';
import { HtmlSlideData } from '@/lib/types';
import DOMPurify from 'dompurify';
import VideoInfo from './VideoInfo';

interface HtmlContentProps {
  data: HtmlSlideData;
  username: string;
}

const HtmlContent: React.FC<HtmlContentProps> = ({ data, username }) => {
  const sanitizedHtml = useMemo(() => {
    // Check if running in a browser environment before using DOMPurify
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(data.htmlContent);
    }
    return ''; // Return empty string for server-side rendering
  }, [data.htmlContent]);

  return (
    <div className="h-full w-full relative bg-black">
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
      {data.description && (
        <div className="absolute bottom-20 left-2 right-2">
           <VideoInfo user={username} description={data.description} />
        </div>
      )}
    </div>
  );
};

export default HtmlContent;
