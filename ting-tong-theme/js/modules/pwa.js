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
 * Sprawdza, czy aplikacja działa w trybie samodzielnym (PWA), używając wielu metod.
 * @returns {boolean} True, jeśli aplikacja jest w trybie PWA.
 */
const isStandalone = () => {
  const isStandardPWA = window.matchMedia("(display-mode: standalone)").matches;
  const isIosPWA = window.navigator.standalone === true;
  const hasPwaFlag = localStorage.getItem("tt_pwa_installed") === "true";
  const startedWithoutReferrer = document.referrer === "";

  // Sprawdź, czy URL ma parametr `utm_source=pwa`
  const urlParams = new URLSearchParams(window.location.search);
  const hasPwaUrlParam = urlParams.get('utm_source') === 'pwa';

  console.log(`[PWA Debug] Display Mode: ${isStandardPWA}, iOS Standalone: ${isIosPWA}, LocalStorage Flag: ${hasPwaFlag}, No Referrer: ${startedWithoutReferrer}, URL Param: ${hasPwaUrlParam}`);

  // Jeśli flaga jest ustawiona, ufamy jej. To najważniejszy wskaźnik.
  if (hasPwaFlag) {
    return true;
  }

  // Dla urządzeń Apple, `standalone` jest wiarygodnym źródłem.
  if (isIosPWA) {
      return true;
  }

  // `display-mode` jest standardem, ale może zawodzić przy starcie.
  // Brak referrera to dobry wskaźnik, ale nie stuprocentowy.
  // Łączymy je, aby zwiększyć pewność, zwłaszcza na Androidzie.
  return isStandardPWA || (startedWithoutReferrer && hasPwaUrlParam);
};
const isDesktop = () => !isIOS() && !/Android/i.test(navigator.userAgent);

// State
let installPromptEvent = null;
let isAppInstalled = isStandalone(); // Initialize state

// Actions
function showIosInstructions() {
  if (iosInstructions) iosInstructions.classList.add("visible");
}

function hideIosInstructions() {
  if (iosInstructions) iosInstructions.classList.remove("visible");
}

function setInstalledFlag() {
  console.log("[PWA] Setting installation flag in localStorage.");
  localStorage.setItem("tt_pwa_installed", "true");
  isAppInstalled = true; // Update in-memory state
}

function updatePwaUiForInstalledState() {
  if (!installBar) return;

  setInstalledFlag(); // Set the flag whenever we hide the bar permanently

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
    console.log("[PWA Check] Standalone detected. Hiding install bar.");
    if (installBar) installBar.classList.remove("visible");
    if (appFrame) appFrame.classList.remove("app-frame--pwa-visible");
    // Jeśli wykryto tryb standalone, upewnijmy się, że flaga jest ustawiona.
    setInstalledFlag();
  } else {
    console.log("[PWA Check] Standalone not detected. Showing install bar.");
    // Pokaż pasek TYLKO jeśli NIE jesteśmy w trybie standalone i nie ma promptu
    if (installBar && !installPromptEvent) {
        installBar.classList.add("visible");
        if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
    }
  }
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

      // Ukryj pasek, jeśli pojawi się prośba o instalację
      if (installBar) installBar.classList.remove("visible");
    });

    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      installPromptEvent = null;
      setInstalledFlag();
      updatePwaUiForInstalledState();
    });
  }

  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // Uruchom wielokrotne sprawdzanie trybu standalone
  // Czekamy na załadowanie, aby uniknąć problemów z timingiem
  window.addEventListener('load', () => {
    [500, 2000, 5000].forEach(delay => {
      setTimeout(runStandaloneCheck, delay);
    });
  });

  // Sprawdzaj również, gdy użytkownik wraca do aplikacji
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runStandaloneCheck();
    }
  });
}

function handleInstallClick() {
  // Check if the app is already installed and show an alert.
  if (isAppInstalled) {
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