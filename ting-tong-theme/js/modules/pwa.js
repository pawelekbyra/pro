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

// OSTATECZNA POPRAWKA: Ta funkcja jest teraz w 100% bezpieczna.
// Zmienia tylko klasę CSS, nie dotykając tekstu.
function updateInstallButtonAvailability() {
  if (!installButton) return;
  if (installPromptEvent) {
    installButton.classList.remove("unavailable");
  } else {
    installButton.classList.add("unavailable");
  }
}

// OSTATECZNA POPRAWKA: Listener jest teraz odpowiedzialny TYLKO za przechwycenie zdarzenia.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPromptEvent = e;
  console.log("✅ `beforeinstallprompt` event fired and captured.");
  updateInstallButtonAvailability(); // To jest bezpieczne, bo nie zależy od tłumaczeń
  runStandaloneCheck();
});

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

function init() {
  if (installButton) {
    installButton.addEventListener('click', handleInstallClick);
  }

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    updateInstallButtonAvailability(); // To jest bezpieczne
    console.log("Aplikacja została zainstalowana.");
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
  }
  // OSTATECZNA POPRAWKA: Ustawiamy początkowy stan przycisku na "niedostępny".
  // Stan zostanie zaktualizowany w `app.js` po załadowaniu wszystkiego.
  updateInstallButtonAvailability();
}

export const PWA = { init, runStandaloneCheck, handleInstallClick, closePwaModals, isStandalone, updateInstallButtonAvailability };