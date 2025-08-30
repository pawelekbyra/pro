'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, User, Tag, ChevronDown } from 'lucide-react';

// Enhanced mock data with full details and types
const mockNotificationsData = [
  {
    id: 1,
    type: 'message' as const,
    preview: 'New message from Admin',
    time: '2 mins ago',
    full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!',
    unread: true,
    expanded: false,
  },
  {
    id: 2,
    type: 'profile' as const,
    preview: 'Your profile has been updated',
    time: '10 mins ago',
    full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.',
    unread: true,
    expanded: false,
  },
  {
    id: 3,
    type: 'offer' as const,
    preview: 'A special offer is waiting for you!',
    time: '1 hour ago',
    full: "Don't miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.",
    unread: false,
    expanded: false,
  },
];

type Notification = (typeof mockNotificationsData)[0];

const iconMap = {
  message: <Mail size={24} className="text-white/80" />,
  profile: <User size={24} className="text-white/80" />,
  offer: <Tag size={24} className="text-white/80" />,
};

// Sub-component for a single notification item
const NotificationItem: React.FC<{
  notification: Notification;
  onToggle: (id: number) => void;
}> = ({ notification, onToggle }) => {
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
            <span
              className={`text-sm ${notification.unread ? 'font-semibold' : 'font-normal'}`}
            >
              {notification.preview}
            </span>
            <span className="text-xs text-white/60">{notification.time}</span>
          </div>
          <div className="flex items-center gap-2">
            {notification.unread && (
              <div className="w-2 h-2 bg-pink-500 rounded-full" />
            )}
            <ChevronDown
              size={16}
              className={`text-white/60 transition-transform ${notification.expanded ? 'rotate-180' : ''}`}
            />
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

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>(
    mockNotificationsData
  );

  const handleToggle = (id: number) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, expanded: !n.expanded, unread: false } : n
      )
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
            <h3 className="font-semibold text-base">Powiadomienia</h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <ul className="flex-grow p-2 max-h-[45vh] overflow-y-auto">
            {notifications.length > 0 ? (
              <AnimatePresence>
                {notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onToggle={handleToggle}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-10 text-white/60 flex flex-col items-center gap-4">
                <Bell size={48} className="opacity-50" />
                <p>Wszystko na bieżąco!</p>
              </div>
            )}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;
