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
        shareText: 'Szeruj',
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
        notificationsError: 'Błąd ładowania powiadomień.',
        notif1Preview: 'Nowa wiadomość od Admina',
        notif1Time: '2 min temu',
        notif1Full: 'Cześć! Chcieliśmy tylko dać znać, że nowa wersja aplikacji jest już dostępna. Sprawdź nowe funkcje w panelu konta!',
        notif2Preview: 'Twój profil został zaktualizowany',
        notif2Time: '10 min temu',
        notif2Full: 'Twoje zmiany w profilu zostały pomyślnie zapisane. Możesz je przejrzeć w dowolnym momencie, klikając w swój awatar.',
        notif3Preview: 'Specjalna oferta czeka na Ciebie!',
        notif3Time: '1 godz. temu',
        notif3Full: 'Nie przegap! Przygotowaliśmy dla Ciebie specjalną letnią promocję. Zgarnij dodatkowe bonusy już teraz. Oferta ograniczona czasowo.',
        mockNotif1Preview: 'Nowa wiadomość od Supportu',
        mockNotif1Full: 'Dziękujemy za zgłoszenie! Pracujemy nad rozwiązaniem Twojego problemu.',
        mockNotif2Preview: 'Zdobyłeś nowe osiągnięcie!',
        mockNotif2Full: 'Gratulacje! Odblokowałeś osiągnięcie "Mistrz Absurdu" za 100 obejrzanych slajdów.',
        mockNotif3Preview: 'Specjalna oferta dla Ciebie!',
        mockNotif3Full: 'Otrzymaj 50% zniżki na zakup wirtualnej kawy dla dewelopera. Użyj kodu: JULES_RULEZ',
        // Nowe tłumaczenia
        notificationsFromUser: 'Nowa wiadomość od {name}',
        likeNotification: '{name} polubił Twój film.',
        commentNotification: '{name} skomentował Twój film.',
        followNotification: '{name} zaczął Cię obserwować.',
        loadingProfile: 'Ładowanie profilu...',
        profileUpdateSuccess: 'Profil zaktualizowany pomyślnie!',
        profileUpdateError: 'Błąd aktualizacji profilu.',
        avatarUploadSuccess: 'Awatar zaktualizowany pomyślnie!',
        avatarUploadError: 'Błąd wysyłania awatara.',
        avatarAlt: 'Awatar użytkownika',
        changeAvatarTitle: 'Zmień awatar',
        patronTier: 'Patron Miłości', // Nowy klucz
        personalData: 'Dane osobowe',
        firstName: 'Imię',
        firstNamePlaceholder: 'Twoje imię',
        lastName: 'Nazwisko',
        lastNamePlaceholder: 'Twoje nazwisko',
        email: 'Email',
        emailPlaceholder: 'email@example.com',
        saving: 'Zapisywanie...',
        saveChanges: 'Zapisz zmiany',
        settings: 'Ustawienia',
        settingsSaveSuccess: 'Ustawienia zapisane pomyślnie!',
        emailConsent: 'Zgody email',
        emailLanguage: 'Język wiadomości email',
        saveSettings: 'Zapisz ustawienia',
        deleteAccountConfirmText: 'USUWAM KONTO',
        deleteAccountConfirmError: 'Tekst potwierdzający jest nieprawidłowy.',
        deleteAccountError: 'Błąd usuwania konta.',
        deleteAccountTitle: 'Usuń konto',
        warningTitle: '⚠️ Uwaga!',
        deleteAccountWarning: 'Ta operacja jest nieodwracalna. Wszystkie Twoje dane, filmy i ustawienia zostaną trwale usunięte.',
        deleteAccountPrompt: 'Aby potwierdzić, wpisz:',
        deleteAccountInfo: 'Po usunięciu konta zostaniesz automatycznie wylogowany.',
        deleting: 'Usuwanie...',
        deleteAccountButton: 'Trwale usuń konto',
        loginPlaceholder: 'Login',
        passwordPlaceholder: 'Hasło',
        loggingIn: 'Logowanie...',
        loginButton: 'Wejdź',
        loginUnknownError: 'Wystąpił nieznany błąd.',
        userAvatar: 'Awatar użytkownika {user}',
        reply: 'Odpowiedz',
        commentsTitle: '{count} komentarzy',
        yourAvatar: 'Twój awatar',
        addCommentPlaceholder: 'Dodaj komentarz...',
        sendButton: 'Wyślij',
        noCommentsYet: 'Brak komentarzy. Bądź pierwszy!',
        changePasswordTitle: 'Zmień hasło',
        currentPasswordLabel: 'Aktualne hasło',
        currentPasswordPlaceholder: 'Wpisz aktualne hasło',
        newPasswordLabel: 'Nowe hasło',
        newPasswordPlaceholder: 'Minimum 8 znaków',
        confirmPasswordLabel: 'Potwierdź nowe hasło',
        confirmPasswordPlaceholder: 'Potwierdź nowe hasło',
        passwordMinLength: 'Hasło musi mieć co najmniej 8 znaków.',
        changingPassword: 'Zmienianie...',
        changePasswordButton: 'Zmień hasło',
        passwordChangeSuccess: 'Hasło zmienione pomyślnie!',
        passwordChangeError: 'Nie udało się zmienić hasła.',
        cropAvatarTitle: 'Przytnij Awatar',
        closeCropModalAriaLabel: 'Zamknij okno przycinania',
        cropCanvasAriaLabel: 'Obszar do przycinania awatara',
        zoomOutAriaLabel: 'Pomniejsz',
        zoomSliderAriaLabel: 'Suwak powiększenia',
        zoomInAriaLabel: 'Powiększ',
        saveAvatarAriaLabel: 'Zapisz nowy awatar',
        saveAvatarButton: 'Zapisz Awatar',
        adminPanel: 'Panel Admina',
        installPwaAriaLabel: 'Pobierz aplikację',
        installAppText: 'Pobierz',
        pwaModalTitle: 'Doświadczenie Ting Tong czeka na telefonie!',
        pwaModalBody: 'Zeskanuj kod QR poniżej lub odwiedź nas na telefonie, aby pobrać aplikację i cieszyć się pełnią możliwości.'
    },
    en: {
        loggedOutText: "Don't have the guts to log in",
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
        deleteTab: 'Delete',
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
        notificationsError: 'Failed to load notifications.',
        notif1Preview: 'New message from Admin',
        notif1Time: '2 mins ago',
        notif1Full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!',
        notif2Preview: 'Your profile has been updated',
        notif2Time: '10 mins ago',
        notif2Full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.',
        notif3Preview: 'A special offer is waiting for you!',
        notif3Time: '1 hour ago',
        notif3Full: 'Don\'t miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.',
        mockNotif1Preview: 'New message from Support',
        mockNotif1Full: 'Thanks for your report! We are working on a solution to your problem.',
        mockNotif2Preview: 'You have a new achievement!',
        mockNotif2Full: 'Congratulations! You have unlocked the "Master of Absurdity" achievement for watching 100 slides.',
        mockNotif3Preview: 'Special offer for you!',
        mockNotif3Full: 'Get a 50% discount on the purchase of a virtual coffee for the developer. Use the code: JULES_RULEZ',
        // Nowe tłumaczenia
        notificationsFromUser: 'New message from {name}',
        likeNotification: '{name} liked your video.',
        commentNotification: '{name} commented on your video.',
        followNotification: '{name} started following you.',
        loadingProfile: 'Loading profile...',
        profileUpdateSuccess: 'Profile updated successfully!',
        profileUpdateError: 'Failed to update profile.',
        avatarUploadSuccess: 'Avatar updated successfully!',
        avatarUploadError: 'Failed to upload avatar.',
        avatarAlt: 'User avatar',
        changeAvatarTitle: 'Change avatar',
        patronTier: 'Patron of Love', // Nowy klucz
        personalData: 'Personal Data',
        firstName: 'First Name',
        firstNamePlaceholder: 'Your first name',
        lastName: 'Last Name',
        lastNamePlaceholder: 'Your last name',
        email: 'Email',
        emailPlaceholder: 'email@example.com',
        saving: 'Saving...',
        saveChanges: 'Save Changes',
        settings: 'Settings',
        settingsSaveSuccess: 'Settings saved successfully!',
        emailConsent: 'Email Consent',
        emailLanguage: 'Email Language',
        saveSettings: 'Save Settings',
        deleteAccountConfirmText: 'DELETE ACCOUNT',
        deleteAccountConfirmError: 'Confirmation text is incorrect.',
        deleteAccountError: 'Failed to delete account.',
        deleteAccountTitle: 'Delete',
        warningTitle: '⚠️ Warning!',
        deleteAccountWarning: 'This operation is irreversible. All your data, videos, and settings will be permanently deleted.',
        deleteAccountPrompt: 'To confirm, type:',
        deleteAccountInfo: 'After deleting your account, you will be automatically logged out.',
        deleting: 'Deleting...',
        deleteAccountButton: 'Delete Account',
        loginPlaceholder: 'Login',
        passwordPlaceholder: 'Password',
        loggingIn: 'Logging in...',
        loginButton: 'Enter',
        loginUnknownError: 'An unknown error occurred.',
        userAvatar: "{user}'s avatar",
        reply: 'Reply',
        commentsTitle: '{count} comments',
        yourAvatar: 'Your avatar',
        addCommentPlaceholder: 'Add a comment...',
        sendButton: 'Send',
        noCommentsYet: 'No comments yet. Be the first!',
        changePasswordTitle: 'Change Password',
        currentPasswordLabel: 'Current Password',
        currentPasswordPlaceholder: 'Enter current password',
        newPasswordLabel: 'New Password',
        newPasswordPlaceholder: 'Minimum 8 characters',
        confirmPasswordLabel: 'Confirm New Password',
        confirmPasswordPlaceholder: 'Confirm new password',
        passwordMinLength: 'Password must be at least 8 characters long.',
        changingPassword: 'Changing...',
        changePasswordButton: 'Change Password',
        passwordChangeSuccess: 'Password changed successfully!',
        passwordChangeError: 'Failed to change password.',
        cropAvatarTitle: 'Crop Avatar',
        closeCropModalAriaLabel: 'Close crop modal',
        cropCanvasAriaLabel: 'Avatar cropping area',
        zoomOutAriaLabel: 'Zoom out',
        zoomSliderAriaLabel: 'Zoom slider',
        zoomInAriaLabel: 'Zoom in',
        saveAvatarAriaLabel: 'Save new avatar',
        saveAvatarButton: 'Save Avatar',
        adminPanel: 'Admin Panel',
        installPwaAriaLabel: 'Download App',
        installAppText: 'Download',
        pwaModalTitle: 'The full Ting Tong experience is on your phone!',
        pwaModalBody: 'Scan the QR code below or visit us on your phone to download the app and unlock the full experience.'
    }
};

type Language = 'pl' | 'en';

interface LanguageContextType {
  lang: Language;
  isLangSelected: boolean;
  t: (key: string, params?: { [key: string]: string }) => string;
  selectInitialLang: (lang: Language) => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('pl');
  const [isLangSelected, setIsLangSelected] = useState(false);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_lang', newLang);
    }
  };

  const selectInitialLang = (initialLang: Language) => {
    setLanguage(initialLang);
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
    setLanguage(newLang);
  };

  const value = { lang, t, isLangSelected, selectInitialLang, toggleLanguage, setLanguage };

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
