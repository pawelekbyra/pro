import { Utils } from './utils.js';

let uiModule = { openModal: () => {}, closeModal: () => {}, showAlert: () => {} }; // Default stub

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
  if (desktopModal) uiModule.openModal(desktopModal);
}

function closePwaModals() {
  if (desktopModal && desktopModal.classList.contains("visible"))
    uiModule.closeModal(desktopModal);
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

// ✅ FIX: Nasłuchuj zdarzenia `beforeinstallprompt` natychmiast po załadowaniu modułu.
// Jest to kluczowe, aby przechwycić zdarzenie, które może zostać wyemitowane bardzo wcześnie.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPromptEvent = e;
  console.log("✅ `beforeinstallprompt` event fired and captured.");
  // Pokazujemy pasek instalacji, gdy tylko przechwycimy zdarzenie,
  // pod warunkiem, że preloader jest już ukryty.
  runStandaloneCheck();
});

function handleInstallClick() {
  // Ta funkcja jest teraz znacznie prostsza. Jej jedynym zadaniem jest
  // wywołanie zachowanego zdarzenia `prompt()` lub, w przypadku jego braku,
  // pokazanie odpowiednich instrukcji dla iOS lub desktop.

  if (installPromptEvent) {
    installPromptEvent.prompt();
    // Logika `userChoice` zostanie obsłużona w listenerze `appinstalled`.
  } else if (isIOS()) {
    showIosInstructions();
  } else if (isDesktop()) {
    showDesktopModal();
  } else {
    // Jeśli dotarliśmy tutaj, oznacza to, że przeglądarka nie obsługuje
    // `beforeinstallprompt` i nie jest to ani iOS, ani desktop.
    // To rzadki przypadek, ale warto go odnotować.
    console.warn("PWA installation not supported on this browser.");
    uiModule.showAlert(Utils.getTranslation("pwaNotSupported"));
  }
}

function init() {
  // ✅ FIX: Dodajemy bezpośredni listener do przycisku instalacji.
  // To zapewnia, że kliknięcie jest zawsze obsługiwane przez ten moduł.
  if (installButton) {
    installButton.addEventListener('click', handleInstallClick);
  }

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    uiModule.showAlert(Utils.getTranslation("appInstalledSuccessText"));
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

export const PWA = {
  setUiModule: (ui) => { uiModule = ui; },
  init,
  handleInstallClick,
  closePwaModals,
  isStandalone
};