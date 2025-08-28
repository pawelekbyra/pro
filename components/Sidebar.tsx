"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import HeartIcon from "@/components/icons/HeartIcon";
import { cn } from '@/lib/utils';

interface SidebarProps {
  initialLikes: number;
  initialIsLiked: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ initialLikes, initialIsLiked }) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(likeCount + (isLiked ? -1 : 1));
  };

  return (
    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col items-center gap-4 z-10">
      {/* Profile/Subscribe Button */}
      <div className="relative">
        <button className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
          <img src="https://i.pravatar.cc/100?u=pawel" alt="Profil" className="w-full h-full object-cover" />
        </button>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg font-bold border-2 border-black">
          +
        </div>
      </div>

      {/* Like Button */}
      <div className="flex flex-col items-center gap-1">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50" onClick={handleLike}>
          <HeartIcon className={cn("w-8 h-8 text-white transition-colors", isLiked && "fill-pink-500")} />
        </Button>
        <span className="text-white text-sm font-bold">{likeCount}</span>
      </div>

      {/* Comments Button */}
      <div className="flex flex-col items-center gap-1">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50">
          <HeartIcon className="w-8 h-8 text-white" />
        </Button>
        <span className="text-white text-sm font-bold">567</span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center gap-1">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50">
          <HeartIcon className="w-8 h-8 text-white" />
        </Button>
        <span className="text-white text-sm font-bold">Szeruj</span>
      </div>
    </div>
  );
};

export default Sidebar;
