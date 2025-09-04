import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, User, Tag, ChevronDown, Loader2, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import Image from 'next/image';

type NotificationType = 'like' | 'comment' | 'follow' | 'message';

// This type is now aligned with the mock data
interface Notification {
  id: string;
  type: NotificationType;
  preview: string;
  time: string;
  full: string;
  unread: boolean;
  expanded?: boolean;
  user: {
    displayName: string;
    avatar: string;
  };
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  like: <Heart size={20} className="text-red-500 fill-current" />,
  comment: <MessageSquare size={20} className="text-white/80" />,
  follow: <UserPlus size={20} className="text-white/80" />,
  message: <Mail size={20} className="text-white/80" />
};

const NotificationItem: React.FC<{ notification: Notification; onToggle: (id: string) => void }> = ({ notification, onToggle }) => {
  const { t, lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newIsExpanded = !isExpanded;
    setIsExpanded(newIsExpanded);

    // If expanding and it's unread, update state and call API
    if (newIsExpanded && notification.unread) {
      onToggle(notification.id); // Update parent state (removes dot)

      fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id }),
      })
      .catch(error => {
        console.error('Error marking notification as read:', error);
        // Here you could potentially revert the UI change
      });
    }
  };

  const getFullText = (key: string, user: string) => {
    let text = t(key, { name: user })
    return text;
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`rounded-lg cursor-pointer transition-colors hover:bg-white/10 mb-1 ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="flex items-start gap-3 p-3" onClick={handleToggle}>
        <Image src={notification.user.avatar} alt={t('userAvatar', { user: notification.user.displayName })} width={40} height={40} className="w-10 h-10 rounded-full mt-1" />
        <div className="flex-1 flex flex-col">
          <p className="text-sm">
            <span className="font-bold">{notification.user.displayName}</span> {notification.preview}
          </p>
          <span className="text-xs text-white/60 mt-1">{notification.time}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {notification.unread && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-white/80 p-3 pt-0">
              {getFullText(notification.full, notification.user.displayName)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
};

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      fetch('/api/notifications')
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch notifications');
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                const transformedNotifications = data.notifications.map((n: any) => ({
                    id: n.id,
                    type: n.type as NotificationType,
                    preview: t(n.previewKey),
                    time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: lang === 'pl' ? pl : undefined }),
                    full: n.fullKey,
                    unread: !n.read,
                    user: n.fromUser || { displayName: 'System', avatar: '/icons/icon-192x192.png' },
                }));
                setNotifications(transformedNotifications);
            } else {
                throw new Error(data.message || 'Failed to fetch notifications');
            }
        })
        .catch(err => {
            setError(err.message);
        })
        .finally(() => {
            setIsLoading(false);
        });
    }
  }, [isOpen, lang, t]);

  const handleToggle = (id: string) => {
    setNotifications(
      notifications.map(n =>
        n.id === id ? { ...n, unread: false } : n
      )
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 text-red-400 p-4">
          <p>{t('notificationsError')}</p>
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <div className="text-center py-10 text-white/60 flex flex-col items-center gap-4 p-4">
          <Bell size={48} className="opacity-50" />
          <p>{t('notificationsEmpty')}</p>
        </div>
      );
    }
    return (
      <ul className="flex-grow p-2 max-h-[45vh] overflow-y-auto">
        <AnimatePresence>
          {notifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onToggle={handleToggle} />
          ))}
        </AnimatePresence>
      </ul>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[calc(var(--bottombar-height)_+_20px)] md:pb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-[350px] max-w-[calc(100vw-20px)] bg-[rgba(30,30,30,0.9)] border border-white/15 rounded-xl shadow-lg text-white flex flex-col"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="font-semibold text-base">{t('notificationsTitle')}</h3>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;