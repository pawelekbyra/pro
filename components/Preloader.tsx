// components/Preloader.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';

const Preloader: React.FC = () => {
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);
  const [hasShown, setHasShown] = useState(false);


  const handleLangSelect = (lang: 'pl' | 'en') => {
    const videos = document.querySelectorAll('video');
    let unlocked = false;
    videos.forEach(video => {
      if (!unlocked) {
        video.muted = false;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            video.pause();
          }).catch(error => {
            console.warn("Audio unlock failed, user may need to tap video.", error);
          });
        }
        unlocked = true;
      }
    });
    selectInitialLang(lang);
    setTimeout(() => {
        setIsHiding(true);
    }, 300);
  };

  if (hasShown) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isHiding && (
        <motion.div
          className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              className="relative"
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Image
                src="/icons/icon-512x512.png"
                alt="Ting Tong Logo"
                width={192}
                height={192}
                className="w-48 h-48"
                priority
              />
            </motion.div>
            <motion.div
              className="text-center mt-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">{t('selectLang')}</h2>
              <div className="flex flex-col gap-4 w-64">
                <motion.button
                  onClick={() => handleLangSelect('pl')}
                  className="bg-white/5 border border-white/20 hover:bg-white/10 text-base py-6 rounded-md"
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {t('polish')}
                </motion.button>
                <motion.button
                  onClick={() => handleLangSelect('en')}
                  className="bg-white/5 border border-white/20 hover:bg-white/10 text-base py-6 rounded-md"
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {t('english')}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
