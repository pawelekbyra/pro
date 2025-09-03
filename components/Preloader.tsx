"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { useQuery } from '@tanstack/react-query';

const fetchSlides = async () => {
    const res = await fetch(`/api/slides?cursor=&limit=1`);
    if (!res.ok) {
        throw new Error('Failed to fetch slides');
    }
    const data = await res.json();
    return data;
};

const Preloader: React.FC = () => {
  const { t, selectInitialLang } = useTranslation();
  const { setPreloadedSlide, setIsMuted } = useStore(
    (state) => ({
      setPreloadedSlide: state.setPreloadedSlide,
      setIsMuted: state.setIsMuted,
    }),
    shallow
  );

  const [isHiding, setIsHiding] = useState(false);
  const [showLangButtons, setShowLangButtons] = useState(false);

  // Fetch the first slide's data in the background.
  // This query will only run once and the data will be cached.
  const { data, isFetched } = useQuery({
      queryKey: ['slides', 'preload'],
      queryFn: fetchSlides,
      staleTime: Infinity,
  });

  // Once the data is fetched, set it in our global store.
  useEffect(() => {
    if (isFetched && data?.slides.length > 0) {
      setPreloadedSlide(data.slides[0]);
    }
  }, [data, isFetched, setPreloadedSlide]);

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
