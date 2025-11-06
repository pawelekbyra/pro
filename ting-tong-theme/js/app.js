import { Config } from './modules/config.js';
import { State } from './modules/state.js';
import { Utils } from './modules/utils.js';
import { API, slidesData } from './modules/api.js';
import { UI } from './modules/ui.js';
import { PWA } from './modules/pwa.js';
import { Handlers } from './modules/handlers.js';
import { Notifications } from './modules/notifications.js';
import { AccountPanel } from './modules/account-panel.js';
import { authManager } from './modules/auth-manager.js';
import { FirstLoginModal } from './modules/first-login-modal.js';
import { TippingModal } from './modules/tipping-modal.js';
import { CommentsModal } from './modules/comments-modal.js';

UI.setPwaModule(PWA);
PWA.setUiModule(UI);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const themeUrl = typeof TingTongConfig !== 'undefined'
      ? TingTongConfig.themeUrl
      : '/wp-content/themes/ting-tong-theme/';

    let swUrl = typeof TingTongConfig !== 'undefined'
      ? TingTongConfig.serviceWorkerUrl
      : '/wp-content/themes/ting-tong-theme/sw.js';

    swUrl += `?themeUrl=${encodeURIComponent(themeUrl)}`;

    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('✅ Service Worker zarejestrowany:', registration);
      })
      .catch(error => {
        console.error('❌ Błąd rejestracji Service Workera:', error);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  API.init();
  UI.initDOMCache();

  document.body.addEventListener('click', (e) => {
    console.log('%c[DIAGNOSTYKA] Kliknięto w element:', 'color: #ff0055; font-weight: bold;', e.target);
  }, true);

  if (typeof window.ajax_object === "undefined") {
    console.warn("`ajax_object` is not defined. Using mock data for standalone development.");
    window.ajax_object = {
      ajax_url: "#",
      nonce: "0a1b2c3d4e",
    };
  }

  const App = (function () {
    function _initializeGlobalListeners() {
      Utils.setAppHeightVar();
      window.addEventListener("resize", Utils.setAppHeightVar);
      window.addEventListener("orientationchange", Utils.setAppHeightVar);

      ["touchstart", "pointerdown", "click", "keydown"].forEach((evt) => {
        document.addEventListener(evt, Utils.recordUserGesture, {
          passive: true,
        });
      });

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        console.log('`beforeinstallprompt` event captured in app.js.');
        PWA.runStandaloneCheck();
      });


      document.body.addEventListener("click", Handlers.mainClickHandler);
      document.body.addEventListener("submit", Handlers.formSubmitHandler);

      document
        .querySelectorAll(".modal-overlay:not(#accountModal):not(#welcome-modal):not(#comments-modal-container)")
        .forEach((modal) => {
          modal.addEventListener("click", (e) => {
            if (e.target === modal) UI.closeModal(modal);
          });
          modal
            .querySelector(".modal-close-btn, .topbar-close-btn")
            ?.addEventListener("click", () => UI.closeModal(modal));
        });

      const commentsModal = UI.DOM.commentsModal;
      if (commentsModal) {
        commentsModal.addEventListener('click', (e) => {
          if (e.target === commentsModal) {
            UI.closeCommentsModal();
          }
        });
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const visibleModal = document.querySelector(
            ".modal-overlay.visible:not(#accountModal):not(#cropModal)",
          );
          if (visibleModal) UI.closeModal(visibleModal);
          if (UI.DOM.notificationPopup.classList.contains("visible"))
            UI.DOM.notificationPopup.classList.remove("visible");
        }
      });

      document.addEventListener("click", (event) => {
        const popup = UI.DOM.notificationPopup;
        if (
          popup &&
          popup.classList.contains("visible") &&
          !popup.contains(event.target) &&
          !event.target.closest('[data-action="toggle-notifications"]')
        ) {
          popup.classList.remove("visible");
        }

        const openDropdown = document.querySelector(".sort-dropdown.open");
        if (openDropdown && !openDropdown.contains(event.target)) {
          openDropdown.classList.remove("open");
        }
      });

      UI.DOM.notificationPopup
        .querySelector(".notification-list")
        .addEventListener("click", Handlers.handleNotificationClick);
      UI.DOM.tiktokProfileModal?.addEventListener(
        "click",
        Handlers.profileModalTabHandler,
      );

    }

    function _initializeStateListeners() {
      State.on('user:login', async (data) => {
        console.log('User logged in:', data.userData.email);
        _fetchAndUpdateSlideData();
        UI.updateUIForLoginState();
        UI.updateTranslations();
        if (data.userData && AccountPanel?.populateProfileForm) {
          AccountPanel.populateProfileForm(data.userData);
        }
        FirstLoginModal.enforceModalIfIncomplete(data.userData);
      });

      State.on('user:logout', () => {
        console.log('User logged out');
        _fetchAndUpdateSlideData();
        UI.updateUIForLoginState();
        UI.updateTranslations();
      });

      State.on('state:change:isUserLoggedIn', ({ oldValue, newValue }) => {
        console.log(`Login state changed: ${oldValue} -> ${newValue}`);
        UI.updateUIForLoginState();
      });

      State.on('state:change:currentLang', ({ newValue }) => {
        console.log(`Language changed to: ${newValue}`);
        UI.updateTranslations();
        TippingModal.updateLanguage();
      });
    }

    async function _verifyLoginState() {
      try {
        const isLoggedIn = await authManager.checkLoginStatus();
        const userData = State.get('currentUser');

        if (isLoggedIn) {
          console.log('User is logged in, profile loaded');
          if (userData && AccountPanel?.populateProfileForm) {
            AccountPanel.populateProfileForm(userData);
          }
          FirstLoginModal.enforceModalIfIncomplete(userData);
        } else {
          console.log('User is not logged in');
        }
      } catch (error) {
        console.warn('Failed to verify login state:', error);
      }
    }

    async function _fetchAndUpdateSlideData() {
      const json = await API.fetchSlidesData();
      if (json.success && Array.isArray(json.data)) {
        const newDataMap = new Map(
          json.data.map((item) => [String(item.likeId), item]),
        );
        slidesData.forEach((existingSlide) => {
          const updatedInfo = newDataMap.get(String(existingSlide.likeId));
          if (updatedInfo) {
            existingSlide.isLiked = updatedInfo.isLiked;
            existingSlide.initialLikes = updatedInfo.initialLikes;
            UI.applyLikeStateToDom(
              existingSlide.likeId,
              existingSlide.isLiked,
              existingSlide.initialLikes,
            );
          }
        });
      }
    }

    function _startApp(selectedLang) {
      try {
        State.set("currentLang", selectedLang);
        localStorage.setItem("tt_lang", selectedLang);

        _verifyLoginState();
        UI.renderSlides();
        UI.updateTranslations();

        const handleMediaChange = (swiper) => {
          swiper.el.querySelectorAll('video').forEach(video => {
            if (!video.paused) {
              video.pause();
            }
          });

          swiper.el.querySelectorAll(".swiper-slide iframe").forEach((iframe) => {
              if (iframe.src) {
                if (!iframe.dataset.originalSrc) iframe.dataset.originalSrc = iframe.src;
                iframe.src = "";
              }
          });

          const activeSlide = swiper.slides[swiper.activeIndex];

          if (activeSlide) {
            const slideData = slidesData[swiper.realIndex];

            const secretOverlay = activeSlide.querySelector('.secret-overlay');
            const pwaSecretOverlay = activeSlide.querySelector('.pwa-secret-overlay');

            const isSecretVisible = secretOverlay && secretOverlay.classList.contains('visible');
            const isPwaSecretVisible = pwaSecretOverlay && pwaSecretOverlay.classList.contains('visible');
            const isAnyOverlayVisible = isSecretVisible || isPwaSecretVisible;

            if (slideData && slideData.isIframe) {
              const iframe = activeSlide.querySelector("iframe");
              if (iframe && iframe.dataset.originalSrc && !isAnyOverlayVisible){
                iframe.src = iframe.dataset.originalSrc;
              }
            } else {
              const video = activeSlide.querySelector("video");
              if (video) {
                const pauseOverlay = activeSlide.querySelector(".pause-overlay");
                if (pauseOverlay) pauseOverlay.classList.remove("visible");
                const replayOverlay = activeSlide.querySelector(".replay-overlay");
                if (replayOverlay) replayOverlay.classList.remove("visible");

                video.muted = State.get("isSoundMuted");

                if (!isAnyOverlayVisible) {
                  video.play().catch((error) => {
                      console.log("Autoplay was prevented for slide " + swiper.realIndex, error);
                  });
                } else {
                  console.log("Video paused due to overlay visibility on slide " + swiper.realIndex);
                  video.pause();
                  video.currentTime = 0;
                }
              }
            }
          }
        };

        const swiper = new Swiper(".swiper", {
          direction: "vertical",
          mousewheel: { releaseOnEdges: true },
          loop: true,
          keyboard: { enabled: true, onlyInViewport: false },
          speed: 300,
          touchEventsTarget: 'wrapper',
          resistance: true,
          resistanceRatio: 0.85,
          preventInteractionOnTransition: true,
          edgeSwipeDetection: 'prevent',
          noSwipingSelector: '.sidebar',
          on: {
            init: function (swiper) {
              UI.updateVolumeButton(State.get("isSoundMuted"));
              handleMediaChange(swiper);

              setTimeout(() => {
                const activeSlide = swiper.slides[swiper.activeIndex];
                if (activeSlide) {
                    activeSlide.querySelector('.tiktok-symulacja').classList.add('video-loaded');
                }
              }, 400);
              UI.DOM.preloader.classList.add("preloader-hiding");
              UI.DOM.container.classList.add("ready");
              PWA.runStandaloneCheck();

              const transitionEndHandler = () => {
                UI.DOM.preloader.removeEventListener("transitionend", transitionEndHandler);
                UI.DOM.preloader.style.display = "none";
                if (sessionStorage.getItem('showAlreadyInstalledToast') === 'true') {
                  UI.showAlert(Utils.getTranslation("alreadyInstalledToast"), false, 3000);
                  sessionStorage.removeItem('showAlreadyInstalledToast');
                }
              };

              UI.DOM.preloader.addEventListener("transitionend", transitionEndHandler, { once: true });
              setTimeout(transitionEndHandler, 600);
            },
            slideChange: handleMediaChange,
            click: function(swiper, event) {
              if (event.target.closest('[data-action]')) {
                return;
              }

              const activeSlide = swiper.slides[swiper.activeIndex];
              const video = activeSlide?.querySelector("video");
              if (!video) return;

              if (video.paused) {
                video.play().catch((err) => console.log("Błąd play:", err));
                const pauseOverlay = activeSlide.querySelector(".pause-overlay");
                if (pauseOverlay) pauseOverlay.classList.remove("visible");
              } else {
                video.pause();
                const pauseOverlay = activeSlide.querySelector(".pause-overlay");
                if (pauseOverlay) pauseOverlay.classList.add("visible");
              }
            },
          },
        });

        State.set('swiper', swiper);

      } catch (error) {
        console.error("TingTong App Start Error:", error);
      }
    }

    function _initializePreloader() {
      UI.DOM.preloader.classList.add("content-visible");

      UI.DOM.preloader
        .querySelectorAll(".language-selection button")
        .forEach((button) => {
          button.addEventListener(
            "click",
            () => {
              UI.DOM.preloader
                .querySelectorAll(".language-selection button")
                .forEach((btn) => (btn.disabled = true));
              button.classList.add("is-selected");
              setTimeout(() => _startApp(button.dataset.lang), 300);
            },
            { once: true },
          );
        });
    }

    function _setInitialConfig() {
      try {
        const c = navigator.connection || navigator.webkitConnection;
        if (c?.saveData) Config.LOW_DATA_MODE = true;
        if (c?.effectiveType?.includes("2g")) Config.LOW_DATA_MODE = true;
        if (c?.effectiveType?.includes("3g"))
          Config.HLS.maxAutoLevelCapping = 480;
      } catch (_) {}
    }

    return {
      init: () => {
        _setInitialConfig();
        _initializeGlobalListeners();
        _initializeStateListeners();
        AccountPanel.init();
        FirstLoginModal.init();
        TippingModal.init();
        CommentsModal.init();
        UI.initGlobalPanels();
        PWA.init();
        _initializePreloader();
        document.body.classList.add("loaded");
      },
      fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
    };
  })();

  App.init();

  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === 'true';

  if (isDebugMode || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('local')))) {
    window.ttAuth = authManager;
    window.ttState = State;
    console.log('%c🔧 Debug Mode', 'color: #ff0055; font-size: 16px; font-weight: bold');
    console.log('Available: window.ttAuth, window.ttState, #mockLoginBtn');

    const mockBtn = document.getElementById('mockLoginBtn');
    if (mockBtn) {
      mockBtn.style.display = 'block';
      mockBtn.textContent = 'DEBUG: Pokaż Tipping Modal';
      mockBtn.removeEventListener('click', (e) => {});
      mockBtn.addEventListener('click', () => {
        State.set('isUserLoggedIn', true, true);
        State.set('currentUser', { email: 'debug@test.com' }, true);
        TippingModal.showModal();
        UI.showAlert('Mock logowanie i otwarcie modala napiwków.', false);
      });
    }
  }
});