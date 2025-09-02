// components/Preloader.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';

const Preloader: React.FC = () => {
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // If language is already selected, we don't need the preloader.
  // This prevents it from flashing on hot-reloads during development.
  useEffect(() => {
      if (isLangSelected) {
          setIsHiding(true);
      }
  }, [isLangSelected]);

  return (
    <AnimatePresence>
      {!isHiding && (
        <motion.div
          className="fixed inset-0 bg-black z-[10000] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Icon Container - Centered */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[150px] h-[150px] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              className="w-full h-full"
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
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

          {/* Content Container - Below Icon */}
          <motion.div
            className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-center p-4"
            style={{ top: 'calc(50% + 75px)' }} // 75px is half of the icon's height
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: contentVisible ? 1 : 0, y: contentVisible ? 0 : '100%' }}
            transition={{ duration: 1, ease: [0.68, -0.55, 0.27, 1.55] }}
          >
            <div className="text-center w-full flex flex-col items-center">
              <h2 className="text-xl font-semibold text-white mb-6">{t('selectLang')}</h2>
              <div className="flex flex-col gap-4 w-full max-w-sm">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
