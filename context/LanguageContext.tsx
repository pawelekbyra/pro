"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// A simplified version of the translations from tingtong.txt
const translations: Record<string, Record<string, string>> = {
  pl: {
    loggedOutText: "Nie masz psychy się zalogować",
    loggedInWelcome: 'Witaj, {name}',
    selectLang: 'Wybierz Język',
    polish: 'Polski',
    english: 'English',
    loading: 'Ładowanie...',
    account: 'Konto',
    logout: 'Wyloguj',
  },
  en: {
    loggedOutText: "You don't have the guts to log in",
    loggedInWelcome: 'Welcome, {name}',
    selectLang: 'Select Language',
    polish: 'Polski',
    english: 'English',
    loading: 'Loading...',
    account: 'Account',
    logout: 'Logout',
  }
};

type Language = 'pl' | 'en';

interface LanguageContextType {
  lang: Language;
  isLangSelected: boolean;
  t: (key: string, params?: { [key: string]: string }) => string;
  selectInitialLang: (lang: Language) => void;
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

  const selectInitialLang = (initialLang: Language) => {
    setLangState(initialLang);
    localStorage.setItem('app_lang', initialLang);
    setIsLangSelected(true);
  };

  const t = (key: string, params?: { [key: string]: string }) => {
    let text = translations[lang]?.[key] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        text = text.replace(`{${pKey}}`, params[pKey] || '');
      });
    }
    return text;
  };

  const value = { lang, t, isLangSelected, selectInitialLang };

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
