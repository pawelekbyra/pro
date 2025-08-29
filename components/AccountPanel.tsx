"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileTab from './ProfileTab';
import PasswordTab from './PasswordTab';
import DeleteTab from './DeleteTab';

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'profile' | 'password' | 'delete';

const AccountPanel: React.FC<AccountPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  if (!isOpen) {
    return null;
  }

  const handleTabClick = (tab: Tab) => {
      setActiveTab(tab);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[60]"
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
                className="relative flex-shrink-0 flex items-center justify-center bg-white/5 border-b border-white/10"
                style={{ height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)'}}
            >
              <h2 className="text-base font-semibold text-white">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-full text-2xl font-light text-white/80 hover:text-white">&times;</button>
            </div>

            <div className="flex-shrink-0 flex bg-black/20 border-b border-white/10">
              <button onClick={() => handleTabClick('profile')} className={`flex-1 p-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'profile' ? 'text-white border-pink-500' : 'text-white/60 border-transparent hover:bg-white/5'}`}>Profil</button>
              <button onClick={() => handleTabClick('password')} className={`flex-1 p-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'password' ? 'text-white border-pink-500' : 'text-white/60 border-transparent hover:bg-white/5'}`}>Hasło</button>
              <button onClick={() => handleTabClick('delete')} className={`flex-1 p-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'delete' ? 'text-white border-pink-500' : 'text-white/60 border-transparent hover:bg-white/5'}`}>Usuń konto</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'password' && <PasswordTab />}
                {activeTab === 'delete' && <DeleteTab />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccountPanel;
