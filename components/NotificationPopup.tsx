"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Mock notification data for now
const mockNotifications = [
  { id: 1, type: 'message', preview: 'New message from Admin', time: '2 mins ago', unread: true },
  { id: 2, type: 'profile', preview: 'Your profile has been updated', time: '10 mins ago', unread: true },
  { id: 3, type: 'offer', preview: 'A special offer is waiting for you!', time: '1 hour ago', unread: false },
];

interface NotificationPopupProps {
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ onClose }) => {
  return (
    <motion.div
      className="absolute right-3 w-[350px] max-w-[calc(100vw-20px)] bg-[rgba(30,30,30,0.9)] border border-white/15 rounded-xl shadow-lg z-40 text-white"
      style={{
        top: 'calc(var(--topbar-height) + 3px)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <h3 className="font-semibold text-base">Notifications</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
      <ul className="p-2 max-h-[45vh] overflow-y-auto">
        {mockNotifications.length > 0 ? (
          mockNotifications.map((notif) => (
            <li key={notif.id} className={`p-3 rounded-lg cursor-pointer hover:bg-white/10 ${notif.unread ? 'font-bold' : ''}`}>
              <p className="text-sm">{notif.preview}</p>
              <p className="text-xs text-white/60 mt-1">{notif.time}</p>
            </li>
          ))
        ) : (
          <div className="text-center py-10 text-white/60">
            <p>You are all caught up!</p>
          </div>
        )}
      </ul>
    </motion.div>
  );
};

export default NotificationPopup;
