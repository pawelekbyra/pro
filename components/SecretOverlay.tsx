"use client";

import React, { memo } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useStore } from '@/store/useStore';

const SecretOverlay: React.FC = memo(() => {
  const { t } = useTranslation();
  const { login } = useUser();
  const { setActiveModal } = useStore();

  const handleLoginClick = () => {
    setActiveModal('login');
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-white select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="secret-title font-bold leading-tight drop-shadow-md">{t('secretTitle')}</h2>
        <p className="secret-subtitle opacity-75 drop-shadow-sm mt-1">{t('secretSubtitle')}</p>
        <Button onClick={handleLoginClick} className="mt-4 px-6 py-3 font-semibold rounded-full" variant="secondary">
          {t('secretLoginText') || 'Log in to watch'}
        </Button>
      </motion.div>
    </div>
  );
});

SecretOverlay.displayName = 'SecretOverlay';

export default SecretOverlay;
