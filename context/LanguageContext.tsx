"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import plTranslations from '@/locales/pl.json';
import enTranslations from '@/locales/en.json';

const translations = {
  pl: plTranslations,
  en: enTranslations,
};

type Language = 'pl' | 'en';

interface LanguageContextType {
  lang: Language;
  isLangSelected: boolean;
  t: (key: string, params?: { [key: string]: string }) => string;
  selectInitialLang: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('pl');
  const [isLangSelected, setIsLangSelected] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang && (savedLang === 'pl' || savedLang === 'en')) {
      setLangState(savedLang);
      setIsLangSelected(true); // Skip preloader if language is already set
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  }, []);

  const selectInitialLang = (initialLang: Language) => {
    setLanguage(initialLang);
    setIsLangSelected(true);
  };

  const toggleLanguage = () => {
    const newLang = lang === 'pl' ? 'en' : 'pl';
    setLanguage(newLang);
  };

  const t = (key: string, params?: { [key: string]: string }) => {
    let text = translations[lang][key as keyof typeof translations[Language]] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        text = text.replace(`{${pKey}}`, params[pKey] || '');
      });
    }
    return text;
  };

  const value = { lang, t, isLangSelected, selectInitialLang, toggleLanguage };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
