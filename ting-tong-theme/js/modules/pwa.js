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

function updateInstallButtonForInstalledState() {
  if (installButton) {
    installButton.textContent = Utils.getTranslation("alreadyInstalledText");
    installButton.disabled = true;
    installButton.classList.add('installed');
    console.log('[PWA] ✅ Install button updated to "installed" state.');
  }
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

function runStandaloneCheck() {
  console.log("[PWA Check] Running standalone check...");
  const appFrame = document.getElementById("app-frame");

  if (isStandalone()) {
    console.log("[PWA Check] ✅ Standalone CONFIRMED. Hiding install bar permanently.");
    sessionStorage.setItem('pwa_detected', 'true');

    if (installBar) {
      // Aplikacja jest w trybie PWA, więc pasek instalacji jest niepotrzebny.
      // Używamy stylu inline, aby mieć pewność, że zostanie ukryty.
      installBar.style.display = 'none';
      installBar.classList.remove("visible");
      installBar.setAttribute('aria-hidden', 'true');

      // Usuń odsunięcie z głównego kontenera aplikacji.
      if (appFrame) {
        appFrame.classList.remove("app-frame--pwa-visible");
      }
    }
    // Zakończ dalsze sprawdzanie, ponieważ stan jest już znany.
    return true;
  } else {
    // Aplikacja działa w przeglądarce.
    console.log("[PWA Check] ⚠️ Standalone NOT detected.");

    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden =
      (preloader && preloader.classList.contains("preloader-hiding")) ||
      (container && container.classList.contains("ready"));

    // Pokaż pasek instalacji, jeśli preloader już zniknął.
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

function init() {
  console.log('[PWA] 🚀 Initializing PWA module...');

  if (installButton) {
    installButton.addEventListener("click", handleInstallClick);
  }

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
      // Zaktualizuj przycisk, aby odzwierciedlić stan po instalacji.
      updateInstallButtonForInstalledState();
    });
  } else {
    console.warn('[PWA] ⚠️ beforeinstallprompt not supported on this browser');
  }

  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // Delay initial check
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
  }, 1000); // ✅ POPRAWKA: Delay 1s aby beforeinstallprompt miał czas
}

function handleInstallClick() {
  console.log('[PWA] 🖱️ Install button clicked');
  console.log('[PWA] 📊 Debug info:', {
    isStandalone: isStandalone(),
    hasPrompt: !!installPromptEvent,
    isIOS: isIOS(),
    isDesktop: isDesktop(),
    userAgent: navigator.userAgent
  });

  // 1. Już zainstalowane
  if (isStandalone()) {
    console.log('[PWA] ℹ️ Already installed');
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(Utils.getTranslation("alreadyInstalledText"));
    }
    return;
  }

  // 2. Standardowy prompt (Chrome/Edge/Android)
  if (installPromptEvent) {
    console.log('[PWA] 🎯 Triggering install prompt...');

    try {
      installPromptEvent.prompt();

      installPromptEvent.userChoice
        .then((choiceResult) => {
          console.log(`[PWA] User choice: ${choiceResult.outcome}`);

          if (choiceResult.outcome === "accepted") {
            console.log('[PWA] ✅ User accepted installation');

            // Pasek instalacji pozostaje widoczny celowo.
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

  // 3. iOS - pokaż instrukcje
  if (isIOS()) {
    console.log('[PWA] 🍎 iOS detected - showing instructions');
    showIosInstructions();
    return;
  }

  // 4. Desktop - pokaż modal
  if (isDesktop()) {
    console.log('[PWA] 💻 Desktop detected - showing modal');
    showDesktopModal();
    return;
  }

  // 5. Fallback - prompt nie gotowy
  console.warn('[PWA] ⚠️ Install prompt not available');

  // ✅ NOWE: Zaproponuj refresh strony
  if (typeof UI !== 'undefined' && UI.showAlert) {
    UI.showAlert(
      "Instalacja nie jest jeszcze gotowa. Odśwież stronę (F5) i spróbuj ponownie za chwilę.",
      true
    );
  } else {
    alert("Instalacja nie jest jeszcze gotowa. Odśwież stronę i spróbuj ponownie.");
  }
}

export const PWA = { init, handleInstallClick, closePwaModals, isStandalone };