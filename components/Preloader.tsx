"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { VideoItem } from 'react-vertical-feed';
import { Slide as SlideType } from '@/lib/types';

const fetchSlides = async () => {
    const res = await fetch(`/api/slides?cursor=&limit=1`); // Wystarczy pobrać jeden slajd
    if (!res.ok) {
        throw new Error('Failed to fetch slides');
    }
    const data = await res.json();
    return data;
};

const Preloader: React.FC = () => {
  const { t, selectInitialLang, isLangSelected } = useTranslation();
  const { setPreloadedSlide } = useStore();
  const [isHiding, setIsHiding] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Rozpoczęcie ładowania danych od razu, zanim użytkownik wybierze język
  const { data, isLoading: isQueryLoading, isFetched } = useQuery({
      queryKey: ['slides', 'preload'],
      queryFn: fetchSlides,
      enabled: !isLangSelected, // Uruchamiamy tylko raz
  });

  const handleLangSelect = (lang: 'pl' | 'en') => {
    selectInitialLang(lang);
    setShowLoadingBar(true); // Pokaż pasek ładowania
  };

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isFetched && data?.slides.length > 0) {
      setPreloadedSlide(data.slides[0]);
    }
  }, [data, isFetched, setPreloadedSlide]);

  useEffect(() => {
    // Symulacja ładowania wideo po wyborze języka
    if (showLoadingBar) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsHiding(true); // Ukryj preloader, gdy gotowe
            return 100;
          }
          // Ten warunek jest kluczowy - czekamy, aż dane będą gotowe
          if (isFetched) {
            return prev + 10;
          }
          return prev;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showLoadingBar, isFetched]);

  useEffect(() => {
      if (isLangSelected && !isQueryLoading) {
          setIsHiding(true);
      }
  }, [isLangSelected, isQueryLoading]);

  return (
    <AnimatePresence>
      {!isHiding && (
        <motion.div
          className="fixed inset-0 bg-black z-[10000] overflow-hidden flex flex-col items-center justify-center p-4 gap-8"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* ... (pozostała część komponentu preloader'a, bez zmian) ... */}
          <motion.div
            className="w-[150px] h-[150px] flex-shrink-0"
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
          {showLoadingBar ? (
            <motion.div
              className="w-full max-w-sm flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-white">Ładowanie...</p>
              <div className="w-full h-2 bg-white/20 rounded-full">
                <motion.div
                  className="h-full bg-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="w-full max-w-sm flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: contentVisible ? 1 : 0, y: contentVisible ? 0 : 50 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
            >
              <div className="text-center w-full flex flex-col items-center">
                <h2 className="text-xl font-semibold text-white mb-6">{t('selectLang')}</h2>
                <div className="flex flex-col gap-4 w-full">
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
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
