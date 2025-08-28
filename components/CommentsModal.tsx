"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare } from 'lucide-react';
import Image from 'next/image';

// Mock data for comments
const mockCommentsData = [
  {
    id: 1,
    user: 'Paweł Polutek',
    avatar: 'https://i.pravatar.cc/100?u=pawel',
    text: 'Świetny filmik! Naprawdę mi się podoba.',
    likes: 15,
    isLiked: false,
    replies: [
      {
        id: 3,
        user: 'Web Dev',
        avatar: 'https://i.pravatar.cc/100?u=webdev',
        text: 'Zgadzam się!',
        likes: 2,
        isLiked: true,
        replies: [],
      },
    ],
  },
  {
    id: 2,
    user: 'Tajemniczy Tester',
    avatar: 'https://i.pravatar.cc/100?u=tester',
    text: 'Niezłe, ale widziałem lepsze. #krytyk',
    likes: 3,
    isLiked: true,
    replies: [],
  },
];

type Comment = {
  id: number;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
};

interface CommentItemProps {
  comment: Comment;
  onLike: (id: number) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, isReply = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`flex items-start gap-3 ${isReply ? 'ml-8' : ''}`}
  >
    <Image src={comment.avatar} alt={`${comment.user}'s avatar`} width={32} height={32} className="w-8 h-8 rounded-full mt-1" />
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
          <span>Odpowiedz</span>
        </button>
      </div>
    </div>
  </motion.div>
);

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, commentsCount }) => {
  const [comments, setComments] = useState<Comment[]>(mockCommentsData);
  const [newComment, setNewComment] = useState('');

  const handleLike = (id: number) => {
    setComments(prevComments =>
      prevComments.map(c => {
        if (c.id === id) {
          return { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 };
        }
        // Handle likes on replies
        const updatedReplies = c.replies.map(r => {
            if (r.id === id) {
                return { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 };
            }
            return r;
        });
        return { ...c, replies: updatedReplies };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    const newCommentObject: Comment = {
      id: Date.now(),
      user: 'Ty', // Mock current user
      avatar: 'https://i.pravatar.cc/100?u=current_user',
      text: trimmedComment,
      likes: 0,
      isLiked: false,
      replies: [],
    };

    setComments(prevComments => [newCommentObject, ...prevComments]);
    setNewComment('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full h-[75vh] bg-white rounded-t-2xl flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-black">{commentsCount} komentarzy</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
                <X size={24} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence>
                <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id}>
                    <CommentItem comment={comment} onLike={handleLike} />
                    {comment.replies.map(reply => (
                      <CommentItem key={reply.id} comment={reply} onLike={handleLike} isReply />
                    ))}
                  </div>
                ))}
                </div>
              </AnimatePresence>
            </div>

            {/* Input Form */}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Image src="https://i.pravatar.cc/100?u=current_user" alt="Twój avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Dodaj komentarz..."
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50" disabled={!newComment.trim()}>
                  Wyślij
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
