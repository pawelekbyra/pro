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
// isAppInstalled variable removed

// Actions
function showIosInstructions() {
  if (iosInstructions) iosInstructions.classList.add("visible");
}

function hideIosInstructions() {
  if (iosInstructions) iosInstructions.classList.remove("visible");
}

// setInstalledFlag function removed

function updatePwaUiForInstalledState() {
  if (!installBar) return;

  // setInstalledFlag() call removed

  // Ukryj pasek i usuń offset z app-frame
  installBar.classList.remove("visible");

  const appFrame = document.getElementById("app-frame");
  if (appFrame) {
    appFrame.classList.remove("app-frame--pwa-visible");
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
    console.log("[PWA Check] ⚠️ Standalone NOT detected - keeping current state.");
    // NIE ZMIENIAJ STANU - może być false positive
    // Pasek pokazuje się tylko przez CSS/HTML, nie wymuszamy go
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

      // Celowo nie ukrywamy paska, ma być widoczny zawsze w przeglądarce
      // if (installBar) installBar.classList.remove("visible");
    });

    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      installPromptEvent = null;
      // setInstalledFlag() call removed
      updatePwaUiForInstalledState();
    });
  }

  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // Natychmiastowe sprawdzenie (dla szybkich urządzeń)
  const isConfirmed = runStandaloneCheck();

  if (!isConfirmed) {
    // Jeśli nie wykryto od razu, spróbuj ponownie po załadowaniu DOM
    window.addEventListener('load', () => {
      const detected = runStandaloneCheck();

      if (!detected) {
        // Ostatnia próba po 2s (dla wolnych urządzeń)
        setTimeout(() => {
          runStandaloneCheck();
        }, 2000);
      }
    }, { once: true });

    // Sprawdź gdy użytkownik wraca (może wrócił z home screen)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Tylko jeśli wcześniej nie wykryto
        if (!sessionStorage.getItem('pwa_detected')) {
          runStandaloneCheck();
        }
      }
    });
  }
}

function handleInstallClick() {
  // Check if the app is already installed and show an alert.
  if (isStandalone()) {
    UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    return;
  }

  if (installPromptEvent) {
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult) => {
      console.log(`PWA prompt user choice: ${choiceResult.outcome}`);
      if (choiceResult.outcome === "accepted") {
        // The 'appinstalled' event will handle the UI change.
      } else {
        // User dismissed the prompt, do nothing.
      }
    });
  } else if (isIOS()) {
    // On iOS, we show instructions.
    showIosInstructions();
  } else if (isDesktop()) {
    showDesktopModal();
  } else {
    // If not on iOS and there's no prompt, the app is likely installed.
    UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
  }
}

export const PWA = { init, handleInstallClick, closePwaModals, isStandalone };