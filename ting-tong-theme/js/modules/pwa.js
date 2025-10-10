import { UI } from './ui.js';
import { Utils } from './utils.js';

// DOM Elements
const installBar = document.getElementById("pwa-install-bar");
const installButton = document.getElementById("pwa-install-button");
const iosInstructions = document.getElementById("pwa-ios-instructions");
const iosCloseButton = document.getElementById("pwa-ios-close-button");
const desktopModal = document.getElementById("pwa-desktop-modal");

let installPromptEvent = null;

// --- Helper to show the install bar ---
const showInstallBar = () => {
  if (isStandalone()) return; // Don't show if already in PWA mode

  const appFrame = document.getElementById("app-frame");
  if (installBar && !installBar.classList.contains('visible')) {
    console.log('[PWA] 📣 Showing PWA install bar.');
    installBar.classList.add("visible");
    installBar.setAttribute('aria-hidden', 'false');
    if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
    if (installButton) installButton.disabled = false;
  }
};

// --- Immediate listener for the install prompt ---
// This runs as soon as the module is loaded to prevent missing the event.
window.addEventListener("beforeinstallprompt", (e) => {
  console.log('[PWA] 📱 `beforeinstallprompt` event fired and caught immediately.');
  e.preventDefault();
  installPromptEvent = e;
  showInstallBar(); // Show the bar as soon as the prompt is available
  // We set a flag to prevent the fallback logic from running unnecessarily.
  window.pwaInstallPromptCaught = true;
});

const isIOS = () => {
  if (typeof window === "undefined" || !window.navigator) return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
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

async function init() {
  console.log('[PWA] 🚀 Initializing PWA module...');

  // --- Main Initialization Logic ---
  // 1. Check if the app is already installed.
  if (navigator.getInstalledRelatedApps) {
    try {
      const relatedApps = await navigator.getInstalledRelatedApps();
      if (relatedApps && relatedApps.length > 0) {
        console.log('[PWA] ✅ App is already installed. Hiding bar and flagging for toast.');
        if (installBar) installBar.style.display = 'none';
        sessionStorage.setItem('showAlreadyInstalledToast', 'true');
        return; // Stop further PWA initialization
      }
    } catch (error) {
      console.error('[PWA] Error checking for installed apps, proceeding as if not installed:', error);
    }
  }

  // 2. If already in standalone mode, do nothing.
  if (isStandalone()) {
    console.log("[PWA] ✅ App is in standalone mode. Hiding install bar.");
    if (installBar) installBar.style.display = 'none';
    return;
  }

  // 3. Attach click handlers for the installation process.
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

  // 4. Fallback for browsers that do not support `beforeinstallprompt` (e.g., Safari).
  // This will only run if the immediate listener at the top didn't fire.
  if (!window.pwaInstallPromptCaught) {
    console.log('[PWA] ⚠️ `beforeinstallprompt` was not caught. Using fallback for Safari/other browsers.');
    const preloader = document.getElementById("preloader");
    if (preloader) {
      const observer = new MutationObserver((mutations) => {
        if (mutations.some(m => m.target.classList.contains('preloader-hiding'))) {
          console.log('[PWA] Preloader is hiding. Showing bar for instructions via fallback.');
          setTimeout(showInstallBar, 500);
          observer.disconnect();
        }
      });
      observer.observe(preloader, { attributes: true, attributeFilter: ['class'] });
    } else {
      // If no preloader, show immediately.
      showInstallBar();
    }
  }

  // 5. Listen for the appinstalled event to hide the bar after successful installation.
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

  // If already in standalone, show a toast. This is a safeguard.
  if (isStandalone()) {
    UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
    return;
  }

  // Standard prompt (Chrome/Edge/Android)
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
      UI.showAlert("Wystąpił błąd podczas instalacji. Odśwież stronę i spróbuj ponownie.", true);
    });
    return;
  }

  // iOS instructions
  if (isIOS()) {
    showIosInstructions();
    return;
  }

  // Desktop modal
  if (isDesktop()) {
    showDesktopModal();
    return;
  }

  // Fallback if prompt is not ready
  console.warn('[PWA] ⚠️ Install prompt not available on click.');
  UI.showAlert("Instalacja nie jest jeszcze gotowa. Odśwież stronę i spróbuj ponownie.", true);
}

export const PWA = { init, handleInstallClick, closePwaModals, isStandalone };