"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Info, Languages, Coffee } from 'lucide-react';

interface SidebarProps {
  avatarUrl: string;
  initialLikes: number;
  isLiked: boolean;
  likeId: string;
  commentsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ avatarUrl, initialLikes, isLiked: initialIsLiked, likeId, commentsCount }) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);

  // Helper function to format counts (e.g., 1500 -> 1.5K)
  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(count);
  };

  const handleLike = async () => {
    // Optimistic UI update
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ likeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      // Optionally, you can sync with the server's response
      // For now, the optimistic update is enough for a mock.
      // setIsLiked(data.isLiked);
      // setLikesCount(data.likeCount);

    } catch (error) {
      console.error(error);
      // Revert the UI on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      // You could show an error toast here
    }
  };

  return (
    <aside
      className="absolute right-0 flex flex-col items-center gap-2 z-20"
      style={{
        top: 'calc((var(--app-height) - var(--topbar-height) - var(--bottombar-height)) / 2 + var(--topbar-height))',
        transform: 'translateY(-50%)',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
      }}
    >
      <div className="relative w-12 h-12 mb-1.5">
        <button className="w-full h-full">
          <img src={avatarUrl} alt="User avatar" className="w-full h-full rounded-full border-2 border-white object-cover" />
        </button>
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white"
          style={{ backgroundColor: 'var(--accent-color)'}}
        >
          +
        </div>
      </div>

      <button onClick={handleLike} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Heart
          size={32}
          className={`transition-colors duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-white'}`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
        />
        <span className="icon-label">{formatCount(likesCount)}</span>
      </button>

      <button className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <MessageCircle size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">{formatCount(commentsCount)}</span>
      </button>

      <button className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
        <Share2 size={32} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
        <span className="icon-label">Share</span>
      </button>

      {/* Other buttons are static for now */}
    </aside>
  );
};

export default Sidebar;
