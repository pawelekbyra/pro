"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, User, Tag, ChevronDown, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

type NotificationType = 'message' | 'profile' | 'offer';

// Define a more robust Notification type based on backend schema
interface Notification {
  id: string; // Use string for UUIDs from DB
  type: NotificationType;
  preview: string;
  time: string; // This could be a string like "2 mins ago" or an ISO string
  full: string;
  unread: boolean;
  expanded?: boolean; // Keep expanded state on the client
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  message: <Mail size={24} className="text-white/80" />,
  profile: <User size={24} className="text-white/80" />,
  offer: <Tag size={24} className="text-white/80" />,
};

// Sub-component for a single notification item
const NotificationItem: React.FC<{ notification: Notification; onToggle: (id: string) => void }> = ({ notification, onToggle }) => {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`rounded-lg cursor-pointer transition-colors hover:bg-white/10 mb-1`}
      onClick={() => onToggle(notification.id)}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="notif-icon">{iconMap[notification.type]}</div>
        <div className="flex-1 flex justify-between items-center">
          <div className="flex flex-col">
            <span className={`text-sm ${notification.unread ? 'font-semibold' : 'font-normal'}`}>{notification.preview}</span>
            <span className="text-xs text-white/60">{notification.time}</span>
          </div>
          <div className="flex items-center gap-2">
            {notification.unread && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
            <ChevronDown size={16} className={`text-white/60 transition-transform ${notification.expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {notification.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-3 px-3 pl-14 text-sm text-white/80">
              {notification.full}
            </div>
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
  const { t, language } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/notifications?lang=${language}`);
          if (!res.ok) throw new Error('Failed to fetch notifications');
          const data = await res.json();
          // Add client-side 'expanded' state
          setNotifications(data.notifications.map((n: Notification) => ({ ...n, expanded: false })));
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [isOpen, language]);

  const handleToggle = (id: string) => {
    const notifToUpdate = notifications.find(n => n.id === id);
    if (notifToUpdate && notifToUpdate.unread) {
      // Mark as read on the backend
      fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      }).catch(err => console.error("Failed to mark notification as read:", err));
    }

    setNotifications(
      notifications.map(n =>
        n.id === id ? { ...n, expanded: !n.expanded, unread: false } : n
      )
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 text-red-400">
          <p>{t('notificationsError')}</p>
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <div className="text-center py-10 text-white/60 flex flex-col items-center gap-4">
          <Bell size={48} className="opacity-50" />
          <p>{t('notificationsAllCaughtUp')}</p>
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
          className="absolute right-3 w-[350px] max-w-[calc(100vw-20px)] bg-[rgba(30,30,30,0.9)] border border-white/15 rounded-xl shadow-lg z-40 text-white flex flex-col"
          style={{
            top: 'calc(var(--topbar-base-height) + var(--safe-area-top) - 10px)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="font-semibold text-base">{t('notificationsTitle')}</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          {renderContent()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;
