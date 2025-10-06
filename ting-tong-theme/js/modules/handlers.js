import { State } from './state.js';
import { UI } from './ui.js';
import { Utils } from './utils.js';
import { API, slidesData } from './api.js';
import { PWA } from './pwa.js';
import { Notifications } from './notifications.js';
import { AccountPanel } from './account-panel.js';

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

function handleNotificationClick(event) {
  const item = event.target.closest(".notification-item");
  if (!item) return;

  item.classList.toggle("expanded");
  item.setAttribute("aria-expanded", item.classList.contains("expanded"));

  if (item.classList.contains("unread")) {
    item.classList.remove("unread");
  }
}

async function handleLogout(link) {
  if (link.disabled) return;
  link.disabled = true;
  const json = await API.logout();
  if (json.success) {
    State.set("isUserLoggedIn", false);
    UI.showAlert(Utils.getTranslation("logoutSuccess"));
    await API.refreshNonce(); // Odśwież nonce PO wylogowaniu
    slidesData.forEach((slide) => (slide.isLiked = false));
    UI.updateUIForLoginState();
  } else {
    UI.showAlert(json.data?.message || "Logout failed.", true);
  }
  link.disabled = false;
}

async function handleLikeToggle(button) {
  if (!State.get("isUserLoggedIn")) {
    Utils.vibrateTry();
    UI.showAlert(Utils.getTranslation("likeAlert"));
    return;
  }
  const slideId = button.closest(".webyx-section")?.dataset.slideId;
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
  const section = button.closest(".webyx-section");
  const slideData = slidesData.find(
    (s) => s.id === section.dataset.slideId,
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

function handleLanguageToggle() {
  const newLang = State.get("currentLang") === "pl" ? "en" : "pl";
  State.set("currentLang", newLang);
  localStorage.setItem("tt_lang", newLang);
  UI.updateTranslations();
  Notifications.render();
}

export const Handlers = {
  handleNotificationClick,
  profileModalTabHandler: (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    const modal = tab.closest("#tiktok-profile-modal");
    if (!modal) return;

    // Deactivate all tabs and galleries
    modal
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    modal
      .querySelectorAll(".video-gallery")
      .forEach((g) => g.classList.remove("active"));

    // Activate clicked tab and corresponding gallery
    tab.classList.add("active");
    const contentId = tab.dataset.tabContent;
    const gallery = modal.querySelector(`#${contentId}`);
    if (gallery) {
      gallery.classList.add("active");
    }
  },
  mainClickHandler: (e) => {
    const target = e.target;
    const actionTarget = target.closest("[data-action]");

    // Handle comment-related actions first
    if (actionTarget && actionTarget.closest(".comment-item")) {
      const commentItem = actionTarget.closest(".comment-item");
      const commentId = commentItem.dataset.commentId;
      const slideId = document.querySelector(".swiper-slide-active")
        ?.dataset.slideId;

      if (!slideId || !commentId) return;

      switch (actionTarget.dataset.action) {
        case "toggle-comment-like": {
          const countEl = commentItem.querySelector(".comment-like-count");
          let currentLikes =
            parseInt(countEl.textContent.replace(/K|M/g, "")) || 0;

          actionTarget.classList.toggle("active");
          const isLiked = actionTarget.classList.contains("active");
          currentLikes += isLiked ? 1 : -1;
          countEl.textContent = Utils.formatCount(currentLikes);

          API.toggleCommentLike(slideId, commentId).then((response) => {
            if (!response.success) {
              actionTarget.classList.toggle("active"); // Revert on failure
              currentLikes += isLiked ? -1 : 1;
              countEl.textContent = Utils.formatCount(currentLikes);
              UI.showAlert(
                Utils.getTranslation("failedToUpdateLike"),
                true,
              );
            }
          });
          break;
        }
        case "reply-to-comment": {
          const user =
            commentItem.querySelector(".comment-user")?.textContent;
          State.set("replyingToComment", commentId);

          const formContainer = document.querySelector(
            ".comment-form-container",
          );
          let replyContext = formContainer.querySelector(".reply-context");
          if (!replyContext) {
            replyContext = document.createElement("div");
            replyContext.className = "reply-context";
            formContainer.prepend(replyContext);
          }
          const cancelAriaLabel = Utils.getTranslation(
            "cancelReplyAriaLabel",
          );
          replyContext.innerHTML = `${Utils.getTranslation("replyingTo").replace("{user}", user)} <button class="cancel-reply-btn" data-action="cancel-reply" aria-label="${cancelAriaLabel}">&times;</button>`;
          replyContext.style.display = "block";

          document.querySelector("#comment-input").focus();
          break;
        }
        case "edit-comment": {
          const currentText = commentItem.querySelector(".comment-text").textContent;
          const newText = prompt(
            Utils.getTranslation("editCommentPrompt"),
            currentText,
          );

          if (newText && newText.trim() && newText.trim() !== currentText) {
            API.editComment(slideId, commentId, newText.trim()).then(
              (response) => {
                if (response.success) {
                  const slideData = slidesData.find((s) => s.id === slideId);
                  if (slideData) {
                    // 1. Znajdź i zaktualizuj komentarz w stanie lokalnym
                    const commentIndex = slideData.comments.findIndex(c => String(c.id) === String(commentId));
                    if (commentIndex > -1) {
                      slideData.comments[commentIndex] = response.data;
                    }
                    // 2. Wyrenderuj ponownie wszystkie komentarze, aby zapewnić spójność
                    UI.renderComments(slideData.comments);
                  }
                  UI.showToast(Utils.getTranslation("commentUpdateSuccess"));
                } else {
                  UI.showAlert(
                    response.data?.message || Utils.getTranslation("commentUpdateError"),
                    true,
                  );
                }
              },
            );
          }
          break;
        }
        case "delete-comment": {
          if (confirm(Utils.getTranslation("deleteCommentConfirm"))) {
            API.deleteComment(slideId, commentId).then((response) => {
              if (response.success) {
                const slideData = slidesData.find((s) => s.id === slideId);
                if (slideData) {
                  // 1. Zaktualizuj stan lokalny
                  const commentIndex = slideData.comments.findIndex(c => String(c.id) === String(commentId));
                  if (commentIndex > -1) {
                    slideData.comments.splice(commentIndex, 1);
                  }
                  // Użyj nowej liczby komentarzy z odpowiedzi API
                  slideData.initialComments = response.data.new_count;

                  // 2. Odśwież UI na podstawie nowego stanu
                  UI.renderComments(slideData.comments);

                  // 3. Zaktualizuj liczniki
                  const slideElement = document.querySelector(`.swiper-slide-active[data-slide-id="${slideId}"]`);
                  const mainSlideCount = slideElement?.querySelector(".comment-count");
                  if (mainSlideCount) {
                    mainSlideCount.textContent = Utils.formatCount(slideData.initialComments);
                  }
                  const commentsTitle = UI.DOM.commentsModal.querySelector("#commentsTitle");
                  if (commentsTitle) {
                    commentsTitle.textContent = `${Utils.getTranslation("commentsModalTitle")} (${slideData.initialComments})`;
                  }
                }
                UI.showToast(Utils.getTranslation("commentDeleteSuccess"));
              } else {
                UI.showAlert(
                  response.data?.message || Utils.getTranslation("commentDeleteError"),
                  true,
                );
              }
            });
          }
          break;
        }
      }
      return; // Stop further processing
    }

    const sortTrigger = target.closest(".sort-trigger");
    if (sortTrigger) {
      sortTrigger.parentElement.classList.toggle("open");
      return;
    }

    const sortOption = target.closest(".sort-option");
    if (sortOption) {
      const dropdown = sortOption.closest(".sort-dropdown");
      const newSortOrder = sortOption.dataset.sort;
      if (State.get("commentSortOrder") === newSortOrder) {
        dropdown.classList.remove("open");
        return;
      }

      State.set("commentSortOrder", newSortOrder);
      UI.updateTranslations(); // This will now update the sort dropdown text
      dropdown
        .querySelectorAll(".sort-option")
        .forEach((opt) => opt.classList.remove("active"));
      sortOption.classList.add("active");
      dropdown.classList.remove("open");

      const slideId = document.querySelector(".swiper-slide-active")
        ?.dataset.slideId;
      if (slideId) {
        const modalBody = UI.DOM.commentsModal.querySelector(".modal-body");
        const commentsList = modalBody.querySelector(".comments-list");
        if (commentsList) {
          commentsList.style.opacity = "0.5";
          commentsList.style.transition = "opacity 0.2s ease-in-out";
        }

        API.fetchComments(slideId).then((response) => {
          if (response.success) {
            let comments = response.data;

            if (newSortOrder === "popular") {
              comments.sort((a, b) => b.likes - a.likes);
            } else {
              // newest
              comments.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
              );
            }

            setTimeout(() => {
              UI.renderComments(comments);
            }, 200);
          }
        });
      }
      return;
    }

    const replyBtn = target.closest(".comment-reply-btn");
    if (replyBtn) {
      const commentItem = replyBtn.closest(".comment-item");
      const commentId = commentItem?.dataset.commentId;
      const user = commentItem?.querySelector(".comment-user")?.textContent;

      State.set("replyingToComment", commentId);

      const formContainer = document.querySelector(
        ".comment-form-container",
      );
      let replyContext = formContainer.querySelector(".reply-context");
      if (!replyContext) {
        replyContext = document.createElement("div");
        replyContext.className = "reply-context";
        formContainer.prepend(replyContext);
      }
      const cancelAriaLabel = Utils.getTranslation("cancelReplyAriaLabel");
      replyContext.innerHTML = `${Utils.getTranslation("replyingTo").replace("{user}", user)} <button class="cancel-reply-btn" aria-label="${cancelAriaLabel}">&times;</button>`;
      replyContext.style.display = "block";

      document.querySelector("#comment-input").focus();
      return;
    }

    const cancelReplyBtn = target.closest(".cancel-reply-btn");
    if (cancelReplyBtn) {
      State.set("replyingToComment", null);
      const replyContext = document.querySelector(".reply-context");
      if (replyContext) replyContext.style.display = "none";
      return;
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
      case "go-back":
        const modalToClose = actionTarget.closest(".modal-overlay");
        if (modalToClose) {
          UI.closeModal(modalToClose);
        }
        break;
      case "open-public-profile":
        if (!State.get("isUserLoggedIn")) {
          Utils.vibrateTry();
          UI.showAlert(Utils.getTranslation("profileViewAlert"));
          return;
        }
        const profileSection = actionTarget.closest(".webyx-section");
        if (profileSection) {
          const slideData = slidesData.find(
            (s) => s.id === profileSection.dataset.slideId,
          );
          if (slideData) {
            UI.populateProfileModal(slideData);
            UI.openModal(UI.DOM.tiktokProfileModal);
          }
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
        const slideId =
          actionTarget.closest(".webyx-section")?.dataset.slideId;
        if (slideId) {
          const slideData = slidesData.find((s) => s.id === slideId);
          if (slideData) {
          }

          // Show a loading state
          UI.DOM.commentsModal.querySelector(".modal-body").innerHTML =
            '<div class="loading-spinner"></div>';
          API.fetchComments(slideId).then((response) => {
            if (response.success) {
              let comments = response.data;
              const sortOrder = State.get("commentSortOrder");
              if (sortOrder === "popular") {
                comments.sort((a, b) => b.likes - a.likes);
              } else {
                // 'newest'
                comments.sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
                );
              }
              UI.renderComments(comments);
            } else {
              UI.renderComments([]); // Show empty state on error
            }
          });
        }
        UI.openModal(UI.DOM.commentsModal);
        UI.updateCommentFormVisibility();
        // Scroll to bottom after a short delay to ensure content is rendered
        setTimeout(() => {
          const modalBody =
            UI.DOM.commentsModal.querySelector(".modal-body");
          if (modalBody) {
            modalBody.scrollTop = modalBody.scrollHeight;
          }
        }, 100);
        break;
      }
      case "open-info-modal":
        UI.openModal(UI.DOM.infoModal);
        break;
      case "open-desktop-pwa-modal":
        PWA.openDesktopModal();
        break;
      case "open-ios-pwa-modal":
        PWA.openIosModal();
        break;
      case "install-pwa":
        PWA.handleInstallClick();
        break;
      case "open-account-modal":
        if (loggedInMenu) loggedInMenu.classList.remove("active");
        AccountPanel.openAccountModal();
        break;
      case "close-modal":
        const modal = actionTarget.closest(".modal-overlay");
        if (modal) {
          UI.closeModal(modal);
        } else {
          PWA.closePwaModals();
        }
        break;
      case "close-welcome-modal":
        UI.closeModal(UI.DOM.welcomeModal);
        break;
      case "close-account-modal":
        UI.closeModal(UI.DOM.accountModal);
        break;
      case "logout":
        e.preventDefault();
        handleLogout(actionTarget);
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
          if (UI.DOM.commentsModal.classList.contains("visible")) {
            UI.closeModal(UI.DOM.commentsModal);
          }
          if (loginPanel) loginPanel.classList.toggle("active");
          if (topbar) topbar.classList.toggle("login-panel-active");
        }
        break;
      case "subscribe":
        if (!State.get("isUserLoggedIn")) {
          Utils.vibrateTry();
          UI.showAlert(Utils.getTranslation("subscribeAlert"));
        }
        break;
      case "toggle-notifications":
        if (State.get("isUserLoggedIn")) {
          const popup = UI.DOM.notificationPopup;
          popup.classList.toggle("visible");
          if (popup.classList.contains("visible")) Notifications.render();
        } else {
          Utils.vibrateTry();
          UI.showAlert(Utils.getTranslation("notificationAlert"));
        }
        break;
      case "close-notifications":
        if (UI.DOM.notificationPopup) {
          UI.DOM.notificationPopup.classList.remove("visible");
        }
        break;
      case "show-tip-jar":
        document.querySelector("#bmc-wbtn")?.click();
        break;
      case "play-video": {
        const video = actionTarget.closest(".tiktok-symulacja").querySelector("video");
        if(video) video.play();
        break;
      }
      case "replay-video": {
        const video = actionTarget.closest(".tiktok-symulacja").querySelector("video");
        if (video) {
            video.currentTime = 0;
            video.play();
        }
        break;
      }
      case "toggle-volume":
        const isMuted = !State.get("isSoundMuted");
        State.set("isSoundMuted", isMuted);
        const activeSlideVideo = document.querySelector(".swiper-slide-active video");
        if (activeSlideVideo) {
          activeSlideVideo.muted = isMuted;
        }
        UI.updateVolumeButton(isMuted);
        break;
    }
  },
  formSubmitHandler: (e) => {
    const loginForm = e.target.closest("form#tt-login-form");
    if (loginForm) {
      e.preventDefault();
      const username = loginForm.querySelector("#tt-username").value;
      const password = loginForm.querySelector("#tt-password").value;
      const submitButton = loginForm.querySelector("#tt-login-submit");

      if (!username || !password) {
        UI.showAlert("Please enter username and password.", true);
        return;
      }

      submitButton.disabled = true;

      API.login({ log: username, pwd: password }).then((json) => {
        if (json.success) {
          // Nowy, bogatszy obiekt odpowiedzi jest obsługiwany tutaj
          const { userData, slidesData: newSlides, new_nonce } = json.data;

          // 1. Zaktualizuj stan aplikacji
          State.set("isUserLoggedIn", true);
          if (new_nonce) {
            ajax_object.nonce = new_nonce;
          }

          // 2. Zaktualizuj dane slajdów (zamiast ponownego pobierania)
          if (newSlides) {
            slidesData.length = 0; // Wyczyść istniejącą tablicę
            Array.prototype.push.apply(slidesData, newSlides); // Dodaj nowe dane
            slidesData.forEach((s) => {
                s.likeId = String(s.likeId);
            });
            // RENDERUJ PONOWNIE slajdy, aby mieć pewność, że atrybuty i przyciski polubień są poprawne
            UI.renderSlides();
          }

          // 3. Zaktualizuj dane w panelu konta (bezpośrednio)
          if (userData) {
            AccountPanel.populateProfileForm(userData);
          }

          // 4. Odśwież cały interfejs
          UI.updateUIForLoginState();
          UI.showAlert(Utils.getTranslation("loginSuccess"));

        } else {
          UI.showAlert(
            json.data?.message || Utils.getTranslation("loginFailed"),
            true,
          );
        }
        submitButton.disabled = false;
      });
      return;
    }

    const commentForm = e.target.closest("form#comment-form");
    if (commentForm) {
      e.preventDefault();
      const input = commentForm.querySelector("#comment-input");
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      const button = commentForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      const slideElement = document.querySelector(".swiper-slide-active");
      const slideId = slideElement?.dataset.slideId;
      const parentId = State.get("replyingToComment");

      if (slideId) {
        API.postComment(slideId, text, parentId).then((postResponse) => {
          if (postResponse.success) {
            input.value = "";
            State.set("replyingToComment", null);
            const replyContext = document.querySelector(".reply-context");
            if (replyContext) replyContext.style.display = "none";

            UI.showToast(Utils.getTranslation("postCommentSuccess"));

            const slideData = slidesData.find((s) => s.id === slideId);
            if (slideData) {
              // 1. Zaktualizuj stan lokalny
              const newComment = postResponse.data;
              if (!Array.isArray(slideData.comments)) {
                slideData.comments = [];
              }
              slideData.comments.push(newComment);

              // Użyj nowej, autorytatywnej liczby komentarzy z serwera, jeśli jest dostępna
              if (typeof postResponse.data.new_comment_count !== 'undefined') {
                slideData.initialComments = postResponse.data.new_comment_count;
              } else {
                slideData.initialComments = slideData.comments.length; // Fallback
              }

              // 2. Odśwież UI na podstawie nowego stanu
              UI.renderComments(slideData.comments);

              // 3. Zaktualizuj liczniki
              const mainSlideCount = slideElement.querySelector(".comment-count");
              if (mainSlideCount) {
                mainSlideCount.textContent = Utils.formatCount(slideData.initialComments);
              }
              const commentsTitle = UI.DOM.commentsModal.querySelector("#commentsTitle");
              if (commentsTitle) {
                commentsTitle.textContent = `${Utils.getTranslation("commentsModalTitle")} (${slideData.initialComments})`;
              }

              // 4. Przewiń na dół, aby zobaczyć nowy komentarz
              const modalBody = UI.DOM.commentsModal.querySelector(".modal-body");
              if (modalBody) {
                modalBody.scrollTop = modalBody.scrollHeight;
              }
            }
          } else {
            UI.showAlert(
              postResponse.data?.message || Utils.getTranslation("postCommentError"),
              true,
            );
          }
          if (button) button.disabled = false;
          input.focus();
        });
      } else {
        if (button) button.disabled = false;
      }
    }
  },
};