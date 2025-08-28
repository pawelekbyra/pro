"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { mockCommentsData, Comment } from '@/lib/mockData';
import CommentItem from './CommentItem';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, commentsCount }) => {
  const { t } = useTranslation();
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  const [comments, setComments] = useState<Comment[]>(mockCommentsData);
  const [newComment, setNewComment] = useState('');

  const handleLike = (id: number) => {
    setComments(prevComments =>
      prevComments.map(c => {
        if (c.id === id) {
          return { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 };
        }
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
          ref={modalRef}
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
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-black">{commentsCount} {t('comments')}</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black" aria-label={t('close')}>
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence>
                {comments.length > 0 ? (
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold text-lg">{t('noCommentsYet')}</p>
                    <p className="text-sm">{t('beTheFirst')}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Image src="https://i.pravatar.cc/100?u=current_user" alt={t('userAvatar')} className="rounded-full" width={32} height={32} />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('addComment')}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50" disabled={!newComment.trim()}>
                  {t('send')}
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
