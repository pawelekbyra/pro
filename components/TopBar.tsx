"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Bell, Heart, Menu } from 'lucide-react';
import NotificationPopup from './NotificationPopup';

const TopBar = ({ toggleSidebar, toggleAccountPanel }: { toggleSidebar: () => void; toggleAccountPanel: () => void }) => {
  const { user, updateUser } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleNotificationClick = async () => {
    if (!user) {
      alert('Aby zobaczyć powiadomienia, musisz się zalogować.');
      return;
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setShowNotifPanel(!showNotifPanel);
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setShowNotifPanel(true);
        } else {
          alert('Powiadomienia zostały zablokowane. Aby je włączyć, przejdź do ustawień przeglądarki.');
        }
      }
    } else {
      alert('Twoja przeglądarka nie wspiera powiadomień.');
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-as-read', { method: 'POST' });
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-b dark:border-zinc-700 h-16 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <Menu />
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
            )}
          </Button>
          {showNotifPanel && (
            <NotificationPopup
              onClose={() => setShowNotifPanel(false)}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </div>
        <Button variant="ghost" size="icon">
          <Heart />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleAccountPanel}>
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default TopBar;
