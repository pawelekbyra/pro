'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LoginForm from './LoginForm';
import NotificationPopup from './NotificationPopup';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { useTranslations } from 'next-intl';

interface TopBarProps {
  setIsModalOpen: (isOpen: boolean) => void;
  openAccountPanel: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  setIsModalOpen,
  openAccountPanel,
}) => {
  const { user, isLoggedIn, isLoading, logout } = useUser();
  const t = useTranslations('TopBar');
  const { addToast } = useToast();
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const toggleLoginPanel = () => {
    if (!isLoggedIn) {
      setIsLoginPanelOpen((prev) => !prev);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleNotifPanel = () => {
    setIsNotifPanelOpen((prev) => !prev);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClick = () => {
    if (isLoggedIn) {
      toggleMenu();
    } else {
      addToast(t('menuAccessAlert'), 'info');
    }
  };

  const handleOpenAccountPanel = () => {
    setIsMenuOpen(false);
    openAccountPanel();
  };

  useEffect(() => {
    const isAnyPanelOpen = isLoginPanelOpen || isNotifPanelOpen || isMenuOpen;
    setIsModalOpen(isAnyPanelOpen);
  }, [isLoginPanelOpen, isNotifPanelOpen, isMenuOpen, setIsModalOpen]);

  const getTopBarText = () => {
    if (isLoading) return t('loading');
    if (isLoggedIn)
      return t('loggedInWelcome', { name: user?.displayName || 'User' });
    return t('loggedOutText');
  };

  return (
    <>
      <div
        className="absolute top-0 left-0 w-full z-30 flex justify-center items-center border-b transition-colors"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
          textShadow:
            '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderColor: isLoginPanelOpen
            ? 'transparent'
            : 'rgba(255, 255, 255, 0.15)',
        }}
      >
        <button
          onClick={handleMenuClick}
          className="absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 flex items-center justify-center"
          disabled={isLoading}
        >
          <Menu size={24} />
        </button>

        <div className="relative">
          <button
            onClick={toggleLoginPanel}
            className="flex items-center gap-1.5"
            disabled={isLoading || isLoggedIn}
          >
            <span className="text-sm font-medium">{getTopBarText()}</span>
            {!isLoggedIn && !isLoading && (
              <motion.span
                className="text-xs opacity-80"
                style={{ transform: 'translateY(-1px)' }}
                animate={{ rotate: isLoginPanelOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.span>
            )}
          </button>
        </div>

        <button
          onClick={toggleNotifPanel}
          className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 flex items-center justify-center"
          disabled={isLoading}
        >
          <Bell size={22} />
          {isLoggedIn && hasUnread && (
            <div
              className="absolute w-2 h-2 rounded-full border-2"
              style={{
                top: '10px',
                right: '11px',
                backgroundColor: 'hsl(var(--primary))',
                borderColor: '#6F6F6F',
              }}
            ></div>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="logged-in-menu absolute top-[var(--topbar-height)] left-0 z-40 bg-[rgba(20,20,20,0.85)] backdrop-blur-xl border-b-2 border-r-2 border-white/10 rounded-br-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {isLoggedIn && (
              <>
                <button
                  onClick={handleOpenAccountPanel}
                  className="block text-left w-full text-white px-4 py-3 hover:bg-white/10"
                >
                  {t('account')}
                </button>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <button className="block text-left w-full text-white px-4 py-3 hover:bg-white/10 border-t border-white/10">
                      {t('adminPanel')}
                    </button>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block text-left w-full text-white px-4 py-3 hover:bg-white/10 border-t border-white/10"
                >
                  {t('logout')}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-40 overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
              top: 'var(--topbar-height)',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              paddingTop: '10px',
            }}
          >
            <LoginForm onLoginSuccess={() => setIsLoginPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotifPanelOpen && (
          <NotificationPopup
            isOpen={isNotifPanelOpen}
            onClose={() => setIsNotifPanelOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TopBar;
