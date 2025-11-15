import { State } from './state.js';
import { UI } from './ui.js';
import { Utils } from './utils.js';
import { API, slidesData } from './api.js';
import { PWA } from './pwa.js';
import { Notifications } from './notifications.js';
import { AccountPanel } from './account-panel.js';
import { authManager } from './auth-manager.js';
import { TippingModal } from './tipping-modal.js';
import { CommentsModal } from './comments-modal.js';

function mockToggleLogin() {
  const isLoggedIn = State.get("isUserLoggedIn");
  State.set("isUserLoggedIn", !isLoggedIn);
  UI.updateUIForLoginState();
  const message = !isLoggedIn
    ? Utils.getTranslation("loginSuccess")
    : Utils.getTranslation("logoutSuccess");
  UI.showAlert(message);

  if (!isLoggedIn) {
    const loginPanel = document.querySelector("#app-frame > .login-panel");
    if (loginPanel) loginPanel.classList.remove("active");
    const topbar = document.querySelector("#app-frame > .topbar");
    if (topbar) topbar.classList.remove("login-panel-active");
  }
}

async function handleLikeToggle(button) {
  if (!State.get("isUserLoggedIn")) {
    Utils.vibrateTry();
    UI.showAlert(Utils.getTranslation("likeAlert"));
    return;
  }
  const swiper = State.get('swiper');
  if (!swiper) return;
  const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;
  const slideData = slidesData.find((s) => s.id === slideId);
  if (!slideData) return;

  const isCurrentlyLiked = !!slideData.isLiked;
  const newLikedState = !isCurrentlyLiked;
  const currentCount = slideData.initialLikes;
  const newCount = newLikedState
    ? currentCount + 1
    : Math.max(0, currentCount - 1);

  slideData.isLiked = newLikedState;
  slideData.initialLikes = newCount;
  UI.applyLikeStateToDom(slideData.likeId, newLikedState, newCount);
  button.disabled = true;

  const json = await API.toggleLike(slideData.likeId);

  if (json.success) {
    slideData.isLiked = json.data.status === "liked";
    slideData.initialLikes = json.data.count;
    UI.applyLikeStateToDom(
      slideData.likeId,
      slideData.isLiked,
      slideData.initialLikes,
    );
  } else {
    slideData.isLiked = isCurrentlyLiked;
    slideData.initialLikes = currentCount;
    UI.applyLikeStateToDom(
      slideData.likeId,
      isCurrentlyLiked,
      currentCount,
    );
    UI.showAlert(
      json.data?.message || Utils.getTranslation("likeError"),
      true,
    );
  }
  button.disabled = false;
}

function handleShare(button) {
  const swiper = State.get('swiper');
  if (!swiper) return;
  const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;
  const slideData = slidesData.find(
    (s) => s.id === slideId,
  );
  if (navigator.share && slideData) {
    navigator
      .share({
        title: Utils.getTranslation("shareTitle"),
        text: slideData.description,
        url: window.location.href,
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Share error:", err);
      });
  } else {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => UI.showAlert(Utils.getTranslation("linkCopied")));
  }
}

async function handleLanguageToggle() {
  const oldLang = State.get("currentLang");
  const newLang = oldLang === "pl" ? "en" : "pl";
  const newLocale = newLang === 'pl' ? 'pl_PL' : 'en_GB';

  State.set("currentLang", newLang);
  localStorage.setItem("tt_lang", newLang);
  UI.updateTranslations();
  Notifications.render();

  if (State.get("isUserLoggedIn")) {
      try {
        const result = await API.updateLocale(newLocale);
        if (result.success) {
          console.log(`WordPress locale updated to: ${newLocale}`);
        } else {
          console.warn("Failed to update WP locale via main toggle:", result.data?.message);
        }
      } catch (error) {
        console.error("API Error updating WP locale via main toggle:", error);
      }
  }
}

export const Handlers = {
  handleNotificationClick: (event) => {
    const item = event.target.closest(".notification-item");
    if (!item) return;
    item.classList.toggle("expanded");
    item.setAttribute("aria-expanded", item.classList.contains("expanded"));
    if (item.classList.contains("unread")) {
      item.classList.remove("unread");
    }
  },
  mainClickHandler: async (e) => {
    const target = e.target;
    const actionTarget = target.closest("[data-action]");
    const videoThumbnail = target.closest(".video-thumbnail");

    if (videoThumbnail) {
        if (videoThumbnail.classList.contains('locked-thumbnail')) {
            UI.showAlert(Utils.getTranslation('becomePatronToWatch'), true);
            return;
        }
        const videoUrl = videoThumbnail.dataset.videoUrl;
        if (videoUrl) {
            const videoModal = document.getElementById('video-player-modal');
            const videoPlayer = videoModal.querySelector('video');
            videoPlayer.src = videoUrl;

            const swiper = State.get('swiper');
            let mainVideo;
            if (swiper && swiper.slides[swiper.activeIndex]) {
                mainVideo = swiper.slides[swiper.activeIndex].querySelector('video');
                if (mainVideo && !mainVideo.paused && !mainVideo.ended) {
                    mainVideo.pause();
                    State.set('videoPausedByAuthorModal', true);
                }
            }

            UI.openModal(videoModal);
            videoPlayer.play();

            const closeModalHandler = () => {
                videoPlayer.pause();
                if (State.get('videoPausedByAuthorModal') && mainVideo) {
                    mainVideo.play().catch(e => console.error("Błąd odtwarzania głównego wideo:", e));
                    State.set('videoPausedByAuthorModal', false);
                }
                State.set('videoPausedByAuthorModal', false);
            };
            videoModal.addEventListener('modal:close', closeModalHandler, { once: true });
            return;
        }
    }

    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;

    const topbar = document.querySelector("#app-frame > .topbar");
    const loginPanel = document.querySelector("#app-frame > .login-panel");
    const loggedInMenu = document.querySelector(
      "#app-frame > .logged-in-menu",
    );

    switch (action) {
      case "toggle-password-visibility":
        const passwordInput = document.getElementById('tt-password');
        const eyeOpen = actionTarget.querySelector('.eye-icon-open');
        const eyeClosed = actionTarget.querySelector('.eye-icon-closed');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        } else {
            passwordInput.type = 'password';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        }
        break;
      case "go-back":
        const modalToClose = actionTarget.closest(".modal-overlay");
        if (modalToClose) {
          UI.closeModal(modalToClose);
        }
        break;
      case "toggle-like":
        handleLikeToggle(actionTarget);
        break;
      case "share":
        handleShare(actionTarget);
        break;
      case "toggle-language":
        handleLanguageToggle();
        break;
      case 'open-comments-modal':
        // Zamiast UI.openModal, wywołaj nowy moduł
        CommentsModal.showModal();
        break;
      case "switch-profile-tab": {
        const tabButton = actionTarget;
        const tabContentId = tabButton.dataset.tab;
        const modal = tabButton.closest('.profile-modal-content');
        if (!modal) return;
        modal.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
        modal.querySelectorAll('.video-gallery').forEach(content => content.classList.remove('active'));
        tabButton.classList.add('active');
        const activeContent = modal.querySelector(`#${tabContentId}`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
        break;
      }
      case "open-info-modal":
        UI.openModal(document.getElementById('infoModal'), {
          animationClass: 'slideInFromTop'
        });
        break;
      case "open-tipping-from-info": {
        const infoModal = document.getElementById('infoModal');
        if (infoModal && infoModal.classList.contains('visible')) {
            UI.closeModal(infoModal, {
                keepFocus: true,
                animationClass: 'slideOutLeft',
                onClose: () => {
                    TippingModal.showModal({ animationClass: 'slideInRight' });
                }
            });
        } else {
            TippingModal.showModal();
        }
        break;
      }
      case "open-desktop-pwa-modal":
        PWA.openDesktopModal();
        break;
      case "open-ios-pwa-modal":
        PWA.openIosModal();
        break;
      case "install-pwa":
        break;
      case "open-author-profile":
        const swiper = State.get('swiper');
        if (swiper) {
            const activeSlide = swiper.slides[swiper.activeIndex];
            const slideId = activeSlide.dataset.slideId;
            const slideData = slidesData.find((s) => s.id === slideId);
            if (slideData) {
                const isLightTheme = activeSlide.classList.contains('slide--light-theme');
                UI.openAuthorProfileModal(slideData, { isLightTheme });
            }
        }
        break;
      case "close-author-profile": {
        const authorModal = actionTarget.closest('#author-profile-modal');
        UI.closeModal(authorModal, {
            animationClass: 'slideOutRight',
            contentSelector: '.profile-modal-content'
        });
        break;
      }
      case "close-modal":
        e.stopPropagation();
        const modal = actionTarget.closest(".modal-overlay");
        if (modal) {
          if (modal.id === 'infoModal') {
            UI.closeModal(modal, { animationClass: 'slideOutToTop' });
          } else {
            UI.closeModal(modal);
          }
        } else {
          PWA.closePwaModals();
        }
        break;
      case "close-welcome-modal":
        UI.closeWelcomeModal();
        break;
      case "open-account-modal":
        AccountPanel.openAccountModal();
        break;
      case "close-account-modal":
        UI.closeModal(UI.DOM.accountModal, { animationClass: 'slideOutLeft' });
        break;
      case "logout":
        e.preventDefault();
        (async () => {
          if (actionTarget.disabled) return;
          actionTarget.disabled = true;
          const originalText = actionTarget.textContent;
          try {
            await authManager.logout();
            if (loggedInMenu) loggedInMenu.classList.remove("active");
            UI.showAlert(Utils.getTranslation("logoutSuccess"));
          } catch (error) {
            console.error('Logout error:', error);
            UI.showAlert(error.message || 'Logout failed', true);
          } finally {
            actionTarget.disabled = false;
            actionTarget.textContent = originalText;
          }
        })();
        break;
      case "toggle-main-menu":
        if (State.get("isUserLoggedIn")) {
          if (loggedInMenu) loggedInMenu.classList.toggle("active");
        } else {
          Utils.vibrateTry();
          UI.showAlert(Utils.getTranslation("menuAccessAlert"));
        }
        break;
      case "toggle-login-panel":
        if (!State.get("isUserLoggedIn")) {
            const swiper = State.get('swiper');
            if (swiper) {
                const activeSlide = swiper.slides[swiper.activeIndex];
                const video = activeSlide?.querySelector('video');
                if (video) {
                    State.set('videoPlaybackState', {
                        slideId: activeSlide.dataset.slideId,
                        currentTime: video.currentTime,
                    });
                }
            }
            if (UI.DOM.commentsModal.classList.contains("visible")) {
                UI.closeModal(UI.DOM.commentsModal);
            }
            if (loginPanel) {
                if (loginPanel.classList.contains('active')) {
                    loginPanel.classList.add('login-panel--closing');
                    const onTransitionEnd = (e) => {
                        if (e.propertyName === 'transform' && loginPanel.classList.contains('login-panel--closing')) {
                            loginPanel.classList.remove('active', 'login-panel--closing');
                            loginPanel.removeEventListener('transitionend', onTransitionEnd);
                            if (topbar) {
                                topbar.classList.remove("login-panel-active");
                            }
                        }
                    };
                    loginPanel.addEventListener('transitionend', onTransitionEnd);
                } else {
                    loginPanel.classList.remove('login-panel--closing');
                    loginPanel.classList.add('active');
                    if (topbar) {
                        topbar.classList.add("login-panel-active");
                    }
                }
            }
        }
        break;
      case "subscribe":
        if (!State.get("isUserLoggedIn")) {
          Utils.vibrateTry();
          UI.showAlert(Utils.getTranslation("subscribeAlert"));
        }
        break;
      case "toggle-notifications":
        const notificationPopup = document.getElementById("notificationPopup");
        if (notificationPopup) {
            notificationPopup.classList.toggle("visible");
        }
        break;
      case "close-notifications":
        if (UI.DOM.notificationPopup) {
          UI.DOM.notificationPopup.classList.remove("visible");
        }
        break;
      case "show-tip-jar":
        const authorModal = actionTarget.closest('#author-profile-modal');
        if (authorModal) {
            UI.closeModal(authorModal, {
                animationClass: 'slideOutRight',
                contentSelector: '.profile-modal-content',
            });
            TippingModal.showModal({
                animationClass: 'slideInRight'
            });
        } else {
            TippingModal.showModal();
        }
        break;
      case "tipping-next":
        TippingModal.handleNextStep();
        break;
      case "tipping-prev":
        TippingModal.handlePrevStep();
        break;
      case "play-video": {
        const video = actionTarget.closest(".tiktok-symulacja")?.querySelector("video");
        if (video) {
          video.play().catch(err => console.log("Błąd play:", err));
          const pauseOverlay = actionTarget.closest(".tiktok-symulacja")?.querySelector(".pause-overlay");
          if (pauseOverlay) pauseOverlay.classList.remove('visible');
        }
        break;
      }
      case "replay-video": {
        const video = actionTarget.closest(".tiktok-symulacja")?.querySelector("video");
        if (video) {
          video.currentTime = 0;
          video.play().catch(err => console.log("Błąd replay:", err));
          const replayOverlay = actionTarget.closest(".tiktok-symulacja")?.querySelector(".replay-overlay");
          if (replayOverlay) replayOverlay.classList.remove('visible');
        }
        break;
      }
      case "toggle-volume":
        e.stopPropagation();
        const isMuted = !State.get("isSoundMuted");
        State.set("isSoundMuted", isMuted);
        const activeSlideVideo = document.querySelector(".swiper-slide-active video");
        if (activeSlideVideo) {
          activeSlideVideo.muted = isMuted;
        }
        UI.updateVolumeButton(isMuted);
        break;
      case "toggle-fullscreen": {
        if (!PWA.isStandalone()) {
          UI.showToast(Utils.getTranslation("immersiveModePwaOnly"));
          return;
        }
        const appFrame = document.getElementById("app-frame");
        if (appFrame) {
            const isHiding = appFrame.classList.toggle("hide-ui");
            const activeSlide = document.querySelector('.swiper-slide-active');
            const btn = activeSlide?.querySelector('.fullscreen-button');
            if (btn) {
                const enterIcon = btn.querySelector('.fullscreen-enter-icon');
                const exitIcon = btn.querySelector('.fullscreen-exit-icon');
                if (isHiding) {
                    enterIcon.style.display = 'none';
                    exitIcon.style.display = 'block';
                } else {
                    enterIcon.style.display = 'block';
                    exitIcon.style.display = 'none';
                }
            }
        }
        break;
      }
    }
  },
  formSubmitHandler: async (e) => {
    const loginForm = e.target.closest("form#tt-login-form");
    if (loginForm) {
      e.preventDefault();
      const usernameInput = loginForm.querySelector("#tt-username");
      const passwordInput = loginForm.querySelector("#tt-password");
      const submitButton = loginForm.querySelector("#tt-login-submit");
      if (!usernameInput || !passwordInput) {
        UI.showAlert("Form elements not found", true);
        return;
      }
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      if (!username || !password) {
        UI.showAlert(Utils.getTranslation("allFieldsRequiredError") || "Please enter username and password.", true);
        return;
      }
      submitButton.disabled = true;
      const originalText = submitButton.textContent;
      submitButton.innerHTML = '<span class="loading-spinner"></span>';
      try {
        await authManager.login(username, password);
        usernameInput.value = '';
        passwordInput.value = '';
      } catch (error) {
        console.error('Login error:', error);
        UI.showAlert(
          error.message || Utils.getTranslation("loginFailed"),
          true
        );
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }
      return;
    }

    const tippingForm = e.target.closest("form#tippingForm");
    if (tippingForm) {
        e.preventDefault();
        TippingModal.handleFormSubmit();
        return;
    }

  },
};
