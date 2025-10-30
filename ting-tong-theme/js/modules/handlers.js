import { State } from './state.js';
import { Utils } from './utils.js';
import { UI } from './ui.js';
import { API } from './api.js';
import { authManager } from './auth-manager.js';
import { CommentsModal } from './comments-modal.js';
import { AccountPanel } from './account-panel.js';
import { PWA } from './pwa.js';

export const Handlers = {

  mainClickHandler: (event) => {
    const target = event.target;
    const actionTarget = target.closest('[data-action]');

    if (!actionTarget) return;

    // Pobierz swiper z State
    const swiper = State.get('swiper');

    // Pobierz aktywny slajd i jego wideo
    const activeSlide = swiper?.slides[swiper.activeIndex];
    const video = activeSlide?.querySelector('video');

    // Pobierz ID slajdu i jego dane
    const slideContainer = actionTarget.closest('.tiktok-symulacja');
    const likeId = slideContainer?.dataset.likeId;

    const action = actionTarget.dataset.action;

    switch (action) {
      // --- Logowanie / Wylogowanie / Konto ---
      case 'open-login-modal':
        UI.openModal(UI.DOM.loginModal);
        break;
      case 'logout':
        authManager.logout();
        break;
      case 'open-account-modal':
        AccountPanel.openAccountModal();
        break;
      case 'open-info-modal':
        UI.openModal(UI.DOM.infoModal);
        break;

      // --- Głośność / Pełny Ekran ---
      case 'toggle-main-volume':
        {
          const isMuted = !State.get('isSoundMuted');
          State.set('isSoundMuted', isMuted);
          if (video) video.muted = isMuted;
          UI.updateVolumeButton(isMuted);
          break;
        }
      case 'toggle-fullscreen':
        if (PWA.isStandalone()) {
            Utils.toggleFullScreen();
        } else {
            UI.showAlert(Utils.getTranslation('fullscreenOnlyPWA'));
        }
        break;

      // --- Interakcje ze slajdem (Like, Komentarze, Share) ---
      case 'like':
        if (!State.get('isUserLoggedIn')) {
          UI.showAlert(Utils.getTranslation('loginToLike'), true);
          return;
        }
        API.toggleLike(likeId);
        break;
      case 'open-comments':
        CommentsModal.open(likeId);
        break;
      case 'share':
        {
          const slideIndex = swiper.realIndex;
          const slideData = slidesData[slideIndex];
          if (navigator.share) {
            navigator.share({
              title: slideData.title,
              text: slideData.description,
              url: window.location.href,
            }).catch(console.error);
          } else {
            UI.showAlert(Utils.getTranslation('shareNotSupported'), true);
          }
          break;
        }

      // --- Nawigacja / UI ---
      case 'toggle-notifications':
        UI.DOM.notificationPopup.classList.toggle('visible');
        break;

      case 'select-language':
        {
          const lang = actionTarget.dataset.lang;
          if (lang) {
            actionTarget.classList.add('is-selected');
            setTimeout(() => {
                State.set('currentLang', lang);
                localStorage.setItem('tt_lang', lang);
                // Usuń klasę po zmianie, aby animacja była gotowa na następny raz
                document.querySelectorAll('[data-action="select-language"]').forEach(btn => btn.classList.remove('is-selected'));
            }, 300); // Daj czas na feedback wizualny
          }
          break;
        }

      // --- PWA ---
      case 'pwa-install':
        PWA.handleInstallClick();
        break;
      case 'pwa-dismiss':
        PWA.handleDismissClick();
        break;

      // --- Immersive mode ---
      case 'toggle-immersive-mode':
        UI.DOM.container.classList.toggle('hide-ui');
        break;
    }
  },

  formSubmitHandler: async (event) => {
    event.preventDefault();
    const form = event.target;

    switch (form.id) {
      case 'loginForm':
        const loginEmail = form.querySelector('#login-email').value;
        const loginPassword = form.querySelector('#login-password').value;
        await authManager.login(loginEmail, loginPassword);
        break;

      case 'signupForm':
        // Logika rejestracji (jeśli istnieje)
        break;

      case 'commentForm':
        // Ta logika została przeniesiona do CommentsModal.js
        break;
    }
  },

  handleNotificationClick: (event) => {
    const target = event.target.closest('.notification-item');
    if (!target) return;

    const notificationId = target.dataset.id;
    // Zaimplementuj logikę, np. oznacz jako przeczytane, przejdź do posta itp.
    console.log(`Notification ${notificationId} clicked.`);
    target.classList.add('read');
  },

  profileModalTabHandler: (event) => {
    const tab = event.target.closest('.tab-item');
    if (tab) {
      const tabName = tab.dataset.tab;
      const modal = tab.closest('.modal-content');
      modal.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      modal.querySelector(`.tab-pane[data-tab-content="${tabName}"]`).classList.add('active');
    }
  }

};