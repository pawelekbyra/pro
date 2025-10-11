// ============================================================================
// PWA.JS - PATCH FIX
// Naprawia detekcję instalacji: sprawdza czy aplikacja faktycznie
// jest zainstalowana w systemie, a nie tylko czy była w przeszłości
// ============================================================================

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
 * ✅ POPRAWIONA FUNKCJA - sprawdza czy aplikacja AKTUALNIE jest zainstalowana
 * Nie używa sessionStorage - tylko czyste API przeglądarki
 */
const isStandalone = () => {
  // Metoda 1: Standard Web API (najbardziej niezawodna)
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // Metoda 2: iOS Safari
  if (window.navigator.standalone === true) {
    return true;
  }

  // Metoda 3: Fullscreen mode
  if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) {
    return true;
  }

  // Metoda 4: Android - sprawdź URL query param
  if (window.location.search && window.location.search.includes('utm_source=homescreen')) {
    return true;
  }

  // ❌ USUNIĘTO: sessionStorage i document.referrer - niereliable po odinstalowaniu
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
 * ✅ UPROSZCZONA FUNKCJA - sprawdza tylko aktualny stan, bez sessionStorage
 */
function runStandaloneCheck() {
  console.log("[PWA Check] Running standalone check...");
  const appFrame = document.getElementById("app-frame");

  if (isStandalone()) {
    console.log("[PWA Check] ✅ App IS installed - hiding install bar");

    if (installBar) {
      installBar.style.display = 'none';
      installBar.classList.remove("visible");
      installBar.setAttribute('aria-hidden', 'true');

      if (appFrame) {
        appFrame.classList.remove("app-frame--pwa-visible");
      }
    }

    return true;
  } else {
    console.log("[PWA Check] ⚠️ App NOT installed - can show install bar");

    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden =
      (preloader && preloader.classList.contains("preloader-hiding")) ||
      (container && container.classList.contains("ready"));

    if (isPreloaderHidden && installBar) {
      console.log("[PWA Check] Showing install bar");
      installBar.classList.add("visible");
      installBar.setAttribute('aria-hidden', 'false');

      if (appFrame) {
        appFrame.classList.add("app-frame--pwa-visible");
      }
    }
  }

  return false;
}

/**
 * ✅ KLUCZOWA POPRAWKA - zawsze sprawdza aktualny stan przed działaniem
 */
function handleInstallClick() {
  console.log('[PWA] 🖱️ Install button clicked');

  // ✅ ZAWSZE sprawdź aktualny stan instalacji (realtime check)
  const currentlyInstalled = isStandalone();

  console.log('[PWA] 📊 Debug info:', {
    currentlyInstalled,
    hasPrompt: !!installPromptEvent,
    isIOS: isIOS(),
    isDesktop: isDesktop(),
    userAgent: navigator.userAgent
  });

  // 1. ✅ Jeśli aplikacja JUŻ JEST zainstalowana - pokaż toast
  if (currentlyInstalled) {
    console.log('[PWA] ℹ️ App already installed - showing toast');
    if (typeof UI !== 'undefined' && UI.showAlert) {
      UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    }
    return;
  }

  // 2. ✅ Aplikacja NIE jest zainstalowana - kontynuuj instalację
  console.log('[PWA] ✅ App not installed - proceeding with installation');

  // Standardowy prompt (Chrome/Edge/Android)
  if (installPromptEvent) {
    console.log('[PWA] 🎯 Triggering install prompt...');

    try {
      installPromptEvent.prompt();

      installPromptEvent.userChoice
        .then((choiceResult) => {
          console.log(`[PWA] User choice: ${choiceResult.outcome}`);

          if (choiceResult.outcome === "accepted") {
            console.log('[PWA] ✅ User accepted installation');
            // DEVELOPER NOTE: Usunięto natychmiastowe ukrywanie paska.
            // Jego widoczność jest teraz zarządzana wyłącznie przez
            // funkcję runStandaloneCheck(), która okresowo sprawdza
            // faktyczny stan instalacji aplikacji.
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

  // Fallback - prompt nie gotowy
  console.warn('[PWA] ⚠️ Install prompt not available');
  if (typeof UI !== 'undefined' && UI.showAlert) {
    UI.showAlert(
      "Instalacja nie jest jeszcze gotowa. Odśwież stronę (F5) i spróbuj ponownie za chwilę.",
      true
    );
  } else {
    alert("Instalacja nie jest jeszcze gotowa. Odśwież stronę i spróbuj ponownie.");
  }
}

function init() {
  console.log('[PWA] 🚀 Initializing PWA module...');

  if (installButton) {
    installButton.disabled = true;
    installButton.addEventListener("click", handleInstallClick);
  }

  // Przechwyć beforeinstallprompt
  if ("onbeforeinstallprompt" in window) {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log('[PWA] 📱 beforeinstallprompt event fired');
      e.preventDefault();
      installPromptEvent = e;
      if (installButton) {
        installButton.disabled = false;
        console.log('[PWA] ✅ Install button enabled');
      }
    });

    window.addEventListener("appinstalled", () => {
      console.log('[PWA] ✅ PWA was installed');
      installPromptEvent = null;
      // DEVELOPER NOTE (v2): Usunięto ukrywanie paska z tego eventu.
      // Widoczność jest teraz w pełni zarządzana przez runStandaloneCheck(),
      // co zapobiega przedwczesnemu zniknięciu paska.
      if (typeof UI !== 'undefined' && UI.showAlert) {
        UI.showAlert("Aplikacja została zainstalowana!");
      }
    });
  } else {
    console.warn('[PWA] ⚠️ beforeinstallprompt not supported on this browser');
  }

  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // Initial check
  console.log('[PWA] 🔍 Running initial standalone check...');
  const isConfirmed = runStandaloneCheck();

  // ✅ Tylko jeśli NIE jest zainstalowana, obserwuj zmiany
  if (!isConfirmed) {
    // Sprawdź ponownie gdy użytkownik wraca do karty
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[PWA] 👁️ Page visible - rechecking installation status');
        runStandaloneCheck();
      }
    });

    // Obserwuj koniec preloadera
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
}

export const PWA = { init, handleInstallClick, closePwaModals, isStandalone };

// ============================================================================
// PODSUMOWANIE ZMIAN:
// ============================================================================
// 1. ✅ Usunięto sessionStorage.setItem('pwa_detected') - niereliable
// 2. ✅ Usunięto sprawdzanie document.referrer - może dawać false positives
// 3. ✅ handleInstallClick() ZAWSZE wywołuje isStandalone() na początku
// 4. ✅ Jeśli isStandalone() === true → pokazuje toast i return
// 5. ✅ Jeśli isStandalone() === false → kontynuuje instalację normalnie
// 6. ✅ runStandaloneCheck() nie używa żadnego cache - tylko czyste API
// 7. ✅ Dodano recheck przy powrocie do karty (visibilitychange)
// ============================================================================