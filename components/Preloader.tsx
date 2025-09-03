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
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const { setPreloadedSlide, setIsMuted } = useStore(
    (state) => ({
      setPreloadedSlide: state.setPreloadedSlide,
      setIsMuted: state.setIsMuted,
    }),
    shallow
  );

  const [isHiding, setIsHiding] = useState(false);
  const [showLangButtons, setShowLangButtons] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  const { data, isFetched } = useQuery({
      queryKey: ['slides', 'preload'],
      queryFn: fetchSlides,
      staleTime: Infinity, // Preload only once
  });

  // Effect to show language buttons after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowLangButtons(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Effect to store the preloaded slide once fetched
  useEffect(() => {
    if (isFetched && data?.slides.length > 0) {
      setPreloadedSlide(data.slides[0]);
    }
  }, [data, isFetched, setPreloadedSlide]);

  // Effect to hide the preloader once all conditions are met
  useEffect(() => {
    if (isLangSelected && isFetched) {
      setIsHiding(true);
    }
  }, [isLangSelected, isFetched]);

  const handleLangSelect = (lang: 'pl' | 'en') => {
    // Immediately provide feedback by showing the loader
    setShowLoadingIndicator(true);
    selectInitialLang(lang);
    // We do not set isMuted here, assuming the user wants sound if they interact
    // Let's stick to the user's request: interaction should enable sound.
    setIsMuted(false);
  };

  return (
    <AnimatePresence>
      {!isHiding && (
        <motion.div
          className="fixed inset-0 bg-black z-[10000] overflow-hidden flex flex-col items-center justify-center p-4 gap-8"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.3 } }}
        >
          <motion.div
            className="w-[150px] h-[150px] flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {showLoadingIndicator ? (
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-pink-500"
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
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
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
