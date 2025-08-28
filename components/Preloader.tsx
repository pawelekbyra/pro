"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { Button } from './ui/button';

const Preloader: React.FC = () => {
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'pl' | 'en' | null>(null);

  const handleLangSelect = (lang: 'pl' | 'en') => {
    if (selectedLang) return; // Prevent double-clicks
    setSelectedLang(lang);

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
    setTimeout(() => {
      setIsHiding(true);
    }, 300); // Small delay for the selection animation to play
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
          <motion.div
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
            onAnimationComplete={() => setContentVisible(true)}
          >
            <Image
              src="https://pawelperfect.pl/wp-content/uploads/2025/07/output-onlinepngtools-1-1.png"
              alt="Ting Tong Logo"
              width={192}
              height={192}
            />
          </motion.div>

          <AnimatePresence>
          {contentVisible && (
            <motion.div
              className="text-center mt-12"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.68, -0.55, 0.27, 1.55] }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">{t('selectLang')}</h2>
              <div className="flex flex-col gap-4 w-64">
                <Button
                  onClick={() => handleLangSelect('pl')}
                  disabled={!!selectedLang}
                  className={`text-base py-6 transition-all ${selectedLang === 'pl' ? 'bg-pink-600 border-pink-600' : 'bg-white/5 border border-white/20 hover:bg-white/10'}`}
                >
                  {t('polish')}
                </Button>
                <Button
                  onClick={() => handleLangSelect('en')}
                  disabled={!!selectedLang}
                  className={`text-base py-6 transition-all ${selectedLang === 'en' ? 'bg-pink-600 border-pink-600' : 'bg-white/5 border border-white/20 hover:bg-white/10'}`}
                >
                  {t('english')}
                </Button>
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
