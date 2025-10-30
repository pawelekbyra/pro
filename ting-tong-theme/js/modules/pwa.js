import { Config } from "./config.js";
import { State } from "./state.js";
import { Utils } from "./utils.js";

// Zmienna do przechowywania referencji do modułu UI
// Zostanie ustawiona przez app.js, aby przerwać cykliczną zależność
let UI;

export const PWA = {
    // Funkcja do wstrzykiwania zależności
    setUiModule: (uiModule) => {
        UI = uiModule;
    },

    deferredPrompt: null,

    init: () => {
        // Ta funkcja jest teraz pusta, ponieważ cała logika UI jest
        // przeniesiona do `initializeUI` i wywoływana z app.js
        // w odpowiednim momencie (po załadowaniu tłumaczeń).
        PWA.addVisibilityChangeListener();
    },

    initializeUI: () => {
        // Ten kod był wcześniej w `init`, ale teraz jest wywoływany,
        // gdy mamy pewność, że wszystko inne jest gotowe.
        if (UI.DOM.pwaInstallButton) {
            UI.DOM.pwaInstallButton.addEventListener('click', PWA.handleInstallClick);
        }
        if (UI.DOM.pwaDismissButton) {
            UI.DOM.pwaDismissButton.addEventListener('click', PWA.handleDismissClick);
        }
        PWA.updateDynamicTexts();
    },

    isStandalone: () => {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    },

    runStandaloneCheck: () => {
        console.log("Running PWA standalone check...");
        const appFrame = document.querySelector('#app-frame');

        if (PWA.isStandalone()) {
            console.log("App is in standalone mode.");
            // Ukryj pasek PWA, jeśli jest w trybie standalone
            if (UI.DOM.pwaPrompt) UI.DOM.pwaPrompt.classList.remove('visible');
            if (UI.DOM.pwaIosInstructions) UI.DOM.pwaIosInstructions.classList.remove('visible');
            appFrame?.classList.remove('app-frame--pwa-visible');

        } else {
            console.log("App is in browser mode.");
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const isPwaDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

            if (isPwaDismissed) {
                console.log("PWA prompt was dismissed by user.");
                return;
            }

            // Użyj `setTimeout` z zerowym opóźnieniem, aby dać przeglądarce czas na załadowanie
            // eventu `beforeinstallprompt`, który może nie być dostępny natychmiast.
            setTimeout(() => {
                if (isIOS) {
                    if (UI.DOM.pwaIosInstructions) UI.DOM.pwaIosInstructions.classList.add('visible');
                    appFrame?.classList.add('app-frame--pwa-visible');
                } else if (PWA.deferredPrompt) {
                    console.log("Deferred prompt is available. Showing install bar.");
                    if (UI.DOM.pwaPrompt) UI.DOM.pwaPrompt.classList.add('visible');
                    appFrame?.classList.add('app-frame--pwa-visible');
                } else {
                    console.log("Deferred prompt not available yet.");
                }
            }, 0);
        }
    },


    handleInstallClick: async () => {
        // Jeśli apka jest już zainstalowana, nie rób nic poza pokazaniem komunikatu.
        if (PWA.isStandalone()) {
            UI.showAlert(Utils.getTranslation("alreadyInstalledToast"), false, 3000);
            // Zapisz flagę do sessionStorage, aby pokazać toast po odświeżeniu
            // w trybie PWA (np. po instalacji).
            sessionStorage.setItem('showAlreadyInstalledToast', 'true');
            return;
        }

        if (PWA.deferredPrompt) {
            PWA.deferredPrompt.prompt();
            const {
                outcome
            } = await PWA.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);

            if (outcome === 'accepted') {
                UI.showAlert(Utils.getTranslation('installSuccess'), false, 5000);
            } else {
                UI.showAlert(Utils.getTranslation('installDismissed'), true, 3000);
            }
            PWA.deferredPrompt = null;
            if (UI.DOM.pwaPrompt) UI.DOM.pwaPrompt.classList.remove('visible');
            document.querySelector('#app-frame')?.classList.remove('app-frame--pwa-visible');
        } else {
            // To się może zdarzyć, jeśli użytkownik kliknie przycisk, zanim `beforeinstallprompt` się załaduje.
            UI.showAlert(Utils.getTranslation('installNotReady'), true, 4000);
        }
    },

    handleDismissClick: () => {
        if (UI.DOM.pwaPrompt) UI.DOM.pwaPrompt.classList.remove('visible');
        if (UI.DOM.pwaIosInstructions) UI.DOM.pwaIosInstructions.classList.remove('visible');
        document.querySelector('#app-frame')?.classList.remove('app-frame--pwa-visible');
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    },

    addVisibilityChangeListener: () => {
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                console.log("Page is visible again, re-running PWA check.");
                PWA.runStandaloneCheck();
            }
        });
    },

    updateDynamicTexts: () => {
        // Ta funkcja jest teraz wywoływana przez `UI.updateTranslations`,
        // więc mamy pewność, że tłumaczenia są załadowane.
        const installButtonSpan = UI.DOM.pwaInstallButton?.querySelector('span');
        if (installButtonSpan) {
            installButtonSpan.textContent = Utils.getTranslation('pwaInstall');
        }

        const iosTitle = UI.DOM.pwaIosInstructions?.querySelector('.pwa-prompt-title');
        if (iosTitle) {
            iosTitle.textContent = Utils.getTranslation('pwaIosTitle');
        }
    }
};

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Usuń pasek i flagę localStorage, ponieważ nie są już potrzebne.
    if (UI.DOM.pwaPrompt) UI.DOM.pwaPrompt.classList.remove('visible');
    document.querySelector('#app-frame')?.classList.remove('app-frame--pwa-visible');
    localStorage.removeItem('pwa_prompt_dismissed');
});