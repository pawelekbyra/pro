import { API } from './api.js';
import { UI } from './ui.js';
import { State } from './state.js';

let isScriptLoaded = false;
let isLoadingScript = false;
let scriptLoadPromise = null;

function loadScript() {
    if (isScriptLoaded) return Promise.resolve();
    if (isLoadingScript) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.fastcomments.com/js/embed.min.js';
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => {
            isScriptLoaded = true;
            isLoadingScript = false;
            resolve();
        };
        script.onerror = () => {
            isLoadingScript = false;
            reject('Failed to load FastComments script.');
        };
        document.head.appendChild(script);
    });

    isLoadingScript = true;
    return scriptLoadPromise;
}


export const FastCommentsIntegration = {
    init() {
        // Preload the script on initial app load for faster modal opening
        loadScript().catch(err => console.error(err));
    },

    async renderComments(slideId) {
        if (!slideId) {
            console.error("FastComments: slideId is required.");
            return;
        }

        try {
            await loadScript();
        } catch (error) {
            UI.showAlert('Could not load comments.', true);
            return;
        }

        const currentLang = State.get("currentLang"); // np. 'pl' lub 'en'

        const config = {
            tenantId: window.TingTongData.fcTenantId,
            widgetId: window.TingTongData.fcWidgetId,
            region: window.TingTongData.fcRegion,
            urlId: slideId,
            container: UI.DOM.fastCommentsContainer,
            locale: currentLang
        };

        if (State.get("isUserLoggedIn")) {
            const ssoResponse = await API.getSSOToken();
            if (ssoResponse.success && ssoResponse.data) {
                config.sso = ssoResponse.data;
            }
        }

        if (window.FastComments) {
            window.FastComments.render(config);
        } else {
             UI.showAlert('Could not initialize comments.', true);
        }
    }
};
