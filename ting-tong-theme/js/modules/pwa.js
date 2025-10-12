import { UI } from './ui.js';
import { Utils } from './utils.js';

const installBar = document.getElementById("pwa-install-bar");
const installButton = document.getElementById("pwa-install-button");
const iosInstructions = document.getElementById("pwa-ios-instructions");
const iosCloseButton = document.getElementById("pwa-ios-close-button");
const desktopModal = document.getElementById("pwa-desktop-modal");

const isIOS = () => {
  if (typeof window === "undefined" || !window.navigator) return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const isStandalone = () => {
  return (window.matchMedia && (window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches)) || window.navigator.standalone === true;
};

const isDesktop = () => !isIOS() && !/Android/i.test(navigator.userAgent);

let installPromptEvent = null;

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

function runStandaloneCheck() {
  const appFrame = document.getElementById("app-frame");
  if (isStandalone()) {
    if (installBar) {
      installBar.style.display = 'none';
      installBar.classList.remove("visible");
      if (appFrame) appFrame.classList.remove("app-frame--pwa-visible");
    }
    return true;
  } else {
    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden = (preloader && preloader.classList.contains("preloader-hiding")) || (container && container.classList.contains("ready"));
    if (isPreloaderHidden && installBar) {
      installBar.classList.add("visible");
      if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
    }
  }
  return false;
}

function handleInstallClick() {
  // Zawsze sprawdzaj w czasie rzeczywistym, czy aplikacja nie jest już zainstalowana
  if (isStandalone()) {
    UI.showAlert(Utils.getTranslation("alreadyInstalledToast"));
    return;
  }

  // Jeśli zdarzenie `beforeinstallprompt` zostało przechwycone, pokaż monit
  if (installPromptEvent) {
    installPromptEvent.prompt();
    // Logika userChoice została przeniesiona do globalnego listenera, aby uniknąć duplikacji
    return;
  }

  // Logika dla specyficznych platform (iOS, Desktop)
  if (isIOS()) {
    showIosInstructions();
    return;
  }

  if (isDesktop()) {
    showDesktopModal();
    return;
  }

  // Jeśli żaden z powyższych warunków nie jest spełniony, oznacza to,
  // że przeglądarka nie jest gotowa do instalacji (np. na niezabezpieczonym połączeniu).
  // Dajemy użytkownikowi jasny komunikat.
  UI.showAlert(Utils.getTranslation("installNotReadyText"), true);
}

function init() {
  if (installButton) {
    installButton.disabled = false; // Przycisk instalacji jest zawsze włączony
    installButton.addEventListener("click", handleInstallClick);
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPromptEvent = e;
    console.log("✅ `beforeinstallprompt` event fired and captured.");
    // Nie musimy już tutaj włączać przycisku, bo jest zawsze włączony
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    UI.showAlert(Utils.getTranslation("appInstalledSuccessText"));
    // Nie ukrywamy już tutaj paska - `runStandaloneCheck` się tym zajmie.
  });

  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  const isConfirmed = runStandaloneCheck();

  if (!isConfirmed) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        runStandaloneCheck();
      }
    });

    const preloader = document.getElementById("preloader");
    if (preloader) {
      const observer = new MutationObserver(() => {
        if (preloader.classList.contains("preloader-hiding")) {
          setTimeout(() => {
            if (!isStandalone() && installBar && !installBar.classList.contains("visible")) {
              installBar.classList.add("visible");
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