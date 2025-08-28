"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import NotificationPopup from './NotificationPopup';

interface TopBarProps {
  isLoggedIn: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ isLoggedIn, setIsModalOpen }) => {
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  const toggleLoginPanel = () => {
    if (!isLoggedIn) {
      setIsLoginPanelOpen((prev) => !prev);
    }
  };

  const toggleNotifPanel = () => {
    // For now, allow access even if not logged in, as per prototype.
    // In a real app, this would likely be restricted.
    setIsNotifPanelOpen((prev) => !prev);
  };

  // Effect to inform the parent page about the modal state
  useEffect(() => {
    const isAnyPanelOpen = isLoginPanelOpen || isNotifPanelOpen;
    setIsModalOpen(isAnyPanelOpen);

    // Also add/remove class to body to prevent scrolling on mobile
    if (isAnyPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    }
  }, [isLoginPanelOpen, isNotifPanelOpen, setIsModalOpen]);


  return (
    <>
      <div
        className="absolute top-0 left-0 w-full z-30 flex justify-center items-center border-b transition-colors"
        style={{
          height: 'var(--topbar-height)',
          paddingTop: 'var(--safe-area-top)',
          textShadow: '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderColor: isLoginPanelOpen ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
        }}
      >
        <button className="absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 flex items-center justify-center">
          <Menu size={24} />
        </button>

        <div className="relative">
          <button onClick={toggleLoginPanel} className="flex items-center gap-1.5">
            <span className="text-sm font-medium">
              {isLoggedIn ? 'You are logged in' : "You don't have the guts to log in"}
            </span>
            {!isLoggedIn && (
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

        <button onClick={toggleNotifPanel} className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 flex items-center justify-center">
          <Bell size={22} />
          <div
            className="absolute w-2 h-2 rounded-full border-2"
            style={{
              top: '10px',
              right: '11px',
              backgroundColor: 'var(--accent-color)',
              borderColor: '#6F6F6F'
            }}
          ></div>
        </button>
      </div>

      <AnimatePresence>
        {isLoginPanelOpen && (
          <motion.div
            className="absolute left-0 w-full z-20 overflow-hidden"
            style={{
              top: 'var(--topbar-height)',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <LoginForm />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotifPanelOpen && <NotificationPopup onClose={() => setIsNotifPanelOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default TopBar;
