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

const TopBar = () => {
  const { user } = useUser();
  const { openAccountPanel } = useVideoGrid();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);

  return (
    <>
      <div
        className="relative z-10 flex items-center justify-between px-2 bg-black/60 text-white backdrop-blur-sm border-b border-white/10"
        style={{
          height: 'var(--topbar-height)',
        }}
      >
        <div className="flex justify-start w-12">
            {!user ? (
                <Button variant="ghost" size="icon" onClick={() => setIsLoginPanelOpen(true)} aria-label={t('menuAriaLabel')}>
                    <MenuIcon className="w-7 h-7" />
                </Button>
            ) : (
                <Button variant="ghost" size="icon" onClick={openAccountPanel} aria-label={t('accountMenuButton')}>
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={t('avatarAlt')}
                            width={36}
                            height={36}
                            className="rounded-full"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-zinc-700" />
                    )}
                </Button>
            )}
        </div>

        <div className="flex justify-center flex-1">
            <span className="font-semibold text-lg text-white">Ting Tong</span>
        </div>

        <div className="flex justify-end w-12" />
      </div>

      {/* --- Login Panel --- */}
      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-20 bg-black/60 backdrop-blur-sm"
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
    </>
  );
};

export default TopBar;
