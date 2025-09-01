"use client";

// components/TopBar.tsx
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Bell, Heart, Menu } from 'lucide-react';
import NotificationPopup from './NotificationPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useVideoGrid } from '@/context/VideoGridContext';
import LoginForm from './LoginForm';

const TopBar = () => {
  // --- Start of merged code ---
  const { user, logout } = useUser(); // Added logout
  const { openAccountPanel } = useVideoGrid();
  const { t } = useTranslation(); // Added for menu text
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Added for menu
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);

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
    setShowNotifPanel(!showNotifPanel);
  };

  // --- Menu Logic from original component ---
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const handleMenuClick = () => {
    if (user) {
      toggleMenu();
    } else {
      // In the new component, the account panel handles login
      openAccountPanel();
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const handleOpenAccountPanelFromMenu = () => {
    setIsMenuOpen(false);
    openAccountPanel();
  };
  // --- End of Menu Logic ---

  return (
    <> {/* Added Fragment to hold menu */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-black/60 text-white backdrop-blur-sm border-b border-white/10"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
          transform: 'translateZ(0)',
        }}
      >
        <div className="flex items-center space-x-2">
          {/* Added onClick to Menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleMenuClick}>
            <Menu />
          </Button>
        </div>

        {/* Conditional Login/Status Text */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {!user ? (
            <Button variant="ghost" onClick={() => setIsLoginPanelOpen(!isLoginPanelOpen)} className="px-4 py-2 h-auto">
              {t('loggedOutText')}
            </Button>
          ) : (
            <span className="text-sm font-semibold">{t('loggedInText')}</span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
              )}
            </Button>
            <NotificationPopup
              isOpen={showNotifPanel}
              onClose={() => setShowNotifPanel(false)}
            />
          </div>
          <Button variant="ghost" size="icon">
            <Heart />
          </Button>
          <Button variant="ghost" size="icon" onClick={openAccountPanel}>
            {user?.avatar ? (
              <Image
                src={user.avatar}
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
      {/* --- Login Panel --- */}
      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-30 bg-black/60 backdrop-blur-sm"
            style={{ top: 'var(--topbar-height)' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LoginForm onLoginSuccess={() => setIsLoginPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- Added Menu JSX --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="logged-in-menu absolute top-[var(--topbar-height)] left-0 z-40 bg-[rgba(20,20,20,0.85)] backdrop-blur-xl border-b-2 border-r-2 border-white/10 rounded-br-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {user && (
              <>
                <button onClick={handleOpenAccountPanelFromMenu} className="block text-left w-full text-white px-4 py-3 hover:bg-white/10">{t('account')}</button>
                <button onClick={handleLogout} className="block text-left w-full text-white px-4 py-3 hover:bg-white/10 border-t border-white/10">{t('logout')}</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopBar;
