"use client";

import React, { useMemo } from 'react';
import { HtmlSlideData } from '@/lib/types';
import DOMPurify from 'dompurify';
import VideoInfo from './VideoInfo';
import PopeGame from './PopeGame';
import TypingChallenge from './TypingChallenge';

interface HtmlContentProps {
  data: HtmlSlideData;
  username: string;
}

const HtmlContent: React.FC<HtmlContentProps> = ({ data, username }) => {
  switch (data.type) {
    case 'GAME_POPE':
      return <PopeGame gameData={data.gameData} />;
    case 'TYPING_CHALLENGE':
      return <TypingChallenge challengeData={data.challengeData} />;
    default: {
      const sanitizedHtml = useMemo(() => {
        // Check if running in a browser environment before using DOMPurify
        if (typeof window !== 'undefined' && data.htmlContent) {
          return DOMPurify.sanitize(data.htmlContent);
        }
        return ''; // Return empty string for server-side rendering or if htmlContent is not available
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
    }
  }
};

export default HtmlContent;
