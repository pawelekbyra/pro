"use client";

import React, { useEffect } from 'react';
import Preloader from './Preloader';
import { useTranslation } from '@/context/LanguageContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLangSelected } = useTranslation();

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  return (
    <>
      <Preloader />
      {isLangSelected && children}
    </>
  );
}
