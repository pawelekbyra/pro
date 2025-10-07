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

// Rejestracja Service Workera
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ting-tong-theme/sw.js')
      .then(registration => {
        console.log('Service Worker zarejestrowany:', registration);
      })
      .catch(error => {
        console.error('Błąd rejestracji Service Workera:', error);
      });
  });
}

// The CDN helper code has been removed as it was unused and overly complex.

document.addEventListener("DOMContentLoaded", () => {
  // Guard for undefined WordPress objects in standalone mode
  if (typeof window.ajax_object === "undefined") {
    console.warn(
      "`ajax_object` is not defined. Using mock data for standalone development.",
    );
    window.ajax_object = {
      ajax_url: "#", // Prevent actual network requests
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


      document.body.addEventListener("click", Handlers.mainClickHandler);
      document.body.addEventListener("submit", Handlers.formSubmitHandler);

      document
        .querySelectorAll(".modal-overlay:not(#accountModal):not(#welcome-modal)")
        .forEach((modal) => {
          modal.addEventListener("click", (e) => {
            if (e.target === modal) UI.closeModal(modal);
          });
          modal
            .querySelector(".modal-close-btn, .topbar-close-btn")
            ?.addEventListener("click", () => UI.closeModal(modal));
        });

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
      // Listener dla logowania
      State.on('user:login', async (data) => {
        console.log('User logged in:', data.userData.email);

        if (data.slidesData && Array.isArray(data.slidesData)) {
          slidesData.length = 0;
          Array.prototype.push.apply(slidesData, data.slidesData);
          slidesData.forEach((s) => {
            s.likeId = String(s.likeId);
          });
          UI.renderSlides();
        }

        UI.updateUIForLoginState();
        UI.updateTranslations();

        if (data.userData && AccountPanel?.populateProfileForm) {
          AccountPanel.populateProfileForm(data.userData);
        }
      });

      // Listener dla wylogowania
      State.on('user:logout', () => {
        console.log('User logged out');

        slidesData.forEach(slide => {
          slide.isLiked = false;
        });

        UI.updateUIForLoginState();
        UI.updateTranslations();
      });

      // Listener dla zmian stanu logowania
      State.on('state:change:isUserLoggedIn', ({ oldValue, newValue }) => {
        console.log(`Login state changed: ${oldValue} -> ${newValue}`);
        UI.updateUIForLoginState();
      });

      // Listener dla zmian języka
      State.on('state:change:currentLang', ({ newValue }) => {
        console.log(`Language changed to: ${newValue}`);
        UI.updateTranslations();
      });
    }

    async function _verifyLoginState() {
      try {
        const isLoggedIn = await authManager.checkLoginStatus();

        if (isLoggedIn) {
          console.log('User is logged in, profile loaded');
          const userData = State.get('currentUser');

          if (userData && AccountPanel?.populateProfileForm) {
            AccountPanel.populateProfileForm(userData);
          }
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

        _verifyLoginState(); // Async verification in background
        UI.renderSlides();
        UI.updateTranslations();

        const handleMediaChange = (swiper) => {
          // First, pause every single video element within the swiper container.
          swiper.el.querySelectorAll('video').forEach(video => {
            if (!video.paused) {
              video.pause();
            }
          });

          // Also unload all iframes to save resources.
          swiper.el.querySelectorAll(".swiper-slide iframe").forEach((iframe) => {
              if (iframe.src) {
                if (!iframe.dataset.originalSrc) iframe.dataset.originalSrc = iframe.src;
                iframe.src = "";
              }
          });

          // Now, get the truly active slide element.
          const activeSlide = swiper.slides[swiper.activeIndex];

          // Play media for the new active slide.
          if (activeSlide) {
            // Use realIndex to get data from our original array, which is correct for loop mode.
            const slideData = slidesData[swiper.realIndex];
            if (slideData && slideData.isIframe) {
              const iframe = activeSlide.querySelector("iframe");
              if (iframe && iframe.dataset.originalSrc) {
                iframe.src = iframe.dataset.originalSrc;
              }
            } else {
              const video = activeSlide.querySelector("video");
              if (video) {
                // Hide overlays
                const pauseOverlay = activeSlide.querySelector(".pause-overlay");
                if (pauseOverlay) pauseOverlay.classList.remove("visible");
                const replayOverlay = activeSlide.querySelector(".replay-overlay");
                if (replayOverlay) replayOverlay.classList.remove("visible");

                video.muted = State.get("isSoundMuted");
                // We don't reset currentTime here, to allow resuming. The replay button will reset it.
                video.play().catch((error) => {
                    console.log("Autoplay was prevented for slide " + swiper.realIndex, error);
                });
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
          on: {
            init: function (swiper) {
              // --- One-time animation on first app load ---
              UI.updateVolumeButton(State.get("isSoundMuted"));
              // Also handle media for the very first slide on init.
              handleMediaChange(swiper);
            },
            slideChange: handleMediaChange,
            click: function (swiper, event) {
              // Ignoruj kliknięcia na interaktywnych elementach
              if (event.target.closest('[data-action], .sidebar, .bottombar, .secret-overlay')) {
                return;
              }

              const activeSlide = swiper.slides[swiper.activeIndex];
              const video = activeSlide?.querySelector('video');

              if (!video) return;

              const pauseOverlay = activeSlide.querySelector('.pause-overlay');
              const replayOverlay = activeSlide.querySelector('.replay-overlay');

              // ✅ PRZYPADEK 1: Film się skończył - replay
              if (video.ended) {
                video.currentTime = 0;
                video.play().catch(err => console.log("Błąd replay:", err));
                if (replayOverlay) replayOverlay.classList.remove('visible');
                return;
              }

              // ✅ PRZYPADEK 2: Film jest spauzowany - odtwórz
              if (video.paused) {
                video.play().catch(err => console.log("Błąd play:", err));
                if (pauseOverlay) pauseOverlay.classList.remove('visible');
              }
              // ✅ PRZYPADEK 3: Film gra - spauzuj
              else {
                video.pause();
                if (pauseOverlay) pauseOverlay.classList.add('visible');
              }
            },
          },
        });

        setTimeout(() => {
          UI.DOM.preloader.classList.add("preloader-hiding");
          UI.DOM.container.classList.add("ready");
          // The PWA install bar logic is now fully handled by the PWA module.
          UI.DOM.preloader.addEventListener(
            "transitionend",
            () => {
              UI.DOM.preloader.style.display = "none";
              // Pokaż modal powitalny tylko w przeglądarce, nie w PWA, i tylko raz
              if (!PWA.isStandalone() && UI.DOM.welcomeModal) {
                const hasSeenWelcome = localStorage.getItem('tt_seen_welcome');
                if (!hasSeenWelcome) {
                  setTimeout(() => {
                    UI.openModal(UI.DOM.welcomeModal);
                    localStorage.setItem('tt_seen_welcome', 'true');
                  }, 1000);
                }
              }
            },
            { once: true },
          );
        }, 1000);
      } catch (error) {
        alert(
          "Application failed to start. Error: " +
            error.message +
            "\\n\\nStack: " +
            error.stack,
        );
        console.error("TingTong App Start Error:", error);
      }
    }

    function _initializePreloader() {
      setTimeout(() => UI.DOM.preloader.classList.add("content-visible"), 500);
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
        _initializeStateListeners(); // DODANE
        AccountPanel.init();
        FirstLoginModal.init();
        UI.initGlobalPanels();
        UI.initKeyboardListener();
        PWA.init();
        _initializePreloader();
        document.body.classList.add("loaded");
      },
      fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
    };
  })();

  // Debug tools (tylko localhost)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('local'))) {
    window.ttAuth = authManager;
    window.ttState = State;
    console.log('%c🔧 Debug Mode', 'color: #ff0055; font-size: 16px; font-weight: bold');
    console.log('Available: window.ttAuth, window.ttState');
  }

  App.init();
});