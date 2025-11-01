// import { UI } from './ui.js'; // Usunięte, aby przerwać zależność cykliczną
import { Utils } from './utils.js';

let UI_MODULE = null; // Zmienna przechowująca wstrzykniętą zależność
let installBar, installButton, iosInstructions, iosCloseButton, desktopModal;

function setUiModule(uiModule) {
  UI_MODULE = uiModule;
}

function cacheDOMElements() {
    installBar = document.getElementById("pwa-install-bar");
    installButton = document.getElementById("pwa-install-button");
    iosInstructions = document.getElementById("pwa-ios-instructions");
    iosCloseButton = document.getElementById("pwa-ios-close-button");
    desktopModal = document.getElementById("pwa-desktop-modal");
}

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
  if (desktopModal && UI_MODULE) UI_MODULE.openModal(desktopModal);
}

function closePwaModals() {
  if (desktopModal && desktopModal.classList.contains("visible") && UI_MODULE)
    UI_MODULE.closeModal(desktopModal);
  if (iosInstructions && iosInstructions.classList.contains("visible"))
    hideIosInstructions();
}

function runStandaloneCheck() {
    const appFrame = document.getElementById("app-frame");

    // Jeśli aplikacja działa w trybie standalone, zawsze ukrywaj pasek.
    if (isStandalone()) {
        if (installBar) {
            installBar.classList.remove("visible");
            if (appFrame) appFrame.classList.remove("app-frame--pwa-visible");
        }
        return true;
    }

    // Jeśli nie jest standalone, pokaż pasek po zniknięciu preloadera.
    const preloader = document.getElementById("preloader");
    const container = document.getElementById("webyx-container");
    const isPreloaderHidden = (preloader && preloader.classList.contains("preloader-hiding")) || (container && container.classList.contains("ready"));

    if (isPreloaderHidden && installBar) {
        installBar.classList.add("visible");
        if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
    } else if (installBar) {
        // W każdym innym przypadku (np. preloader widoczny), ukryj pasek.
        installBar.classList.remove("visible");
        if (appFrame) appFrame.classList.remove("app-frame--pwa-visible");
    }

    return false;
}

// ✅ FIX: Nasłuchuj zdarzenia `beforeinstallprompt` natychmiast po załadowaniu modułu.
// Jest to kluczowe, aby przechwycić zdarzenie, które może zostać wyemitowane bardzo wcześnie.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPromptEvent = e;
  console.log("✅ `beforeinstallprompt` event fired and captured.");
  // Już nie wywołujemy tutaj `runStandaloneCheck()`.
  // Logika w `app.js` jest teraz jedynym źródłem prawdy.
});

function handleInstallClick() {
  // FIX: Najpierw sprawdzamy, czy aplikacja nie jest już zainstalowana (standalone).
  // Jeśli tak, wyświetlamy stosowny komunikat i przerywamy.
  if (isStandalone()) {
    if (UI_MODULE) UI_MODULE.showAlert(Utils.getTranslation("pwaAlreadyInstalled"));
    return;
  }

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
    if (UI_MODULE) UI_MODULE.showAlert(Utils.getTranslation("pwaNotSupported"));
  }
}

function init() {
  cacheDOMElements();
  // ✅ FIX: Dodajemy bezpośredni listener do przycisku instalacji.
  // To zapewnia, że kliknięcie jest zawsze obsługiwane przez ten moduł.
  if (installButton) {
    installButton.addEventListener('click', handleInstallClick);
  }

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    if (UI_MODULE) UI_MODULE.showAlert(Utils.getTranslation("appInstalledSuccessText"));
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
  }
}

export const PWA = { init, runStandaloneCheck, handleInstallClick, closePwaModals, isStandalone, setUiModule };