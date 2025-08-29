"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface VideoInfoProps {
  user: string;
  description: string;
}

const VideoInfo: React.FC<VideoInfoProps> = ({ user, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // This effect checks if the description text is taller than the space available
  // for two lines, and if so, sets the state to show the "more" button.
  useEffect(() => {
    const checkClamp = () => {
      if (descriptionRef.current) {
        // Temporarily remove line-clamp to measure full height
        descriptionRef.current.classList.remove('line-clamp-2');
        const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
        setIsClamped(descriptionRef.current.scrollHeight > 80); // Heuristic check, adjust as needed
        // Re-apply line-clamp
        if (!isExpanded) {
            descriptionRef.current.classList.add('line-clamp-2');
        }
      }
    };

    const checkInitialClamp = () => {
        if (descriptionRef.current) {
            const lineHeight = parseInt(window.getComputedStyle(descriptionRef.current).lineHeight, 10);
            const isOverflowing = descriptionRef.current.scrollHeight > lineHeight * 2;
            setIsClamped(isOverflowing);
        }
    }

    // A slight delay is needed to ensure correct measurement after render
    const timeoutId = setTimeout(checkInitialClamp, 100);

    window.addEventListener('resize', checkInitialClamp);
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', checkInitialClamp);
    }
  }, [description, isExpanded]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from propagating to parent elements
    setIsExpanded(!isExpanded);
  };

  // If the user clicks outside the expanded info box, it should collapse.
  const handleCollapse = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Clickable overlay to collapse the description when it's expanded */}
      {isExpanded && <div className="fixed inset-0 z-[106]" onClick={handleCollapse} />}

      {/* Main container for the info box */}
      <div
        className="absolute bottom-[var(--bottombar-base-height)] left-0 right-[var(--sidebar-width)] z-[107] text-white p-3 cursor-pointer"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
        onClick={!isExpanded && isClamped ? toggleExpand : undefined}
      >
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[40vh] overflow-y-auto cursor-default' : 'max-h-[80px] overflow-hidden'}`}>
            <h3 className="text-base font-bold leading-tight mb-1">@{user}</h3>

            <p
              ref={descriptionRef}
              className={`text-sm leading-snug whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}
            >
              {description}
            </p>

            {isClamped && !isExpanded && (
                <button
                    className="text-white font-semibold text-sm"
                >
                    ...more
                </button>
            )}

            {isExpanded && (
                <button
                    onClick={toggleExpand}
                    className="text-white font-semibold text-sm mt-2 flex items-center"
                >
                    Less <ChevronUp size={20} className="ml-1" />
                </button>
            )}
        </div>
      </div>
    </>
  );
};

export default VideoInfo;
