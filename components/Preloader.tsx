"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { Button } from './ui/button';
import Image from 'next/image';

const Preloader: React.FC = () => {
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);

  const handleLangSelect = (lang: 'pl' | 'en') => {
    // 1. Unlock audio
    const videos = document.querySelectorAll('video');
    let unlocked = false;
    videos.forEach(video => {
      if (!unlocked) {
        video.muted = false;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Autoplay started!
            video.pause(); // Immediately pause it, we just wanted the gesture
          }).catch(error => {
            console.warn("Audio unlock failed, user may need to tap video.", error);
          });
        }
        unlocked = true;
      }
    });

    // 2. Set the language
    selectInitialLang(lang);

    // 3. Trigger fade-out animation
    setIsHiding(true);
  };

  if (isLangSelected) {
    return null; // Don't render if a language is already selected (e.g., from localStorage)
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
          {/* Kontener ikony: wycentrowany absolutnie, aby uniknąć wpływu innych elementów */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" // Użycie klas do absolutnego centrowania
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
              width={192} // Stały rozmiar
              height={192} // Stały rozmiar
              className="w-48 h-48"
              priority
            />
          </motion.div>

          {/* Kontener wyboru języka: pojawia się po ikonie */}
          <motion.div
            className="text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          >
            <h2 className="text-xl font-semibold text-white mb-6">{t('selectLang')}</h2>
            <div className="flex flex-col gap-4 w-64">
              <Button
                onClick={() => handleLangSelect('pl')}
                className="bg-white/5 border border-white/20 hover:bg-white/10 text-base py-6"
              >
                {t('polish')}
              </Button>
              <Button
                onClick={() => handleLangSelect('en')}
                className="bg-white/5 border border-white/20 hover:bg-white/10 text-base py-6"
              >
                {t('english')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
