/* global webpushr */
import { UI } from './ui.js';
import { State } from './state.js';

const Notifications = {
    init() {
        // Since Webpushr is loaded via an external script,
        // we need to wait for it to be available.
        // We'll check every 100ms.
        const webpushrInterval = setInterval(() => {
            if (typeof webpushr !== 'undefined') {
                clearInterval(webpushrInterval);
                this.setup();
            }
        }, 100);
    },

    setup() {
        // Webpushr is ready.
        // You can add any additional setup logic here if needed in the future.
    },

    // Re-added from original file to handle already-subscribed users
    showModal() {
        console.log('Otwieram modal powiadomień...');
        UI.showAlert('Modal powiadomień - w budowie!');
    },

    handleBellClick() {
        if (typeof webpushr !== 'undefined') {
            webpushr.is_browser_location_enabled((is_enabled) => {
                if (is_enabled) {
                    // User is already subscribed. Check if they are logged in to show the modal.
                    if (State.get('isUserLoggedIn')) {
                        this.showModal();
                    } else {
                        UI.showAlert('Zaloguj się, aby zobaczyć powiadomienia.');
                    }
                } else {
                    // User is not subscribed, show the native prompt to subscribe.
                    webpushr.showNativePrompt();
                }
            });
        } else {
            console.error('Webpushr is not defined.');
            // Fallback logic can be added here if necessary
            UI.showAlert('Funkcja powiadomień jest chwilowo niedostępna.', true);
        }
    }
};

export { Notifications }; // Changed to named export