"use client";

import React, { useMemo } from 'react';
import { HtmlSlideData } from '@/lib/types';
import DOMPurify from 'dompurify';

interface HtmlContentProps {
  data: HtmlSlideData;
  username: string;
  onNavigate: (coordinates: { x: number; y: number }) => void;
  isActive: boolean;
}

const HtmlContent: React.FC<HtmlContentProps> = ({ data, isActive }) => {
  const sanitizedHtml = useMemo(() => {
    // Check if running in a browser environment before using DOMPurify
    if (typeof window !== 'undefined' && data.htmlContent) {
      return DOMPurify.sanitize(data.htmlContent);
    }
    return ''; // Return empty string for server-side rendering or if htmlContent is not available
  }, [data.htmlContent]);

  return (
    <div className="h-full w-full relative bg-black overflow-y-auto">
      <div
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

export default HtmlContent;
