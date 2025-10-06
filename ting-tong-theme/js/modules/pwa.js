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
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone;
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

function updatePwaUiForInstalledState() {
  if (!installBar || !installButton) return;
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

// Initialization
function init() {
  // Always attach event listener to the install button.
  if (installButton) {
    installButton.addEventListener("click", handleInstallClick);
  }

  // For browsers that support `beforeinstallprompt` (like Chrome on Android)
  if ("onbeforeinstallprompt" in window) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      installPromptEvent = e;
      if (installButton) {
        installButton.disabled = false;
      }
    });

    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      installPromptEvent = null;
      isAppInstalled = true; // Set state
      updatePwaUiForInstalledState();
    });
  }

  // Attach other event listeners
  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }
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