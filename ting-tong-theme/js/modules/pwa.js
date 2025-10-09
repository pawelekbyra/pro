/**
 * ============================================================================
 * KOMPLEKSOWY PATCH DLA PRZYCISKU INSTALACJI PWA
 * ============================================================================
 *
 * PROBLEM:
 * - Przycisk "Zainstaluj" jest zablokowany (disabled) i nigdy nie zostaje odblokowany
 * - Przycisk czeka na event 'beforeinstallprompt', który może nie wystąpić
 * - Gdy aplikacja jest już zainstalowana, nie pokazuje się komunikat
 *
 * ROZWIĄZANIE:
 * - Odblokuj przycisk domyślnie przy inicjalizacji
 * - Zawsze pokazuj toast "Już ją pobrałeś/aś!" gdy aplikacja zainstalowana
 * - Uproszczona logika - działa zawsze, nie tylko gdy event wystąpi
 *
 * INSTRUKCJA:
 * Zastąp CAŁĄ zawartość pliku: ting-tong-theme/js/modules/pwa.js
 * ============================================================================
 */

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

function showDesktopModal() {
  if (desktopModal) UI.openModal(desktopModal);
}

function closePwaModals() {
  if (desktopModal && desktopModal.classList.contains("visible"))
    UI.closeModal(desktopModal);
  if (iosInstructions && iosInstructions.classList.contains("visible"))
    hideIosInstructions();
}

/**
 * Sprawdza czy aplikacja jest już zainstalowana i ukrywa pasek instalacji
 */
function runStandaloneCheck() {
  console.log("[PWA Check] 🔍 Running standalone check...");
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

    return true;
  } else {
    console.log("[PWA Check] ⚠️ Standalone NOT detected.");

    // Sprawdź czy preloader już zniknął
    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden =
      (preloader && preloader.classList.contains("preloader-hiding")) ||
      (container && container.classList.contains("ready"));

    // Pokaż pasek TYLKO jeśli preloader już zniknął
    if (isPreloaderHidden && installBar) {
      console.log("[PWA Check] 📣 Preloader gone, showing install bar.");
      installBar.classList.add("visible");
      installBar.setAttribute('aria-hidden', 'false');

      if (appFrame) {
        appFrame.classList.add("app-frame--pwa-visible");
      }
    } else {
      console.log("[PWA Check] ⏳ Preloader still active, waiting...");
    }
  }

  return false;
}

/**
 * Inicjalizacja modułu PWA
 */
function init() {
  console.log('[PWA] 🚀 Initializing PWA module...');

  // ✅ FIX #1: ZAWSZE odblokuj przycisk przy starcie
  if (installButton) {
    installButton.disabled = false;
    installButton.addEventListener("click", handleInstallClick);
    console.log('[PWA] ✅ Install button enabled by default');
  }

  // Przechwyć beforeinstallprompt gdy wystąpi
  if ("onbeforeinstallprompt" in window) {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log('[PWA] 📱 beforeinstallprompt event fired');
      e.preventDefault();
      installPromptEvent = e;
      console.log('[PWA] 📦 Install prompt event stored');
    });

    window.addEventListener("appinstalled", () => {
      console.log('[PWA] ✅ PWA was installed');
      installPromptEvent = null;

      if (installBar) {
        installBar.classList.remove("visible");
        const appFrame = document.getElementById("app-frame");
        if (appFrame) {
          appFrame.classList.remove("app-frame--pwa-visible");
        }
      }

      // ✅ FIX #2: Pokaż toast po instalacji
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(Utils.getTranslation("alreadyInstalledText"));
      }
    });
  } else {
    console.warn('[PWA] ⚠️ beforeinstallprompt not supported on this browser');
  }

  // iOS close button
  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // Delay initial check - daj czas na załadowanie
  setTimeout(() => {
    console.log('[PWA] 🔍 Running initial standalone check...');
    const isConfirmed = runStandaloneCheck();

    if (!isConfirmed) {
      // Listen for page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !sessionStorage.getItem('pwa_detected')) {
          runStandaloneCheck();
        }
      });

      // Recheck after preloader ends
      const preloader = document.getElementById("preloader");
      if (preloader) {
        const observer = new MutationObserver(() => {
          if (preloader.classList.contains("preloader-hiding")) {
            setTimeout(() => {
              if (!isStandalone() && installBar && !installBar.classList.contains("visible")) {
                console.log('[PWA] 📣 Showing install bar after preloader');
                installBar.classList.add("visible");
                installBar.setAttribute('aria-hidden', 'false');

                const appFrame = document.getElementById("app-frame");
                if (appFrame) {
                  appFrame.classList.add("app-frame--pwa-visible");
                }
              }
            }, 500);
          }
        });
        observer.observe(preloader, { attributes: true, attributeFilter: ['class'] });
      }
    }
  }, 1000);
}

/**
 * Obsługa kliknięcia przycisku instalacji
 */
function handleInstallClick() {
  console.log('[PWA] 🖱️ Install button clicked');
  console.log('[PWA] 📊 Debug info:', {
    isStandalone: isStandalone(),
    hasPrompt: !!installPromptEvent,
    isIOS: isIOS(),
    isDesktop: isDesktop(),
    userAgent: navigator.userAgent
  });

  // ✅ FIX #3: NAJPIERW sprawdź czy już zainstalowane
  if (isStandalone()) {
    console.log('[PWA] ℹ️ Already installed - showing toast');

    // Pokaż toast zamiast alert
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(Utils.getTranslation("alreadyInstalledText"));
    } else if (typeof UI !== 'undefined' && UI.showAlert) {
      // Fallback do alert jeśli toast nie działa
      UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    }
    return;
  }

  // Standardowy prompt (Chrome/Edge/Android)
  if (installPromptEvent) {
    console.log('[PWA] 🎯 Triggering install prompt...');

    try {
      installPromptEvent.prompt();

      installPromptEvent.userChoice
        .then((choiceResult) => {
          console.log(`[PWA] 👤 User choice: ${choiceResult.outcome}`);

          if (choiceResult.outcome === "accepted") {
            console.log('[PWA] ✅ User accepted installation');

            // Ukryj pasek po akceptacji
            if (installBar) {
              installBar.classList.remove("visible");
              const appFrame = document.getElementById("app-frame");
              if (appFrame) {
                appFrame.classList.remove("app-frame--pwa-visible");
              }
            }
          } else {
            console.log('[PWA] ❌ User dismissed installation');
          }

          installPromptEvent = null;
        })
        .catch((error) => {
          console.error('[PWA] ❌ Prompt error:', error);
          if (typeof UI !== 'undefined' && UI.showAlert) {
            UI.showAlert("Wystąpił błąd podczas instalacji. Odśwież stronę i spróbuj ponownie.", true);
          }
        });

      return;
    } catch (error) {
      console.error('[PWA] ❌ Failed to show prompt:', error);
    }
  }

  // iOS - pokaż instrukcje
  if (isIOS()) {
    console.log('[PWA] 🍎 iOS detected - showing instructions');
    showIosInstructions();
    return;
  }

  // Desktop - pokaż modal
  if (isDesktop()) {
    console.log('[PWA] 💻 Desktop detected - showing modal');
    showDesktopModal();
    return;
  }

  // ✅ FIX #4: Fallback - prompt nie gotowy (uproszczony komunikat)
  console.warn('[PWA] ⚠️ Install prompt not available');

  if (typeof UI !== 'undefined' && UI.showToast) {
    UI.showToast("Instalacja niedostępna w tej przeglądarce. Spróbuj Chrome lub Edge.");
  } else if (typeof UI !== 'undefined' && UI.showAlert) {
    UI.showAlert(Utils.getTranslation("installNotReadyText"));
  }
}

// Export
export const PWA = {
  init,
  handleInstallClick,
  closePwaModals,
  isStandalone
};