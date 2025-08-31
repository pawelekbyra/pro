"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';

const PWAInstallPrompt = () => {
    // ... (stary kod)
    const [isDesktop, setIsDesktop] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        // ... (stary kod)
        setIsDesktop(window.innerWidth > 768); // Ustawienie isDesktop dla ekranów > 768px
        if (window.matchMedia('(display-mode: standalone)').matches) {
          setIsStandalone(true);
        }

        const userAgent = window.navigator.userAgent;
        if (/iPhone|iPad|iPod/i.test(userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
          setIsIOS(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
          e.preventDefault();
          setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
      if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          setInstallPrompt(null);
        });
      } else if (isIOS) {
        setShowInstructions(true);
      }
    };

    const handleCloseInstructions = () => {
      setShowInstructions(false);
    };

    // Proszę dodać ten fragment do return()
    if (isDesktop && !isStandalone) {
        return (
            <motion.div
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="bg-zinc-800 text-white rounded-lg p-8 shadow-xl">
                    <h3 className="text-2xl font-bold mb-4">Pobierz aplikację na telefon</h3>
                    <p className="mb-6">
                        Wersja na komputery stacjonarne nie obsługuje pełnego doświadczenia.
                        Proszę zeskanować kod QR lub wejść na naszą stronę na telefonie,
                        aby pobrać aplikację i odkryć świat tingotong!
                    </p>
                    {/* Można dodać tutaj obrazek z kodem QR */}
                    <div className="w-32 h-32 bg-white mx-auto">
                        {/* Placeholder for QR Code */}
                    </div>
                </div>
            </motion.div>
        );
    }

    if (isStandalone || (!installPrompt && !isIOS)) {
        return null;
    }

  return (
    <>
      <AnimatePresence>
        {showInstructions && isIOS && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md text-white p-4 flex flex-col justify-between items-center z-50 rounded-t-2xl"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            <div className="flex w-full justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Jak zainstalować aplikację</h3>
              <Button variant="ghost" size="icon" onClick={handleCloseInstructions}>
                <X />
              </Button>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center text-sm">
              <p>1. Stuknij ikonę **udostępniania** na pasku przeglądarki Safari.</p>
              <Share size={32} className="text-white drop-shadow-lg" />
              <p>2. Z menu, które się pojawi, wybierz **&quot;Dodaj do ekranu początkowego&quot;**.</p>
              <PlusSquare size={32} className="text-white drop-shadow-lg" />
              <p>3. Potwierdź, a aplikacja pojawi się na Twoim ekranie!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-between items-center z-50">
        <div>
          <p className="font-bold">Zainstaluj aplikację!</p>
          <p>Uzyskaj pełne wrażenia. Zainstaluj naszą aplikację na swoim urządzeniu.</p>
        </div>
        <Button onClick={handleInstallClick}>
          Zainstaluj
        </Button>
      </div>
    </>
  );
};

export default PWAInstallPrompt;
