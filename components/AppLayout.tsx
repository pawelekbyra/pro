"use client";

import React from 'react';
import Preloader from './Preloader';
import { useTranslation } from '@/context/LanguageContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLangSelected } = useTranslation();

  return (
    <>
      <Preloader />
      {isLangSelected && children}
    </>
  );
}
