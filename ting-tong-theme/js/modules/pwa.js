import { UI } from './ui.js';
import { Utils } from './utils.js';

// DOM Elements
const installBar = document.getElementById("pwa-install-bar");
const installButton = document.getElementById("pwa-install-button");
const iosInstructions = document.getElementById("pwa-ios-instructions");
const iosCloseButton = document.getElementById("pwa-ios-close-button");
const desktopModal = document.getElementById("pwa-desktop-modal");

// Predicates
const isIOS = () => {
  if (typeof window === "undefined" || !window.navigator) return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};
/**
 * Sprawdza, czy aplikacja działa w trybie samodzielnym (PWA).
 * @returns {boolean} True, jeśli aplikacja jest w trybie PWA.
 */
const isStandalone = () => {
  // Metoda 1: Standard Web API
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // Metoda 2: iOS Safari
  if (window.navigator.standalone === true) {
    return true;
  }

  // Metoda 3: Sprawdź czy jest w fullscreen
  if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) {
    return true;
  }

  // Metoda 4: Android - sprawdź URL query param (jeśli dodano via manifest)
  if (window.location.search && window.location.search.includes('utm_source=homescreen')) {
    return true;
  }

  // Metoda 5: Sprawdź document.referrer (pusty w PWA)
  if (document.referrer === '' && !window.opener) {
    // Pusty referrer + brak window.opener sugeruje PWA
    // ALE może być też bezpośrednie wejście przez URL
    // Więc sprawdzamy dodatkowo sessionStorage
    if (sessionStorage.getItem('pwa_detected') === 'true') {
      return true;
    }
  }

  return false;
};
const isDesktop = () => !isIOS() && !/Android/i.test(navigator.userAgent);

// State
let installPromptEvent = null;

// Actions
function showIosInstructions() {
  if (iosInstructions) iosInstructions.classList.add("visible");
}

function hideIosInstructions() {
  if (iosInstructions) iosInstructions.classList.remove("visible");
}

// KROK 1: Usunięto funkcję updatePwaBarForInstalled

function showDesktopModal() {
  if (desktopModal) UI.openModal(desktopModal);
}

function closePwaModals() {
  if (desktopModal && desktopModal.classList.contains("visible"))
    UI.closeModal(desktopModal);
  if (iosInstructions && iosInstructions.classList.contains("visible"))
    hideIosInstructions();
}

function runStandaloneCheck() {
  console.log("[PWA Check] Running standalone check...");
  const appFrame = document.getElementById("app-frame");

  if (isStandalone()) {
    console.log("[PWA Check] ✅ Standalone CONFIRMED. Hiding install bar permanently.");

    // Zapisz w sessionStorage żeby pamiętać
    sessionStorage.setItem('pwa_detected', 'true');

    if (installBar) {
      // WYMUSZAJ ukrycie przez inline style (najsilniejsze)
      installBar.style.display = 'none';
      installBar.classList.remove("visible");
      installBar.setAttribute('aria-hidden', 'true');

      // Usuń offset z app-frame
      if (appFrame) {
        appFrame.classList.remove("app-frame--pwa-visible");
      }
    }

    // Wyłącz dalsze sprawdzenia - już wiemy że to PWA
    return true;
  } else {
    console.log("[PWA Check] ⚠️ Standalone NOT detected.");

    // KROK 4: Sprawdź czy preloader już zniknął
    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden =
      (preloader && preloader.classList.contains("preloader-hiding")) ||
      (container && container.classList.contains("ready"));

    // Pokaż pasek TYLKO jeśli preloader już zniknął
    if (isPreloaderHidden && installBar) {
      console.log("[PWA Check] Preloader gone, showing install bar.");
      installBar.classList.add("visible");
      installBar.setAttribute('aria-hidden', 'false');

      if (appFrame) {
        appFrame.classList.add("app-frame--pwa-visible");
      }
    } else {
      console.log("[PWA Check] Preloader still active, waiting...");
    }
  }

  return false;
}

// Initialization
function init() {
  if (installButton) {
    installButton.addEventListener("click", handleInstallClick);
  }

  if ("onbeforeinstallprompt" in window) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      installPromptEvent = e;
      if (installButton) installButton.disabled = false;
    });

    // KROK 2: Zmieniona obsługa 'appinstalled'
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      installPromptEvent = null;

      // Ukryj pasek i pokaż tylko toast
      if (installBar) {
        installBar.classList.remove("visible");
        const appFrame = document.getElementById("app-frame");
        if (appFrame) {
          appFrame.classList.remove("app-frame--pwa-visible");
        }
      }

      // Pokaż komunikat
      if (typeof UI !== 'undefined' && UI.showAlert) {
        UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
      }
    });
  }

  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // Natychmiastowe sprawdzenie standalone
  const isConfirmed = runStandaloneCheck();

  if (!isConfirmed) {
    window.addEventListener('load', () => {
      const detected = runStandaloneCheck();

      if (!detected) {
        setTimeout(() => {
          runStandaloneCheck();
        }, 2000);

        // KROK 3: Usunięto setTimeout sprawdzający, czy aplikacja jest już zainstalowana
      }
    }, { once: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!sessionStorage.getItem('pwa_detected')) {
          runStandaloneCheck();
        }
      }
    });
  }

  // KROK 5: Dodano nasłuchiwanie na koniec preloadera
  const preloader = document.getElementById("preloader");
  if (preloader) {
    const checkPreloaderEnd = () => {
      if (preloader.classList.contains("preloader-hiding")) {
        console.log("[PWA] Preloader ended, checking if bar should show");
        setTimeout(() => {
          if (!isStandalone() && installBar && !installBar.classList.contains("visible")) {
            installBar.classList.add("visible");
            installBar.setAttribute('aria-hidden', 'false');

            const appFrame = document.getElementById("app-frame");
            if (appFrame) {
              appFrame.classList.add("app-frame--pwa-visible");
            }
          }
        }, 500); // Małe opóźnienie dla płynności
      }
    };

    // Sprawdź wielokrotnie bo nie ma zdarzenia transitionend na preloaderze
    const preloaderObserver = new MutationObserver(checkPreloaderEnd);
    preloaderObserver.observe(preloader, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

function handleInstallClick() {
  console.log('🔍 PWA Debug:', {
    isStandalone: isStandalone(),
    hasInstallPrompt: !!installPromptEvent,
    isIOS: isIOS(),
    isDesktop: isDesktop(),
    userAgent: navigator.userAgent
  });

  // ✅ FIX 3: Ulepszona obsługa błędów i logika instalacji

  // Warunek 1: Aplikacja jest już zainstalowana
  if (isStandalone()) {
    if (typeof UI !== 'undefined' && UI.showAlert) {
      UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    } else {
      alert(Utils.getTranslation("alreadyInstalledText"));
    }
    return;
  }

  // Warunek 2: Standardowy prompt instalacji jest dostępny (Chrome/Android)
  if (installPromptEvent) {
    try {
      installPromptEvent.prompt();
      installPromptEvent.userChoice
        .then((choiceResult) => {
          console.log(`PWA prompt user choice: ${choiceResult.outcome}`);
          if (choiceResult.outcome === "accepted") {
            console.log("✅ User accepted PWA installation");
            // Ukryj pasek po akceptacji
            if (installBar) {
              installBar.classList.remove("visible");
              const appFrame = document.getElementById("app-frame");
              if (appFrame) {
                appFrame.classList.remove("app-frame--pwa-visible");
              }
            }
          } else {
            console.log("❌ User dismissed PWA installation");
          }
        })
        .catch((error) => {
          console.error("❌ PWA prompt error:", error);
          if (typeof UI !== 'undefined' && UI.showAlert) {
            UI.showAlert("Wystąpił błąd podczas instalacji. Spróbuj ponownie później.", true);
          }
        });
      return;
    } catch (error) {
      console.error("❌ Failed to show install prompt:", error);
      if (typeof UI !== 'undefined' && UI.showAlert) {
        UI.showAlert("Nie można pokazać okna instalacji. Spróbuj dodać stronę do ekranu głównego manualnie.", true);
      }
      return;
    }
  }

  // Warunek 3: Użytkownik jest na iOS
  if (isIOS()) {
    showIosInstructions();
    return;
  }

  // Warunek 4: Użytkownik jest na desktopie
  if (isDesktop()) {
    showDesktopModal();
    return;
  }

  // Fallback: Przeglądarka nie wspiera PWA lub prompt nie jest gotowy
  console.warn("⚠️ PWA install not available");
  if (typeof UI !== 'undefined' && UI.showAlert) {
    UI.showAlert(Utils.getTranslation("installNotReadyText") || "Instalacja aplikacji nie jest jeszcze dostępna. Spróbuj ponownie za chwilę lub użyj opcji 'Dodaj do ekranu głównego' w menu przeglądarki.", true);
  } else {
    alert("Instalacja nie jest dostępna w tej przeglądarce.");
  }
}

export const PWA = { init, handleInstallClick, closePwaModals, isStandalone };