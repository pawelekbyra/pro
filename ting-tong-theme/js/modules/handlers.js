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

  // If we are logging in, close the panel
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

  // Optimistic UI update
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
    // Revert
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

async function handleLanguageToggle() { // Zmień na async
  const oldLang = State.get("currentLang");
  const newLang = oldLang === "pl" ? "en" : "pl";

  // Mapowanie na lokalizację WP
  const newLocale = newLang === 'pl' ? 'pl_PL' : 'en_GB';

  // 1. Aktualizacja stanu aplikacji
  State.set("currentLang", newLang);
  localStorage.setItem("tt_lang", newLang);

  // 2. Aktualizacja UI
  UI.updateTranslations();
  Notifications.render();

  // 3. Wysłanie nowej lokalizacji do API WordPressa
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
  mainClickHandler: (e) => {
    const target = e.target;
    const actionTarget = target.closest("[data-action]");
    const videoThumbnail = target.closest(".video-thumbnail");

    if (videoThumbnail) {
        const videoUrl = videoThumbnail.dataset.videoUrl;
        if (videoUrl) {
            const videoModal = document.getElementById('video-player-modal');
            const videoPlayer = videoModal.querySelector('video');
            videoPlayer.src = videoUrl;
            UI.openModal(videoModal);
            videoPlayer.play();

            const closeModalHandler = () => videoPlayer.pause();
            videoModal.addEventListener('modal:close', closeModalHandler, { once: true });
            return;
        }
    }

    // Handle comment-related actions first
    if (actionTarget && actionTarget.closest(".comment-item")) {
      const commentItem = actionTarget.closest(".comment-item");
      const commentId = commentItem.dataset.commentId;
      const slideId = document.querySelector(".swiper-slide-active")
        ?.dataset.slideId;

      // Walidacja przed wykonaniem akcji
      if (!slideId || !commentId) {
        console.error('Missing slideId or commentId');
        return;
      }

      // Sprawdź czy użytkownik jest zalogowany (dla akcji wymagających autoryzacji)
      const requiresAuth = ['edit-comment', 'delete-comment', 'toggle-comment-like'];
      if (requiresAuth.includes(actionTarget.dataset.action) && !State.get('isUserLoggedIn')) {
        UI.showAlert(Utils.getTranslation('likeAlert'), true);
        return;
      }

      switch (actionTarget.dataset.action) {
        case "toggle-comment-like": {
          const countEl = commentItem.querySelector(".comment-like-count");

          if (!countEl) {
            console.error('Like count element not found');
            return;
          }

          let currentLikes = parseInt(countEl.textContent.replace(/K|M/g, "")) || 0;

          // Optimistic UI update
          actionTarget.classList.toggle("active");
          const isLiked = actionTarget.classList.contains("active");
          currentLikes += isLiked ? 1 : -1;
          countEl.textContent = Utils.formatCount(currentLikes);

          // Disable button podczas requestu
          actionTarget.disabled = true;

          API.toggleCommentLike(slideId, commentId)
            .then((response) => {
              // Walidacja odpowiedzi
              if (!response || typeof response.success !== 'boolean') {
                throw new Error('Invalid response format');
              }

              if (!response.success) {
                // Revert on failure
                actionTarget.classList.toggle("active");
                currentLikes += isLiked ? -1 : 1;
                countEl.textContent = Utils.formatCount(currentLikes);

                throw new Error(
                  response.data?.message || Utils.getTranslation("failedToUpdateLike")
                );
              }

              // Zaktualizuj z prawdziwą wartością z serwera
              if (response.data?.likes !== undefined) {
                countEl.textContent = Utils.formatCount(response.data.likes);
              }
            })
            .catch((error) => {
              console.error('Toggle comment like error:', error);
              UI.showAlert(error.message || Utils.getTranslation("failedToUpdateLike"), true);
            })
            .finally(() => {
              actionTarget.disabled = false;
            });
          break;
        }
        case "edit-comment": {
          const textElement = commentItem.querySelector(".comment-text");

          if (!textElement) {
            console.error('Comment text element not found');
            return;
          }

          const currentText = textElement.textContent;
          const newText = prompt(
            Utils.getTranslation("editCommentPrompt"),
            currentText,
          );

          // Walidacja input
          if (!newText || !newText.trim()) {
            return;
          }

          if (newText.trim() === currentText) {
            return; // Brak zmian
          }

          // Disable edit button podczas requestu
          actionTarget.disabled = true;

          API.editComment(slideId, commentId, newText.trim())
            .then((response) => {
              // Walidacja odpowiedzi
              if (!response || typeof response.success !== 'boolean') {
                throw new Error('Invalid response format');
              }

              if (!response.success) {
                throw new Error(
                  response.data?.message || Utils.getTranslation("commentUpdateError")
                );
              }

              // Sprawdź czy mamy dane komentarza
              if (!response.data || !response.data.id) {
                throw new Error('Invalid comment data in response');
              }

              // Zaktualizuj w slidesData
              const slideData = slidesData.find((s) => s.id === slideId);
              if (slideData && Array.isArray(slideData.comments)) {
                const commentIndex = slideData.comments.findIndex(
                  c => String(c.id) === String(commentId)
                );
                if (commentIndex > -1) {
                  slideData.comments[commentIndex] = response.data;
                }
                UI.renderComments(slideData.comments);
              }

              UI.showToast(Utils.getTranslation("commentUpdateSuccess"));
            })
            .catch((error) => {
              console.error('Edit comment error:', error);
              UI.showAlert(error.message || Utils.getTranslation("commentUpdateError"), true);
            })
            .finally(() => {
              actionTarget.disabled = false;
            });
          break;
        }
        case "delete-comment": {
          if (!confirm(Utils.getTranslation("deleteCommentConfirm"))) {
            return;
          }

          // Disable delete button podczas requestu
          actionTarget.disabled = true;

          API.deleteComment(slideId, commentId)
            .then((response) => {
              // Walidacja odpowiedzi
              if (!response || typeof response.success !== 'boolean') {
                throw new Error('Invalid response format');
              }

              if (!response.success) {
                throw new Error(
                  response.data?.message || Utils.getTranslation("commentDeleteError")
                );
              }

              // Sprawdź czy mamy new_count
              if (typeof response.data?.new_count !== 'number') {
                console.warn('Missing new_count in response, calculating manually');
              }

              // Zaktualizuj slidesData
              const slideData = slidesData.find((s) => s.id === slideId);
              if (slideData) {
                // Usuń komentarz z lokalnych danych
                if (Array.isArray(slideData.comments)) {
                  const commentIndex = slideData.comments.findIndex(
                    c => String(c.id) === String(commentId)
                  );
                  if (commentIndex > -1) {
                    slideData.comments.splice(commentIndex, 1);
                  }
                }

                // Zaktualizuj licznik
                slideData.initialComments = response.data?.new_count ?? slideData.comments.length;

                // Re-render komentarzy
                UI.renderComments(slideData.comments);

                // Zaktualizuj licznik w głównym widoku
                const slideElement = document.querySelector(
                  `.swiper-slide-active[data-slide-id="${slideId}"]`
                );
                const mainSlideCount = slideElement?.querySelector(".comment-count");
                if (mainSlideCount) {
                  mainSlideCount.textContent = Utils.formatCount(slideData.initialComments);
                }

                // Zaktualizuj tytuł modala
                const commentsTitle = UI.DOM.commentsModal.querySelector("#commentsTitle");
                if (commentsTitle) {
                  commentsTitle.textContent = `${Utils.getTranslation("commentsModalTitle")} (${slideData.initialComments})`;
                }
              }

              UI.showToast(Utils.getTranslation("commentDeleteSuccess"));
            })
            .catch((error) => {
              console.error('Delete comment error:', error);
              UI.showAlert(error.message || Utils.getTranslation("commentDeleteError"), true);
              actionTarget.disabled = false; // Re-enable jeśli błąd
            });
          break;
        }
      }
      // Return to avoid double-handling reply-to-comment
      if (actionTarget.dataset.action !== 'reply-to-comment') {
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
      case "toggle-emoji-picker":
        UI.toggleEmojiPicker();
        break;
      case "attach-image":
        UI.handleImageAttachment();
        break;
      case "remove-comment-image":
        UI.removeCommentImage();
        break;
      case "reply-to-comment": {
        const commentItem = actionTarget.closest(".comment-item");
        const commentId = commentItem?.dataset.commentId;
        const userElement = commentItem?.querySelector(".comment-user");

        // Walidacja
        if (!commentId || !userElement) {
          console.error('Invalid reply target');
          return;
        }

        const user = userElement.textContent;

        // Sprawdź czy już nie odpowiadamy na ten komentarz
        const currentReplyId = State.get("replyingToComment");
        if (currentReplyId === commentId) {
          // Już odpowiadamy na ten komentarz - tylko focus input
          UI.focusCommentInput();
          return;
        }

        State.set("replyingToComment", commentId);

        const formContainer = document.querySelector(".comment-form-container");
        if (!formContainer) {
          console.error('Comment form container not found');
          return;
        }

        // Usuń stary reply context jeśli istnieje (zapobieganie duplikatom)
        const oldReplyContext = formContainer.querySelector(".reply-context");
        if (oldReplyContext) {
          oldReplyContext.remove();
        }

        // Utwórz nowy reply context
        const replyContext = document.createElement("div");
        replyContext.className = "reply-context";
        formContainer.prepend(replyContext);

        const cancelAriaLabel = Utils.getTranslation("cancelReplyAriaLabel");
        const replyingToText = Utils.getTranslation("replyingTo").replace("{user}", user);

        replyContext.innerHTML = `
          <span class="reply-context-text">${replyingToText}</span>
          <button class="cancel-reply-btn" data-action="cancel-reply" aria-label="${cancelAriaLabel}">&times;</button>
        `;
        replyContext.style.display = "flex";

        // Animacja wejścia
        requestAnimationFrame(() => {
          replyContext.style.opacity = '0';
          replyContext.style.transform = 'translateY(-10px)';
          replyContext.style.transition = 'opacity 0.2s, transform 0.2s';

          requestAnimationFrame(() => {
            replyContext.style.opacity = '1';
            replyContext.style.transform = 'translateY(0)';
          });
        });

        UI.focusCommentInput();
        break;
      }
      case "cancel-reply": {
        State.set("replyingToComment", null);
        const replyContext = document.querySelector(".reply-context");
        if (replyContext) replyContext.style.display = "none";
        UI.removeCommentImage();
        break;
      }
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
      case "open-comments-modal": {
        const modal = document.getElementById('comments-modal-container');
        if (modal) {
            modal.classList.add('visible');
        }
        break;
      }
      case "switch-profile-tab": {
        const tabButton = actionTarget;
        const tabContentId = tabButton.dataset.tab;

        const modal = tabButton.closest('.profile-modal-content');
        if (!modal) return;

        // Deactivate all tabs and hide all content
        modal.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
        modal.querySelectorAll('.video-gallery').forEach(content => content.classList.remove('active'));

        // Activate the clicked tab and show its content
        tabButton.classList.add('active');
        const activeContent = modal.querySelector(`#${tabContentId}`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
        break;
      }
      case "close-comments-modal":
        UI.closeCommentsModal();
        break;
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
        // This is now handled directly in the PWA module.
        break;
      case "open-author-profile":
        const swiper = State.get('swiper');
        if (swiper) {
            const activeSlide = swiper.slides[swiper.activeIndex];
            const slideId = activeSlide.dataset.slideId;
            const slideData = slidesData.find((s) => s.id === slideId);
            if (slideData) {
                UI.openAuthorProfileModal(slideData);
            }
        }
        break;
      case "close-author-profile":
        UI.closeAuthorProfileModal();
        break;
      case "close-modal":
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
            UI.closeCommentsModal();
          }
          if (loginPanel) {
            // Natychmiast usuń animację zamykania, jeśli istnieje
            loginPanel.classList.remove('login-panel--closing');

            // Przełącz stan
            const isActive = loginPanel.classList.toggle('active');

            if (!isActive) {
                // Jeśli panel się zamyka, dodaj klasę animacji zamykania
                loginPanel.classList.add('login-panel--closing');
                loginPanel.addEventListener('animationend', () => {
                    // Posprzątaj po zakończeniu animacji
                    loginPanel.classList.remove('login-panel--closing');
                }, { once: true });
            }
          }
          if (topbar) topbar.classList.toggle("login-panel-active");
        }
        break;
      case "subscribe":
        if (!State.get("isUserLoggedIn")) {
          Utils.vibrateTry();
          UI.showAlert(Utils.getTranslation("subscribeAlert"));
        }
        break;
      case "toggle-push-notifications":
        Notifications.handleBellClick();
        break;
      case "close-notifications":
        if (UI.DOM.notificationPopup) {
          UI.DOM.notificationPopup.classList.remove("visible");
        }
        break;
      case "show-tip-jar":
        TippingModal.showModal();
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
        // This action should only work in PWA mode.
        if (!PWA.isStandalone()) {
          UI.showToast(Utils.getTranslation("immersiveModePwaOnly"));
          return;
        }

        const appFrame = document.getElementById("app-frame");
        if (appFrame) {
            const isHiding = appFrame.classList.toggle("hide-ui");

            // Find the button in the active slide to update its icon
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

    // ========================================================================
    // OBSŁUGA FORMULARZA LOGOWANIA - Z AKTUALIZACJĄ O MODAL PIERWSZEGO LOGOWANIA
    // ========================================================================
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
        // Zaloguj się. authManager.login sam wywoła event 'user:login',
        // który jest obsługiwany w app.js. To centralne miejsce
        // zajmie się pokazaniem modala lub zaktualizowaniem UI.
        await authManager.login(username, password);

        // Po prostu wyczyść formularz.
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

    // ========================================================================
    // OBSŁUGA FORMULARZA KOMENTARZY (pozostaje bez zmian)
    // ========================================================================
    const commentForm = e.target.closest("form#comment-form");
    if (commentForm) {
      e.preventDefault();

      const input = commentForm.querySelector("#comment-input");
      if (!input) {
        console.error('Comment input not found');
        return;
      }

      const text = input.value.trim();
      const hasImage = window.selectedCommentImage !== null;

      // Walidacja - musi być tekst lub obraz
      if (!text && !hasImage) {
        return;
      }

      const button = commentForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      const swiper = State.get('swiper');
      if (!swiper) {
        console.error('Swiper instance not found');
        if (button) button.disabled = false;
        return;
      }
      const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;
      const parentId = State.get("replyingToComment");

      if (!slideId) {
        console.error('No active slide found');
        if (button) button.disabled = false;
        return;
      }

      (async () => {
        try {
          let imageUrl = null;

          // Upload obrazu jeśli istnieje
          if (window.selectedCommentImage) {
            UI.showToast(Utils.getTranslation('uploadingAvatar') || 'Przesyłanie obrazu...');

            const uploadResult = await API.uploadCommentImage(window.selectedCommentImage);

            // Walidacja odpowiedzi
            if (!uploadResult || typeof uploadResult.success !== 'boolean') {
              throw new Error('Invalid upload response');
            }

            if (!uploadResult.success) {
              throw new Error(
                uploadResult.data?.message || 'Nie udało się przesłać obrazu'
              );
            }

            if (!uploadResult.data?.url) {
              throw new Error('Missing image URL in response');
            }

            imageUrl = uploadResult.data.url;
          }

          // Wyślij komentarz
          const postResponse = await API.postComment(slideId, text, parentId, imageUrl);

          // Walidacja odpowiedzi
          if (!postResponse || typeof postResponse.success !== 'boolean') {
            throw new Error('Invalid comment response');
          }

          if (!postResponse.success) {
            throw new Error(
              postResponse.data?.message || Utils.getTranslation("postCommentError")
            );
          }

          if (!postResponse.data || !postResponse.data.id) {
            throw new Error('Invalid comment data in response');
          }

          // Sukces - wyczyść formularz
          input.value = "";
          State.set("replyingToComment", null);

          const replyContext = document.querySelector(".reply-context");
          if (replyContext) replyContext.style.display = "none";

          UI.removeCommentImage();

          UI.showToast(Utils.getTranslation("postCommentSuccess"));

          // Zaktualizuj lokalne dane
          const slideData = slidesData.find((s) => s.id === slideId);
          if (slideData) {
            // Dodaj nowy komentarz
            if (!Array.isArray(slideData.comments)) {
              slideData.comments = [];
            }
            slideData.comments.push(postResponse.data);

            // Zaktualizuj licznik
            slideData.initialComments = postResponse.data.new_comment_count ?? slideData.comments.length;

            // Re-render
            UI.renderComments(slideData.comments);

            // Zaktualizuj licznik w głównym widoku
            const mainSlideCount = slideElement.querySelector(".comment-count");
            if (mainSlideCount) {
              mainSlideCount.textContent = Utils.formatCount(slideData.initialComments);
            }

            // Zaktualizuj tytuł modala
            const commentsTitle = UI.DOM.commentsModal.querySelector("#commentsTitle");
            if (commentsTitle) {
              commentsTitle.textContent = `${Utils.getTranslation("commentsModalTitle")} (${slideData.initialComments})`;
            }

            // Scroll do dołu
            const modalBody = UI.DOM.commentsModal.querySelector(".modal-body");
            if (modalBody) {
              setTimeout(() => {
                modalBody.scrollTop = modalBody.scrollHeight;
              }, 100);
            }
          }

        } catch (error) {
          console.error('Post comment error:', error);
          UI.showAlert(error.message || Utils.getTranslation("postCommentError"), true);
        } finally {
          if (button) button.disabled = false;
          input.focus();
        }
      })();
    }
  },
};
