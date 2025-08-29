"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VideoInfoProps {
  user: string;
  description: string;
}

const VideoInfo: React.FC<VideoInfoProps> = ({ user, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Checks if the description is longer than two lines.
  useEffect(() => {
    const checkClamp = () => {
      if (descriptionRef.current) {
        // Make sure the element has its styles defined already
        const lineHeight = parseFloat(window.getComputedStyle(descriptionRef.current).lineHeight) || 20;
        // Check if the content height is greater than 2.5 lines to account for potential margins and paddings.
        setIsClamped(descriptionRef.current.scrollHeight > lineHeight * 2.5);
      }
    };
    checkClamp();
    window.addEventListener('resize', checkClamp);
    return () => window.removeEventListener('resize', checkClamp);
  }, [description]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const handleCollapse = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  const widthClass = isExpanded
    ? 'right-3' // Expanded description takes up almost the entire width
    : (isClamped ? 'right-[var(--sidebar-width)]' : 'right-3'); // Collapsed description adjusts dynamically

  return (
    <>
      {/* Transparent overlay to close the description when clicking outside of it */}
      {isExpanded && <div className="fixed inset-0 z-[106]" onClick={handleCollapse} />}

      <div
        className={`absolute bottom-[var(--bottombar-base-height)] left-0 z-[107] text-white p-3 cursor-pointer ${widthClass}`}
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
        onClick={isClamped && !isExpanded ? toggleExpand : undefined}
      >
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[40vh] overflow-y-auto cursor-default' : 'max-h-[80px] overflow-hidden'}`}>
            <h3 className="text-base font-bold leading-tight mb-1">@{user}</h3>
            <p
              ref={descriptionRef}
              className={`text-sm leading-snug whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}
            >
              {description}
            </p>
        </div>

        {isClamped && (
            <button
              onClick={toggleExpand}
              className="absolute right-4 bottom-4 flex-shrink-0 text-white font-semibold text-sm transition-transform duration-300 ease-in-out"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronUp size={20} />
            </button>
        )}
      </div>
    </>
  );
};

export default VideoInfo;
