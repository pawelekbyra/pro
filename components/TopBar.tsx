"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import NotificationPopup from './NotificationPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useVideoGrid } from '@/context/VideoGridContext';
import LoginForm from './LoginForm';
import { useToast } from '@/context/ToastContext';
import MenuIcon from './icons/MenuIcon';
import BellIcon from './icons/BellIcon';
import PwaDesktopModal from './PwaDesktopModal'; // Import nowego komponentu

const TopBar = () => {
  const { user } = useUser();
  const { openAccountPanel } = useVideoGrid();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false); // Nowy stan
  const [showPwaModal, setShowPwaModal] = useState(false); // Nowy stan

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) return;
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

  // Nowy useEffect do wykrywania desktopu
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth > 768);
        const handleResize = () => setIsDesktop(window.innerWidth > 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // --- Handlers for Logged-Out State ---
  const handleLoggedOutMenuClick = () => {
    addToast(t('menuAccessAlert'), 'info');
  };

  const handleLoggedOutNotificationClick = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      } else {
        addToast(t('notificationAlert'), 'info');
      }
    } else {
        addToast(t('notificationAlert'), 'info');
    }
  };

  // --- Handler for Logged-In State ---
  const handleLoggedInNotificationClick = () => {
    if (user) {
        setShowNotifPanel(!showNotifPanel);
    }
  };

  const handleShowPwaModal = () => {
    setShowPwaModal(true);
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-black/60 text-white backdrop-blur-sm border-b border-white/10"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
          transform: 'translateZ(0)',
        }}
      >
        {!user ? (
          // --- LOGGED-OUT VIEW ---
          <>
            <div className="flex justify-start w-16">
                <Button variant="ghost" size="icon" onClick={handleLoggedOutMenuClick} aria-label={t('menuAriaLabel')}>
                    <MenuIcon className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex justify-center flex-1 text-center">
              <button
                onClick={() => setIsLoginPanelOpen(panel => !panel)}
                className="font-semibold text-sm text-white transition-all duration-300 hover:text-pink-500 hover:scale-110 focus:outline-none focus:scale-110 focus:text-pink-500"
              >
                <span>{t('loggedOutText')}</span>
                <span className='ml-2'>Ting Tong</span>
              </button>
            </div>

            <div className="flex justify-end w-16">
              {/* Nowy przycisk do pobierania PWA */}
              {isDesktop && (
                  <Button variant="ghost" size="icon" onClick={handleShowPwaModal} aria-label={t('installPwaAriaLabel')}>
                      <span className="text-sm font-semibold">{t('installAppText')}</span>
                  </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLoggedOutNotificationClick} aria-label={t('notificationAriaLabel')}>
                <BellIcon className="w-6 h-6" />
              </Button>
            </div>
          </>
        ) : (
          // --- LOGGED-IN VIEW ---
          <>
            <div className="flex justify-start">
                <Button variant="ghost" size="icon" onClick={openAccountPanel} aria-label={t('accountMenuButton')}>
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={t('avatarAlt')}
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700" />
                    )}
                </Button>
            </div>

            <div className="flex justify-center flex-1">
                <span className="font-semibold text-lg text-white">Ting Tong</span>
            </div>

            <div className="flex justify-end">
                {isDesktop && (
                    <Button variant="ghost" size="icon" onClick={handleShowPwaModal} aria-label={t('installPwaAriaLabel')}>
                        <span className="text-sm font-semibold">{t('installAppText')}</span>
                    </Button>
                )}
                <div className="relative">
                    <Button variant="ghost" size="icon" onClick={handleLoggedInNotificationClick} aria-label={t('notificationAriaLabel')}>
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-black bg-pink-500" />
                        )}
                    </Button>
                    <NotificationPopup
                        isOpen={showNotifPanel}
                        onClose={() => setShowNotifPanel(false)}
                    />
                </div>
            </div>
          </>
        )}
      </div>

      {/* --- Login Panel --- */}
      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-30 bg-black/60 backdrop-blur-sm"
            style={{ top: 'var(--topbar-height)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <LoginForm onLoginSuccess={() => setIsLoginPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nowy modal dla PWA na desktopie */}
      <PwaDesktopModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />
    </>
  );
};

export default TopBar;
