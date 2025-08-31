// components/TopBar.tsx
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Bell, Heart, Menu } from 'lucide-react';
import NotificationPopup from './NotificationPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';

const TopBar = ({ openAccountPanel }: { openAccountPanel: () => void }) => {
  // --- Start of merged code ---
  const { user, logout } = useUser(); // Added logout
  const { t } = useTranslation(); // Added for menu text
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Added for menu

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
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-black/50 text-white border-b border-white/10"
        style={{
          height: 'var(--topbar-base-height)',
          paddingTop: 'var(--safe-area-top)',
        }}
      >
        <div className="flex items-center space-x-2">
          {/* Added onClick to Menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleMenuClick}>
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
