import { PWA } from './pwa.js';
import { UI } from './ui.js';
import { Utils } from './utils.js';
import { State } from './state.js';

const Notifications = {
  async handleBellClick() {
    const permission = Notification.permission;

    if (permission === 'default' || permission === 'denied') {
      const result = await PWA.handlePushSubscription();
      if (result === 'granted') {
        UI.showAlert(Utils.getTranslation('notificationsEnabledSuccess'));
      } else if (result === 'denied') {
        UI.showAlert(Utils.getTranslation('notificationsPermissionDenied'));
      } else if (result === 'error') {
        UI.showAlert(Utils.getTranslation('notificationsSaveError'));
      }
    } else if (permission === 'granted') {
      if (State.get('isUserLoggedIn')) {
        this.showModal();
      } else {
        UI.showAlert('Zaloguj się, aby zobaczyć powiadomienia.');
      }
    }
  },

  showModal() {
    // Tutaj w przyszłości pojawi się logika otwierania modala z listą powiadomień
    console.log('Otwieram modal powiadomień...');
    UI.showAlert('Modal powiadomień - w budowie!');
  },

  init() {
    // Inicjalizacja modułu, jeśli potrzebna w przyszłości
  }
};

export { Notifications };
