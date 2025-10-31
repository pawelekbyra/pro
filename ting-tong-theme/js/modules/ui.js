import { Config } from "./config.js";
import { State } from "./state.js";
import { Utils } from "./utils.js";
import { API, slidesData } from "./api.js";
import { authManager } from "./auth-manager.js";

// Zmienna do przechowywania referencji do modułu PWA
// Zostanie ustawiona przez app.js, aby przerwać cykliczną zależność
let PWA;

export const UI = {
  // Funkcja do wstrzykiwania zależności
  setPwaModule: (pwaModule) => {
    PWA = pwaModule;
  },

  DOM: {},

  initDOMCache: () => {
    const D = UI.DOM;
    D.container = document.getElementById("webyx-container");
    D.swiperWrapper = document.querySelector(".swiper-wrapper");
    D.slideTemplate = document.getElementById("slide-template");
    D.preloader = document.getElementById("preloader");

    // Sidebars & Top/Bottom bars
    D.sidebar = document.querySelector(".sidebar");
    D.bottombar = document.querySelector(".bottombar");
    D.topbar = document.querySelector(".topbar");

    // Login/Logout
    D.loginButton = document.querySelector('[data-action="open-login-modal"]');
    D.logoutButton = document.querySelector('[data-action="logout"]');
    D.accountButton = document.querySelector(
      '[data-action="open-account-modal"]',
    );
    D.loginModal = document.getElementById("loginModal");
    D.loginForm = document.getElementById("loginForm");
    D.loginEmailInput = document.getElementById("login-email");
    D.loginPasswordInput = document.getElementById("login-password");
    D.signupForm = document.getElementById("signupForm");

    // Account Panel
    D.accountModal = document.getElementById("accountModal");
    D.profileAvatar = document.querySelector(".profile-avatar");
    D.profileDisplayName = document.querySelector(".profile-display-name");
    D.profileEmail = document.querySelector(".profile-email");

    // Comments Modal
    D.commentsModal = document.getElementById("commentsModal");
    D.commentsContainer = D.commentsModal?.querySelector(".comments-list");
    D.commentTemplate = document.getElementById("comment-template");
    D.commentsCounter = D.commentsModal?.querySelector(".comments-count");

    // Notifications
    D.notificationPopup = document.getElementById("notificationPopup");
    D.notificationButton = document.querySelector(
      '[data-action="toggle-notifications"]',
    );

    // Profile Modal (for other users)
    D.tiktokProfileModal = document.getElementById("tiktok-profile-modal");

    // PWA Prompt
    D.pwaPrompt = document.getElementById("pwa-install-bar");
    D.pwaInstallButton = document.getElementById("pwa-install-button");
    D.pwaDismissButton = document.getElementById("pwa-dismiss-button");
    D.pwaIosInstructions = document.getElementById("pwa-ios-instructions");

    // Volume Control
    D.volumeButton = document.querySelector(
      '[data-action="toggle-main-volume"]',
    );
    D.volumeIcon = D.volumeButton?.querySelector(".icon-volume-on");
    D.muteIcon = D.volumeButton?.querySelector(".icon-volume-off");

    // Alert Box
    D.alertBox = document.getElementById("alertBox");

    // Info Modal
    D.infoModal = document.getElementById("infoModal");

    // Image Lightbox
    D.imageLightbox = document.getElementById("imageLightbox");
    D.lightboxImage = D.imageLightbox?.querySelector(
      ".lightbox-image-container img",
    );
    D.lightboxClose = D.imageLightbox?.querySelector(".lightbox-close");
    D.lightboxDownload =
      D.imageLightbox?.querySelector(".lightbox-download-btn");
  },

  initGlobalPanels: () => {
    if (UI.DOM.imageLightbox) {
      UI.DOM.imageLightbox.addEventListener("click", (e) => {
        if (e.target === UI.DOM.imageLightbox || e.target === UI.DOM.lightboxClose) {
          UI.closeImageLightbox();
        }
      });
    }
  },

  renderSlides: () => {
    slidesData.forEach((slideData) => {
      const slideElement = UI.createSlideElement(slideData);
      UI.DOM.swiperWrapper.appendChild(slideElement);
    });
  },

  createSlideElement: (slideData) => {
    const slideClone = UI.DOM.slideTemplate.content.cloneNode(true);
    const container = slideClone.querySelector(".tiktok-symulacja");

    // Add data attributes for identification
    container.dataset.slideId = slideData.id;
    container.dataset.likeId = slideData.likeId;

    // --- TEXT INFO ---
    const textInfoContainer = slideClone.querySelector(".text-info");
    const authorNameEl = textInfoContainer.querySelector(".author-name");
    const slideTitleEl = textInfoContainer.querySelector(".slide-title");
    const slideDescEl = textInfoContainer.querySelector(".slide-description");

    authorNameEl.textContent = `@${slideData.author.name}`;
    slideTitleEl.textContent = slideData.title;
    slideDescEl.innerHTML = slideData.description;

    // --- AVATAR ---
    const avatarImg = slideClone.querySelector(".profile-btn img");
    avatarImg.src = slideData.author.avatar;
    avatarImg.alt = slideData.author.name;

    // Add VIP border if applicable
    if (slideData.author.is_vip) {
      avatarImg.classList.add("vip-avatar-border");
    }

    // --- LIKE BUTTON ---
    const likeButton = slideClone.querySelector(".like-btn");
    const likeCountSpan = likeButton.querySelector(".count");
    likeCountSpan.textContent = slideData.initialLikes;
    if (slideData.isLiked) {
      likeButton.classList.add("is-liked");
    }

    // --- COMMENTS BUTTON ---
    const commentsCountSpan = slideClone.querySelector(".comments-btn .count");
    commentsCountSpan.textContent = slideData.commentsCount;

    // --- MEDIA ---
    const mediaContainer = slideClone.querySelector(".media-container");
    if (slideData.isIframe) {
      const iframe = document.createElement("iframe");
      iframe.dataset.originalSrc = slideData.videoUrl;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      mediaContainer.appendChild(iframe);
    } else {
      const video = document.createElement("video");
      video.poster = slideData.poster;
      video.src = slideData.videoUrl;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.loop = false;
      video.preload = "auto";
      mediaContainer.appendChild(video);

      // Add 'ended' event listener for replay overlay
      video.addEventListener("ended", () => {
        const replayOverlay = container.querySelector(".replay-overlay");
        if (replayOverlay) replayOverlay.classList.add("visible");
      });

      // Add 'loadedmetadata' listener to show UI
      video.addEventListener("loadedmetadata", () => {
        container.classList.add("video-loaded");
      });
    }

    // --- OVERLAYS (SECRET / PWA) ---
    const secretOverlay = slideClone.querySelector(".secret-overlay");
    const pwaSecretOverlay = slideClone.querySelector(".pwa-secret-overlay");

    if (slideData.access === "secret") {
      secretOverlay.classList.add("visible");
      container.querySelector("video")?.pause();
    } else if (slideData.access === "pwa-secret") {
      // ✅ FIX: Zawsze dodawaj 'video-loaded', aby UI było widoczne
      container.classList.add("video-loaded");
      // Pokaż nakładkę tylko, jeśli nie jesteśmy w trybie PWA
      if (!PWA.isStandalone()) {
        pwaSecretOverlay.classList.add("visible");
      }
      container.querySelector("video")?.pause();
    }

    return slideClone;
  },

  updateUIForLoginState: () => {
    const isLoggedIn = State.get("isUserLoggedIn");
    const user = State.get("currentUser");

    UI.DOM.loginButton.style.display = isLoggedIn ? "none" : "block";
    UI.DOM.logoutButton.style.display = isLoggedIn ? "block" : "none";
    UI.DOM.accountButton.style.display = isLoggedIn ? "block" : "none";

    document
      .querySelectorAll(".requires-login")
      .forEach((el) => el.classList.toggle("hidden", !isLoggedIn));
    document
      .querySelectorAll(".requires-logout")
      .forEach((el) => el.classList.toggle("hidden", isLoggedIn));

    // Update avatar in sidebar
    if (isLoggedIn && user) {
      UI.DOM.accountButton.querySelector("img").src =
        user.avatar || Config.DEFAULT_AVATAR;
    } else {
      // Reset to default if not logged in
      UI.DOM.accountButton.querySelector("img").src = Config.DEFAULT_AVATAR;
    }
  },

  updateTranslations: () => {
    document.querySelectorAll("[data-translate-key]").forEach((element) => {
      const key = element.dataset.translateKey;
      const translation = Utils.getTranslation(key);
      if (translation) {
        if (
          element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA"
        ) {
          if (element.placeholder !== translation) {
            element.placeholder = translation;
          }
        } else {
          if (element.innerHTML !== translation) {
            element.innerHTML = translation;
          }
        }
      }
    });

    // Handle dynamic text updates (e.g., in PWA prompt)
    if (PWA && typeof PWA.updateDynamicTexts === 'function') {
      PWA.updateDynamicTexts();
    }
  },

  showAlert: (message, isError = false, duration = 3000) => {
    const alertBox = UI.DOM.alertBox;
    const alertText = alertBox.querySelector("#alertText");
    alertText.textContent = message;
    alertBox.classList.toggle("is-error", isError);
    alertBox.classList.add("visible");

    setTimeout(() => {
      alertBox.classList.remove("visible");
    }, duration);
  },

  openModal: (modal, options = {}) => {
    if (!modal) return;

    document.body.classList.add("modal-open");
    modal.classList.add("visible");

    // Add to active modals set
    State.activeModals.add(modal.id);

    const video = document.querySelector(".swiper-slide-active video");
    if (video && !video.paused) {
      video.pause();
      State.set("wasVideoPlayingOnModalOpen", true);
    } else {
      State.set("wasVideoPlayingOnModalOpen", false);
    }

    if (typeof options.onOpen === "function") {
      options.onOpen();
    }

    // Accessibility
    UI.DOM.container.setAttribute('aria-hidden', 'true');
  },

  closeModal: (modal, options = {}) => {
    if (!modal) return;

    modal.classList.remove("visible");

    // Remove from active modals set
    State.activeModals.delete(modal.id);

    // If no other modals are open, remove the body class
    if (State.activeModals.size === 0) {
      document.body.classList.remove("modal-open");
      // Accessibility
      UI.DOM.container.removeAttribute('aria-hidden');
    }

    const video = document.querySelector(".swiper-slide-active video");
    if (State.get("wasVideoPlayingOnModalOpen") && video) {
      video.play().catch(console.error);
    }

    if (typeof options.onClose === "function") {
      options.onClose();
    }
  },

  applyLikeStateToDom: (likeId, isLiked, newCount) => {
    const slideElement = document.querySelector(`[data-like-id="${likeId}"]`);
    if (slideElement) {
      const likeButton = slideElement.querySelector(".like-btn");
      const likeCountSpan = likeButton.querySelector(".count");
      likeButton.classList.toggle("is-liked", isLiked);
      likeCountSpan.textContent = newCount;
    }
  },

  updateVolumeButton: (isMuted) => {
    if (!UI.DOM.volumeIcon || !UI.DOM.muteIcon) return;
    UI.DOM.volumeIcon.style.display = isMuted ? "none" : "block";
    UI.DOM.muteIcon.style.display = isMuted ? "block" : "none";
  },

  initEmojiPicker: (container, input) => {
    const emojiGrid = container.querySelector(".emoji-grid");
    if (!emojiGrid) {
      console.warn("Emoji grid container not found");
      return;
    }

    // Clear existing emojis before adding new ones
    emojiGrid.innerHTML = '';

    // Create a DocumentFragment for performance
    const fragment = document.createDocumentFragment();

    Config.EMOJI_LIST.forEach((emoji) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = emoji;
      button.addEventListener("click", () => {
        input.value += emoji;
        input.focus();
        // Dispatch an input event to notify any listeners that the value has changed.
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      fragment.appendChild(button);
    });

    // Append all buttons at once to the DOM
    emojiGrid.appendChild(fragment);

    // Toggle visibility
    const toggleButton = container.querySelector(".emoji-picker-toggle");
    toggleButton?.addEventListener("click", () => {
      emojiGrid.classList.toggle("visible");
    });
  },

  openImageLightbox: (imageUrl) => {
    if (!UI.DOM.imageLightbox) return;
    UI.DOM.lightboxImage.src = imageUrl;
    UI.DOM.lightboxDownload.href = imageUrl;
    UI.openModal(UI.DOM.imageLightbox);
  },

  closeImageLightbox: () => {
    UI.closeModal(UI.DOM.imageLightbox);
    // Delay clearing the src to prevent image disappearing during animation
    setTimeout(() => {
        if (UI.DOM.lightboxImage) UI.DOM.lightboxImage.src = '';
    }, 300);
  }
};