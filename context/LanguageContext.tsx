"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

const translations: Record<string, Record<string, string>> = {
    pl: {
        loggedOutText: "Nie masz psychy się zalogować",
        loggedInWelcome: 'Witaj, {name}',
        loading: 'Ładowanie...',
        selectLang: 'Wybierz Język',
        polish: 'Polski',
        english: 'English',
        account: 'Konto',
        logout: 'Wyloguj',
        menuAriaLabel: 'Menu',
        subscribeAriaLabel: 'Subskrybuj',
        shareTitle: 'Udostępnij ten film!',
        shareAriaLabel: 'Udostępnij',
        shareText: 'Udostępnij',
        infoTitle: 'Informacje',
        infoAriaLabel: 'Informacje',
        infoText: 'Info',
        tipTitle: 'Postaw kawkę',
        tipAriaLabel: 'Postaw kawkę autorowi',
        tipText: 'Napiwek',
        languageAriaLabel: 'Zmień język',
        languageText: 'PL',
        subscribeAlert: 'Zaloguj się, aby subskrybować.',
        likeAlert: 'Zaloguj się, aby polubić.',
        notificationAlert: 'Zaloguj się, aby zobaczyć powiadomienia.',
        menuAccessAlert: 'Zaloguj się, aby uzyskać dostęp do menu.',
        logoutSuccess: 'Zostałeś pomyślnie wylogowany.',
        likeError: 'Błąd połączenia z serwerem.',
        likedToast: 'Polubiono!',
        unlikedToast: 'Cofnięto polubienie',
        secretTitle: 'Ściśle Tajne',
        secretSubtitle: 'Zaloguj się, aby odblokować',
        infoModalTitle: 'Informacje o Aplikacji',
        infoModalBodyP1: 'To jest demonstracyjna aplikacja wideo stworzona, aby pokazać możliwości nowoczesnych technologii webowych, takich jak Next.js, React i HLS.js.',
        infoModalBodyP2: 'Aplikacja symuluje popularne platformy z krótkimi filmami, implementując takie funkcje jak pre-loading wideo, adaptacyjny streaming i interaktywny interfejs.',
        infoModalBodyTip: 'Podoba Ci się projekt? Możesz wesprzeć autora, stawiając mu wirtualną kawę. Każdy gest motywuje do dalszego rozwoju!',
        infoModalBodyP3: 'Dziękujemy za odwiedziny! Zachęcamy do eksplorowania i testowania wszystkich funkcji.',
        closeAccountAriaLabel: 'Zamknij panel konta',
        closeInfoAriaLabel: 'Zamknij okno informacji',
        accountMenuButton: 'Konto',
        logoutLink: 'Wyloguj',
        profileTab: 'Profil',
        passwordTab: 'Hasło',
        deleteTab: 'Usuń konto',
        loggedInState: 'Zalogowany',
        loggedOutState: 'Gość',
        linkCopied: 'Link skopiowany do schowka!',
        likeAriaLabel: 'Polub',
        notificationAriaLabel: 'Powiadomienia',
        commentsAriaLabel: 'Komentarze',
        commentsModalTitle: 'Komentarze',
        closeCommentsAriaLabel: 'Zamknij komentarze',
        likeAriaLabelWithCount: 'Polub. Aktualna liczba polubień: {count}',
        unlikeAriaLabelWithCount: 'Cofnij polubienie. Aktualna liczba polubień: {count}',
        notificationsTitle: 'Powiadomienia',
        closeNotificationsAriaLabel: 'Zamknij powiadomienia',
        notificationsEmpty: 'Wszystko na bieżąco!',
        notif1Preview: 'Nowa wiadomość od Admina',
        notif1Time: '2 min temu',
        notif1Full: 'Cześć! Chcieliśmy tylko dać znać, że nowa wersja aplikacji jest już dostępna. Sprawdź nowe funkcje w panelu konta!',
        notif2Preview: 'Twój profil został zaktualizowany',
        notif2Time: '10 min temu',
        notif2Full: 'Twoje zmiany w profilu zostały pomyślnie zapisane. Możesz je przejrzeć w dowolnym momencie, klikając w swój awatar.',
        notif3Preview: 'Specjalna oferta czeka na Ciebie!',
        notif3Time: '1 godz. temu',
        notif3Full: 'Nie przegap! Przygotowaliśmy dla Ciebie specjalną letnią promocję. Zgarnij dodatkowe bonusy już teraz. Oferta ograniczona czasowo.'
    },
    en: {
        loggedOutText: "You don't have the guts to log in",
        loggedInWelcome: 'Welcome, {name}',
        loading: 'Loading...',
        selectLang: 'Select Language',
        polish: 'Polski',
        english: 'English',
        account: 'Account',
        logout: 'Logout',
        menuAriaLabel: 'Menu',
        subscribeAriaLabel: 'Subscribe',
        shareTitle: 'Share this video!',
        shareAriaLabel: 'Share',
        shareText: 'Share',
        infoTitle: 'Information',
        infoAriaLabel: 'Information',
        infoText: 'Info',
        tipTitle: 'Buy me a coffee',
        tipAriaLabel: 'Buy the author a coffee',
        tipText: 'Tip',
        languageAriaLabel: 'Change language',
        languageText: 'EN',
        subscribeAlert: 'Log in to subscribe.',
        likeAlert: 'Log in to like.',
        notificationAlert: 'Log in to see notifications.',
        menuAccessAlert: 'Log in to access the menu.',
        logoutSuccess: 'You have been successfully logged out.',
        likeError: 'Server connection error.',
        likedToast: 'Liked!',
        unlikedToast: 'Unliked',
        secretTitle: 'Top Secret',
        secretSubtitle: 'Log in to unlock',
        infoModalTitle: 'About The App',
        infoModalBodyP1: 'This is a demo video application created to showcase the capabilities of modern web technologies like Next.js, React, and HLS.js.',
        infoModalBodyP2: 'The application simulates popular short-form video platforms, implementing features like video pre-loading, adaptive streaming, and an interactive interface.',
        infoModalBodyTip: 'Like the project? You can support the author by buying them a virtual coffee. Every gesture is motivating for further development!',
        infoModalBodyP3: 'Thank you for visiting! Feel free to explore and test all the features.',
        closeAccountAriaLabel: 'Close account panel',
        closeInfoAriaLabel: 'Close information window',
        accountMenuButton: 'Account',
        logoutLink: 'Logout',
        profileTab: 'Profile',
        passwordTab: 'Password',
        deleteTab: 'Delete Account',
        loggedInState: 'Logged In',
        loggedOutState: 'Guest',
        linkCopied: 'Link copied to clipboard!',
        likeAriaLabel: 'Like',
        notificationAriaLabel: 'Notifications',
        commentsAriaLabel: 'Comments',
        commentsModalTitle: 'Comments',
        closeCommentsAriaLabel: 'Close comments',
        likeAriaLabelWithCount: 'Like. Current likes: {count}',
        unlikeAriaLabelWithCount: 'Unlike. Current likes: {count}',
        notificationsTitle: 'Notifications',
        closeNotificationsAriaLabel: 'Close notifications',
        notificationsEmpty: 'You are all caught up!',
        notif1Preview: 'New message from Admin',
        notif1Time: '2 mins ago',
        notif1Full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!',
        notif2Preview: 'Your profile has been updated',
        notif2Time: '10 mins ago',
        notif2Full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.',
        notif3Preview: 'A special offer is waiting for you!',
        notif3Time: '1 hour ago',
        notif3Full: 'Don\'t miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.'
    }
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

  const toggleLanguage = () => {
    const newLang = lang === 'pl' ? 'en' : 'pl';
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
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
