"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';
import { useStore } from '@/store/useStore';

const Preloader: React.FC = () => {
  const { t, selectInitialLang } = useTranslation();
  // We only need setIsMuted from the store now.
  const setIsMuted = useStore((state) => state.setIsMuted);

  const [isHiding, setIsHiding] = useState(false);
  const [showLangButtons, setShowLangButtons] = useState(false);

  // Show language buttons after a brief moment.
  useEffect(() => {
    const timer = setTimeout(() => setShowLangButtons(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLangSelect = (lang: 'pl' | 'en') => {
    selectInitialLang(lang);
    setIsMuted(false); // Unmute the app as per user's request for interaction-based sound.
    setIsHiding(true);  // Immediately start hiding the preloader.
  };

  return (
    <AnimatePresence>
      {!isHiding && (
        <motion.div
          className="fixed inset-0 bg-black z-[10000] overflow-hidden flex flex-col items-center justify-center p-4 gap-8"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.2 } }}
        >
          <motion.div
            className="w-[150px] h-[150px] flex-shrink-0"
            animate={{ opacity: showLangButtons ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              className="w-full h-full"
              animate={{ scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
            >
              <Image
                src="/icons/icon-512x512.png"
                alt="Ting Tong Logo"
                width={150}
                height={150}
                priority
              />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {showLangButtons && (
              <motion.div
                className="w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div className="text-center w-full flex flex-col items-center">
                  <h2 className="text-xl font-semibold text-white mb-6">{t('selectLang')}</h2>
                  <div className="flex flex-col gap-4 w-full">
                    <motion.button
                      onClick={() => handleLangSelect('pl')}
                      className="bg-white/5 border border-white/20 hover:bg-white/10 text-base py-6 rounded-md"
                      whileTap={{ scale: 0.95 }}
                    >
                      {t('polish')}
                    </motion.button>
                    <motion.button
                      onClick={() => handleLangSelect('en')}
                      className="bg-white/5 border border-white/20 hover:bg-white/10 text-base py-6 rounded-md"
                      whileTap={{ scale: 0.95 }}
                    >
                      {t('english')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
