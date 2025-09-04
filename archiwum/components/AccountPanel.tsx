"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import ProfileTab from './ProfileTab';
import PasswordTab from './PasswordTab';
import DeleteTab from './DeleteTab';
import { useTranslation } from '@/context/LanguageContext';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface AccountPanelProps {
  onClose: () => void;
}

type Tab = 'profile' | 'password' | 'delete';

const AccountPanel: React.FC<AccountPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { t } = useTranslation();
  const { user } = useUser();

  useEffect(() => {
    // If the user logs out while this panel is open, close it automatically.
    if (!user) {
      onClose();
    }
  }, [user, onClose]);

  const handleTabClick = (tab: Tab) => {
      setActiveTab(tab);
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Close on overlay click
    >
      <motion.div
        className="absolute top-0 left-0 h-full w-full max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] flex flex-col"
        initial={{ x: '-100%' }}
        animate={{ x: '0%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the panel
      >
        <div
            className="relative flex-shrink-0 flex items-center justify-center bg-black border-b border-white/10"
            style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)'}}
        >
          <h2 className="text-base font-semibold text-white">{t(`${activeTab}Tab`)}</h2>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white" aria-label={t('closeAccountAriaLabel')}>
              <X size={24} />
          </button>
        </div>

        <div className="flex-shrink-0 flex bg-zinc-900 border-b border-white/10">
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex-1 p-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'profile' ? 'bg-zinc-700 text-white border-pink-500' : 'text-white/60 border-transparent hover:bg-white/5'}`}
          >
            {t('profileTab')}
          </button>
          <button
            onClick={() => handleTabClick('password')}
            className={`flex-1 p-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'password' ? 'bg-zinc-700 text-white border-pink-500' : 'text-white/60 border-transparent hover:bg-white/5'}`}
          >
            {t('passwordTab')}
          </button>
          <button
            onClick={() => handleTabClick('delete')}
            className={`flex-1 p-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'delete' ? 'bg-zinc-700 text-white border-pink-500' : 'text-white/60 border-transparent hover:bg-white/5'}`}
          >
            {t('deleteTab')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            {activeTab === 'profile' && <ProfileTab onClose={onClose} />}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'delete' && <DeleteTab />}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccountPanel;
