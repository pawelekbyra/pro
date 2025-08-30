"use client";

import React, { useMemo } from 'react';
import { HtmlSlideData } from '@/lib/types';
import DOMPurify from 'dompurify';
import VideoInfo from './VideoInfo';
import PopeGame from './PopeGame';
import TypingChallenge from './TypingChallenge';
import Quiz from './Quiz';
import CompanyPitch from './CompanyPitch';
import DataViz from './DataViz';
import Parallax from './Parallax';

interface HtmlContentProps {
  data: HtmlSlideData;
  username: string;
  onNavigate: (coordinates: { x: number; y: number }) => void;
}

const HtmlContent: React.FC<HtmlContentProps> = ({ data, username, onNavigate }) => {
  const sanitizedHtml = useMemo(() => {
    // Check if running in a browser environment before using DOMPurify
    if (typeof window !== 'undefined' && data.htmlContent) {
      return DOMPurify.sanitize(data.htmlContent);
    }
    return ''; // Return empty string for server-side rendering or if htmlContent is not available
  }, [data.htmlContent]);

  switch (data.type) {
    case 'GAME_POPE':
      return <PopeGame gameData={data.gameData} />;
    case 'TYPING_CHALLENGE':
      return <TypingChallenge challengeData={data.challengeData} onChallengeComplete={() => onNavigate({ x: 0, y: 1})} />; // Example navigation
    case 'QUIZ':
      return <Quiz quizData={data.quizData} onNavigate={onNavigate} />;
    case 'COMPANY_PITCH':
      return <CompanyPitch />;
    case 'DATA_VIZ':
      return <DataViz videoUrl={data.videoUrl} posterUrl={data.posterUrl} />;
    case 'PARALLAX':
        return <Parallax videoUrl={data.videoUrl} posterUrl={data.posterUrl} />;
    default: {
      return (
        <div className="h-full w-full relative bg-black overflow-y-auto">
          <div
            className="p-4 text-white"
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
