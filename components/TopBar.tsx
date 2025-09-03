"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import NotificationPopup from './NotificationPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useStore } from '@/store/useStore';
import LoginForm from './LoginForm';
import { useToast } from '@/context/ToastContext';
import MenuIcon from './icons/MenuIcon';
import BellIcon from './icons/BellIcon';
import PwaDesktopModal from './PwaDesktopModal';

const TopBar = () => {
  const { user } = useUser();
  const setActiveModal = useStore((state) => state.setActiveModal);
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // This should be replaced with real data from a notifications context or API
  const unreadCount = 0;

  const handleLoggedOutMenuClick = () => {
    addToast(t('menuAccessAlert'), 'info');
  };

  const handleLoggedOutNotificationClick = () => {
    addToast(t('notificationAlert'), 'info');
  };

  const handleLoggedInNotificationClick = () => {
    setShowNotifPanel(p => !p);
  };

  const handleShowPwaModal = () => {
    setShowPwaModal(true);
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-1 bg-black text-white border-b border-white/10"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
          transform: 'translateZ(0)',
        }}
      >
        {!user ? (
          // --- WIDOK DLA UŻYTKOWNIKÓW NIEZALOGOWANYCH ---
          <>
            <div className="flex justify-start">
              <Button variant="ghost" size="icon" onClick={handleLoggedOutMenuClick} aria-label={t('menuAriaLabel')}>
                <MenuIcon className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex justify-center flex-1 text-center">
              <button
                onClick={() => setIsLoginPanelOpen(panel => !panel)}
                className="font-semibold text-sm text-white transition-all duration-300 focus:outline-none whitespace-nowrap"
              >
                <span>{t('loggedOutText')}</span>
              </button>
            </div>
            <div className="flex justify-end">
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
          // --- WIDOK DLA ZALOGOWANYCH UŻYTKOWNIKÓW ---
          <>
            <div className="flex justify-start">
              <Button variant="ghost" size="icon" onClick={() => setActiveModal('account')} aria-label={t('accountMenuButton')}>
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
            className="absolute left-0 w-full z-[50] bg-black/60 backdrop-blur-sm"
            style={{ top: 'var(--topbar-height)' }}
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <LoginForm onLoginSuccess={() => setIsLoginPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PWA Modal --- */}
      {showPwaModal && <PwaDesktopModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />}
    </>
  );
};

export default TopBar;
