import { UI } from './ui.js';
import { Utils } from './utils.js';

// DOM Elements
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
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1 && !window.MSStream)
  );
};

const isStandalone = () => {
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true
  );
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

// Helper to show the install bar, now with more intelligent logic
const showInstallBar = () => {
  if (isStandalone()) return; // Don't show if already in PWA mode

  // Only show the bar if we have a way to install (prompt or instructions)
  const canInstall = installPromptEvent || isIOS() || isDesktop();

  if (!canInstall) {
    console.log('[PWA] Cannot install, hiding bar.');
    if (installBar) installBar.style.display = 'none';
    return;
  }

  const appFrame = document.getElementById("app-frame");
  if (installBar && !installBar.classList.contains('visible')) {
    console.log('[PWA] 📣 Showing PWA install bar.');
    installBar.classList.add("visible");
    installBar.setAttribute('aria-hidden', 'false');
    if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
    if (installButton) installButton.disabled = false;
  }
};

// --- Listener for the install prompt ---
window.addEventListener("beforeinstallprompt", (e) => {
  console.log('[PWA] 📱 `beforeinstallprompt` event fired.');
  e.preventDefault();
  installPromptEvent = e;
  // Set a flag to indicate the prompt is ready
  window.pwaInstallPromptReady = true;
  // Now that the prompt is ready, show the bar.
  showInstallBar();
});

async function init() {
  console.log('[PWA] 🚀 Initializing PWA module...');

  // 1. Check if the app is already installed.
  if (isStandalone() || (navigator.getInstalledRelatedApps && (await navigator.getInstalledRelatedApps()).length > 0)) {
    console.log('[PWA] ✅ App is already installed or in standalone mode. Hiding install bar.');
    if (installBar) installBar.style.display = 'none';
    if (!isStandalone()) {
        sessionStorage.setItem('showAlreadyInstalledToast', 'true');
    }
    return;
  }

  // 2. Attach click handlers
  if (installButton) {
    installButton.addEventListener("click", handleInstallClick);
  }
  document.body.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'install-pwa') {
      handleInstallClick();
    }
  });
  if (iosCloseButton) {
    iosCloseButton.addEventListener("click", hideIosInstructions);
  }

  // 3. Fallback logic: Show the bar on a delay for non-prompt browsers (iOS/Desktop)
  // We wait a bit to ensure the main app UI is ready.
  setTimeout(() => {
    // If the native prompt is not ready, check if we should show instructions instead.
    if (!window.pwaInstallPromptReady) {
      if (isIOS() || isDesktop()) {
        console.log('[PWA] Fallback: Showing bar for manual instructions on iOS/Desktop.');
        showInstallBar();
      } else {
        console.log('[PWA] Fallback: Native prompt not ready and not on iOS/Desktop. Bar remains hidden.');
      }
    }
  }, 2000); // 2-second delay

  // 4. Listen for the appinstalled event
  window.addEventListener("appinstalled", () => {
    console.log('[PWA] ✅ PWA was successfully installed.');
    installPromptEvent = null;
    if (installBar) {
      installBar.classList.remove("visible");
      const appFrame = document.getElementById("app-frame");
      if (appFrame) appFrame.classList.remove("app-frame--pwa-visible");
    }
  });

  console.log('[PWA] Initialization complete.');
}

function handleInstallClick() {
  console.log('[PWA] 🖱️ Install button clicked');

  if (isStandalone()) {
    UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    return;
  }

  // A. Standard prompt (Chrome/Edge/Android)
  if (installPromptEvent) {
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult) => {
      console.log(`[PWA] User choice: ${choiceResult.outcome}`);
      if (choiceResult.outcome === "accepted") {
        if (installBar) installBar.classList.remove("visible");
      }
      installPromptEvent = null;
    }).catch(error => {
      console.error('[PWA] ❌ Prompt error:', error);
      UI.showAlert("Wystąpił błąd podczas instalacji.", true);
    });
    return;
  }

  // B. iOS instructions
  if (isIOS()) {
    showIosInstructions();
    return;
  }

  // C. Desktop modal (for browsers like Safari on macOS)
  if (isDesktop()) {
    showDesktopModal();
    return;
  }

  // D. Fallback (should no longer be reached with the new logic)
  console.warn('[PWA] ⚠️ Install button was clicked, but no action is available.');
  UI.showAlert("Instalacja nie jest dostępna w tej przeglądarce.", true);
}

export const PWA = { init, handleInstallClick, closePwaModals, isStandalone };