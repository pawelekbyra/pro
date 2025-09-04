"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
// This type is now aligned with the backend response
type Comment = {
  id: string;
  text: string;
  createdAt: string;
  likedBy: string[];
  user: {
    displayName: string;
    avatar: string;
  };
  parentId?: string | null;
  replies?: Comment[];
};

interface CommentItemProps {
  comment: Comment;
  onLike: (id: string) => void;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  currentUserId?: string;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onReplySubmit, currentUserId, isReply = false }) => {
  const { t } = useTranslation();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { user } = useUser();
  const isLiked = currentUserId ? comment.likedBy.includes(currentUserId) : false;

  const handleReplyClick = () => {
    setIsReplying(!isReplying);
  };

  const handleLocalReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReplySubmit(comment.id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-3 ${isReply ? 'ml-8' : ''}`}
    >
      <Image src={comment.user.avatar} alt={t('userAvatar', { user: comment.user.displayName })} width={32} height={32} className="w-8 h-8 rounded-full mt-1" />
      <div className="flex-1">
        <p className="text-xs font-bold text-white/80">{comment.user.displayName}</p>
        <p className="text-sm text-white">{comment.text}</p>
        <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
          <button onClick={() => onLike(comment.id)} className="flex items-center gap-1">
            <Heart size={14} className={isLiked ? 'text-red-500 fill-current' : ''} />
            {comment.likedBy.length > 0 && <span>{comment.likedBy.length}</span>}
          </button>
          {!isReply && (
            <button onClick={handleReplyClick} className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{t('reply')}</span>
            </button>
          )}
        </div>
        {isReplying && user && (
          <form onSubmit={handleLocalReplySubmit} className="flex items-center gap-2 mt-2">
            {user.avatar && <Image src={user.avatar} alt={t('yourAvatar')} width={24} height={24} className="w-6 h-6 rounded-full" />}
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('addCommentPlaceholder')}
              className="flex-1 px-3 py-1 bg-white/10 text-white rounded-full focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs"
              autoFocus
            />
            <button type="submit" className="px-3 py-1 bg-pink-500 text-white rounded-full text-xs font-semibold disabled:opacity-50" disabled={!replyText.trim()}>
              {t('sendButton')}
            </button>
          </form>
        )}
        <div className="mt-2 space-y-3">
          {comment.replies?.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReplySubmit={onReplySubmit}
              currentUserId={currentUserId}
              isReply={true}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId?: string;
  initialCommentsCount: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, slideId, initialCommentsCount }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && slideId) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/comments?slideId=${slideId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch comments');
          }
          return res.json();
        })
        .then(data => {
          if (data.success) {
            setComments(data.comments);
          } else {
            throw new Error(data.message || 'Failed to fetch comments');
          }
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, slideId]);

  const handleLike = async (commentId: string) => {
    if (!user) {
      // Maybe show a toast message to login
      return;
    }

    const originalComments = [...comments];
    const newComments = comments.map(comment => {
      if (comment.id === commentId) {
        const isLiked = comment.likedBy.includes(user.id);
        const newLikedBy = isLiked
          ? comment.likedBy.filter(id => id !== user.id)
          : [...comment.likedBy, user.id];
        return { ...comment, likedBy: newLikedBy };
      }
      return comment;
    });

    setComments(newComments);

    try {
      const res = await fetch(`/api/comments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (!res.ok) {
        // Revert on failure
        setComments(originalComments);
        // Maybe show a toast message
        console.error('Failed to like comment');
      }
    } catch (error) {
      setComments(originalComments);
      console.error('An error occurred while liking the comment', error);
    }
  };

  const addCommentOptimistically = (newComment: Comment) => {
    if (newComment.parentId) {
      setComments(prev => {
        const newComments = [...prev];
        const addReply = (comment: Comment): Comment => {
          if (comment.id === newComment.parentId) {
            return { ...comment, replies: [newComment, ...(comment.replies || [])] };
          }
          if (comment.replies) {
            return { ...comment, replies: comment.replies.map(addReply) };
          }
          return comment;
        };
        return newComments.map(addReply);
      });
    } else {
      setComments(prev => [newComment, ...prev]);
    }
  };

  const removeCommentOptimistically = (commentId: string) => {
    setComments(prev => {
        const filterReplies = (comments: Comment[]): Comment[] => {
            return comments.filter(c => c.id !== commentId).map(c => {
                if (c.replies) {
                    return { ...c, replies: filterReplies(c.replies) };
                }
                return c;
            });
        };
        return filterReplies(prev);
    });
  };

  const replaceTempComment = (tempId: string, realComment: Comment) => {
    setComments(prev => {
        const replaceInReplies = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === tempId) {
                    return realComment;
                }
                if (c.replies) {
                    return { ...c, replies: replaceInReplies(c.replies) };
                }
                return c;
            });
        };
        return replaceInReplies(prev);
    });
  };

  const handleReplySubmit = async (parentId: string, text: string) => {
    if (!text.trim() || !user || !slideId) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newReply: Comment = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
      likedBy: [],
      user: { displayName: user.displayName || user.username, avatar: user.avatar || '' },
      parentId,
    };
    addCommentOptimistically(newReply);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId, text, parentId }),
      });
      if (!res.ok) {
        throw new Error('Failed to post reply');
      }
      const data = await res.json();
      replaceTempComment(tempId, data.comment);

    } catch (err: any) {
      setError(err.message);
      // Revert optimistic update on failure
      removeCommentOptimistically(tempId);
      console.error("Failed to post reply, optimistic update reverted.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment || !user || !slideId) return;

    setIsSubmitting(true);
    setError(null);
    setNewComment(''); // Clear input immediately

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newCommentData: Comment = {
      id: tempId,
      text: trimmedComment,
      createdAt: new Date().toISOString(),
      likedBy: [],
      user: { displayName: user.displayName || user.username, avatar: user.avatar || '' },
      parentId: null,
    };
    addCommentOptimistically(newCommentData);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId, text: trimmedComment }),
      });
      if (!res.ok) {
        throw new Error('Failed to post comment');
      }
      const data = await res.json();
      replaceTempComment(tempId, data.comment);
    } catch (err: any) {
      setError(err.message);
      // Revert on failure
      removeCommentOptimistically(tempId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center text-center text-red-400 p-4">
          {error}
        </div>
      );
    }
    if (comments.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-center text-white/60 p-4">
                {t('noCommentsYet')}
            </div>
        );
    }
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          <motion.div layout className="space-y-4">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLike}
                onReplySubmit={handleReplySubmit}
                currentUserId={user?.id}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    );
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
            className="w-full bg-black/80 backdrop-blur-md rounded-t-2xl flex flex-col border-t border-white/10"
            style={{ height: '75dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{t('commentsTitle', { count: (comments.length || initialCommentsCount).toString() })}</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {renderContent()}

            {user && (
              <div className="flex-shrink-0 p-2 border-t border-white/10 bg-black/50">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  {user.avatar && <Image src={user.avatar} alt={t('yourAvatar')} width={32} height={32} className="w-8 h-8 rounded-full" />}
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('addCommentPlaceholder')}
                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[70px] transition-colors"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendButton')}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
