"use client";

import React, { useMemo } from 'react';
import { HtmlSlideData } from '@/lib/types';
import DOMPurify from 'dompurify';
interface HtmlContentProps {
  data: HtmlSlideData;
  isActive: boolean;
}

const HtmlContent: React.FC<HtmlContentProps> = ({
  data,
  isActive,
}) => {
  const sanitizedHtml = useMemo(() => {
    if (typeof window !== 'undefined' && data.htmlContent) {
      return DOMPurify.sanitize(data.htmlContent);
    }
    return '';
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
