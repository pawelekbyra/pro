import { UI } from './ui.js';
import { Utils } from './utils.js';

const installBar = document.getElementById("pwa-install-bar");
const installButton = document.getElementById("pwa-install-button");
const iosInstructions = document.getElementById("pwa-ios-instructions");
const iosCloseButton = document.getElementById("pwa-ios-close-button");
const desktopModal = document.getElementById("pwa-desktop-modal");

let installPromptEvent = null;

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
            installBar.classList.remove("visible");
            if (appFrame) appFrame.classList.remove("app-frame--pwa-visible");
        }
        return true;
    }

    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden = (preloader && preloader.classList.contains("preloader-hiding")) || (container && container.classList.contains("ready"));

    if (isPreloaderHidden && installBar) {
        installBar.classList.add("visible");
        if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
    }
    return false;
}

function updateInstallButtonUI() {
    if (!installButton) return;
    const span = installButton.querySelector('span');
    if (!span) return;

    if (installPromptEvent) {
        installButton.classList.remove("unavailable");
        span.textContent = Utils.getTranslation("installPwa");
    } else {
        installButton.classList.add("unavailable");
        span.textContent = Utils.getTranslation("howToInstallPwa");
    }
}

function handleInstallClick() {
  if (installPromptEvent) {
    installPromptEvent.prompt();
  } else if (isIOS()) {
    showIosInstructions();
  } else if (isDesktop()) {
    showDesktopModal();
  } else {
    console.warn("PWA installation not supported on this browser.");
    UI.showAlert(Utils.getTranslation("pwaNotSupported"));
  }
}

// Ta funkcja będzie wywołana z app.js w bezpiecznym momencie
function initializeUI() {
    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
    }
    if (iosCloseButton) {
        iosCloseButton.addEventListener("click", hideIosInstructions);
    }
    updateInstallButtonUI();

    const isConfirmed = runStandaloneCheck();
    if (!isConfirmed) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                runStandaloneCheck();
            }
        });
    }
}

// Pasywne nasłuchiwanie w tle
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPromptEvent = e;
  console.log("✅ `beforeinstallprompt` event fired and captured in background.");
  // Po przechwyceniu, jeśli UI jest już zainicjalizowane, zaktualizuj je
  if (document.body.classList.contains('app-started')) {
      updateInstallButtonUI();
  }
});

window.addEventListener("appinstalled", () => {
  installPromptEvent = null;
  console.log("Aplikacja została zainstalowana.");
  if (document.body.classList.contains('app-started')) {
      updateInstallButtonUI();
  }
});


export const PWA = {
    initializeUI,
    closePwaModals,
    isStandalone
};