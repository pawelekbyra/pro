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
  if (isStandalone()) {
    UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    return;
  }

  if (installPromptEvent) {
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult) => {
      installPromptEvent = null;
    });
    return;
  }

  if (isIOS()) {
    showIosInstructions();
    return;
  }

  if (isDesktop()) {
    showDesktopModal();
    return;
  }

  UI.showAlert("Instalacja nie jest jeszcze gotowa. Odśwież stronę i spróbuj ponownie.", true);
}

function init() {
  if (installButton) {
    installButton.disabled = true;
    installButton.addEventListener("click", handleInstallClick);
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPromptEvent = e;
    if (installButton) {
      installButton.disabled = false;
    }
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    UI.showAlert("Aplikacja została zainstalowana!");
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