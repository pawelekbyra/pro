"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import type { Comment } from '@/lib/mockData';

interface CommentItemProps {
  comment: Comment;
  onLike: (id: number) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, isReply = false }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-3 ${isReply ? 'ml-8' : ''}`}
    >
      <Image src={comment.avatar} alt={`${comment.user}'s avatar`} className="rounded-full mt-1" width={32} height={32} />
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-800">{comment.user}</p>
        <p className="text-sm text-black">{comment.text}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
          <button onClick={() => onLike(comment.id)} className="flex items-center gap-1">
            <Heart size={14} className={comment.isLiked ? 'text-red-500 fill-current' : ''} />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>
          <button className="flex items-center gap-1">
            <MessageSquare size={14} />
            <span>{t('reply')}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentItem;
