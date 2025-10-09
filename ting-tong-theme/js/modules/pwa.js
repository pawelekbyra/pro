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

/**
 * Uproszczona funkcja sprawdzająca. Jej jedynym zadaniem jest ukrycie
 * paska instalacji, jeśli aplikacja JEST JUŻ w trybie standalone.
 */
function runStandaloneCheck() {
  if (isStandalone()) {
    console.log("[PWA Check] ✅ Standalone CONFIRMED. Hiding install bar.");
    sessionStorage.setItem('pwa_detected', 'true');
    if (installBar) {
      installBar.style.display = 'none'; // Użyj stylu inline, aby nadpisać wszystko
    }
    return true; // Zwróć true, aby zatrzymać dalsze sprawdzanie
  }
  console.log("[PWA Check] ⚠️ Standalone NOT detected.");
  return false;
}

/**
 * Inicjalizacja modułu PWA.
 */
function init() {
  console.log('[PWA] 🚀 Initializing PWA module...');

  // 1. Sprawdź od razu, czy już nie jesteśmy w PWA. Jeśli tak, nie rób nic więcej.
  if (runStandaloneCheck()) {
    return;
  }

  // 2. Nasłuchuj na zdarzenie `beforeinstallprompt` - to jedyne źródło prawdy.
  window.addEventListener("beforeinstallprompt", (e) => {
    console.log('[PWA] 📱 beforeinstallprompt event fired. App is installable.');
    e.preventDefault();
    installPromptEvent = e;

    // Pokaż pasek i aktywuj przycisk TYLKO TERAZ
    if (installBar && installButton) {
      console.log('[PWA] ✅ Showing install bar and enabling button.');
      installBar.classList.add("visible");
      installBar.setAttribute('aria-hidden', 'false');
      installButton.disabled = false;

      // Dodaj obramowanie do app-frame
      const appFrame = document.getElementById("app-frame");
      if (appFrame) {
        appFrame.classList.add("app-frame--pwa-visible");
      }

      // Dodaj listener kliknięcia dopiero teraz, gdy jest co obsłużyć
      installButton.addEventListener("click", handleInstallClick);
    }
  });

  // 3. Nasłuchuj na zdarzenie `appinstalled` do posprzątania.
  window.addEventListener("appinstalled", () => {
    console.log('[PWA] ✅ PWA was successfully installed');
    installPromptEvent = null;

    if (installBar) {
      installBar.classList.remove("visible");
      const appFrame = document.getElementById("app-frame");
      if (appFrame) {
        appFrame.classList.remove("app-frame--pwa-visible");
      }
    }
    // Można tu dodać powiadomienie o sukcesie, jeśli jest taka potrzeba.
  });

  // 4. Obsługa przycisku zamykania dla instrukcji iOS.
  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // 5. Dodaj listener do wszystkich elementów, które mogą inicjować instalację
  //    (np. link w treści slajdu)
  document.body.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'install-pwa') {
          handleInstallClick();
      }
  });

  console.log('[PWA] Initialization complete. Waiting for beforeinstallprompt event...');
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
    if (typeof UI !== 'undefined' && UI.showAlert) {
      UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
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