import { Config } from './config.js';
import { State } from './state.js';
import { Utils } from './utils.js';
import { API, slidesData } from './api.js';

let selectedCommentImage = null;

const DOM = {
  container: document.getElementById("webyx-container"),
  template: document.getElementById("slide-template"),
  preloader: document.getElementById("preloader"),
  alertBox: document.getElementById("alertBox"),
  alertText: document.getElementById("alertText"),
  commentsModal: document.getElementById("commentsModal"),
  accountModal: document.getElementById("accountModal"),
  tiktokProfileModal: document.getElementById("tiktok-profile-modal"),
  notificationPopup: document.getElementById("notificationPopup"),
  pwaDesktopModal: document.getElementById("pwa-desktop-modal"),
  pwaInstallPrompt: document.getElementById("pwaInstallPrompt"),
  pwaIosInstructions: document.getElementById("pwa-ios-instructions"),
  pwaDesktopInstallButton: document.querySelector(
    ".topbar-icon-btn.desktop-only",
  ),
  toastNotification: document.getElementById("toast-notification"),
  welcomeModal: document.getElementById("welcome-modal"),
};
let alertTimeout;
let toastTimeout;

function showToast(message) {
    if (!DOM.toastNotification) return;
    clearTimeout(toastTimeout);
    DOM.toastNotification.textContent = message;
    DOM.toastNotification.classList.add("visible");
    toastTimeout = setTimeout(() => {
        DOM.toastNotification.classList.remove("visible");
    }, 3000);
}

function showAlert(message, isError = false) {
  if (!DOM.alertBox || !DOM.alertText) return;
  clearTimeout(alertTimeout);
  DOM.alertBox.style.animation = "none";
  requestAnimationFrame(() => {
    DOM.alertBox.style.animation = "";
    DOM.alertText.textContent = message;
    DOM.alertBox.style.backgroundColor = isError
      ? "var(--accent-color)"
      : "rgba(0, 0, 0, 0.85)";
    DOM.alertBox.classList.add("visible");
  });
  alertTimeout = setTimeout(
    () => DOM.alertBox.classList.remove("visible"),
    3000,
  );
}

function getFocusable(node) {
  if (!node) return [];
  return Array.from(
    node.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function trapFocus(modal) {
  const focusable = getFocusable(modal);
  if (focusable.length === 0) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handleKeyDown = (e) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };
  modal.addEventListener("keydown", handleKeyDown);
  return () => modal.removeEventListener("keydown", handleKeyDown);
}

function openModal(modal) {
  State.set("lastFocusedElement", document.activeElement);
  DOM.container.setAttribute("aria-hidden", "true");
  modal.classList.add("visible");
  modal.setAttribute("aria-hidden", "false");
  const focusable = getFocusable(modal);
  (focusable.length > 0
    ? focusable[0]
    : modal.querySelector(".modal-content")
  )?.focus();
  modal._focusTrapDispose = trapFocus(modal);
}

function closeModal(modal) {
  if (!modal || modal.classList.contains("is-hiding")) return;

  const modalContent = modal.querySelector(
    ".modal-content, .tiktok-profile-content, .account-modal-content"
  );
  const isAnimated = modalContent && (
    modal.id === "tiktok-profile-modal" ||
    modal.id === "commentsModal" ||
    modal.id === "accountModal"
  );

  modal.classList.add("is-hiding");
  modal.setAttribute("aria-hidden", "true");

  const cleanup = () => {
    modal.removeEventListener("transitionend", cleanup);
    modal.classList.remove("visible", "is-hiding");
    if (modal._focusTrapDispose) {
      modal._focusTrapDispose();
      delete modal._focusTrapDispose;
    }
    DOM.container.removeAttribute("aria-hidden");
    State.get("lastFocusedElement")?.focus();
    // NOWE: Wyczyść state związany z komentarzami przy zamykaniu modala
    if (modal.id === "commentsModal") {
      State.set("replyingToComment", null, true); // silent = true

      // Usuń reply context
      const replyContext = document.querySelector(".reply-context");
      if (replyContext) {
        replyContext.style.display = "none";
      }

      // Wyczyść załączony obraz
      if (typeof UI.removeCommentImage === 'function') {
        UI.removeCommentImage();
      }

      // Wyczyść input
      const commentInput = document.querySelector("#comment-input");
      if (commentInput) {
        commentInput.value = "";
      }
    }
  };

  if (isAnimated) {
    modal.addEventListener("transitionend", cleanup, { once: true });
    // Fallback timeout
    setTimeout(cleanup, 500);
  } else {
    // For non-animated modals, cleanup immediately
    cleanup();
  }
}

function updateLikeButtonState(likeButton, liked, count) {
  if (!likeButton) return;
  const likeCountEl = likeButton.querySelector(".like-count");
  likeButton.classList.toggle("active", liked);
  likeButton.setAttribute("aria-pressed", String(liked));
  if (likeCountEl) {
    likeCountEl.textContent = Utils.formatCount(count);
    likeCountEl.dataset.rawCount = String(count);
  }
  const translationKey = liked
    ? "unlikeAriaLabelWithCount"
    : "likeAriaLabelWithCount";
  const label = Utils.getTranslation(translationKey).replace(
    "{count}",
    Utils.formatCount(count),
  );
  likeButton.setAttribute("aria-label", label);
}

function applyLikeStateToDom(likeId, liked, count) {
  document
    .querySelectorAll(`.like-button[data-like-id="${likeId}"]`)
    .forEach((btn) => updateLikeButtonState(btn, liked, count));
}

function updateUIForLoginState() {
  UI.updateCommentFormVisibility();
  const isLoggedIn = State.get("isUserLoggedIn");
  const currentSlideIndex = State.get("currentSlideIndex");

  // Update global UI elements
  const topbar = document.querySelector("#app-frame > .topbar");
  const loginPanel = document.querySelector("#app-frame > .login-panel");
  const loggedInMenu = document.querySelector(
    "#app-frame > .logged-in-menu",
  );

  if (topbar) {
    topbar
      .querySelector(".central-text-wrapper")
      .classList.toggle("with-arrow", !isLoggedIn);
    topbar.querySelector(".topbar-text").textContent = isLoggedIn
      ? "Ting Tong"
      : Utils.getTranslation("loggedOutText");
    topbar.classList.remove("login-panel-active");
  }
  if (loginPanel) {
    loginPanel.classList.remove("active");
  }
  if (loggedInMenu) {
    loggedInMenu.classList.remove("active");
  }

  // Update per-slide elements
  DOM.container.querySelectorAll(".webyx-section").forEach((section) => {
    const sim = section.querySelector(".tiktok-symulacja");
    sim.classList.toggle("is-logged-in", isLoggedIn);
    const isSecret = sim.dataset.access === "secret";
    const isPwaOnly = sim.dataset.access === "pwa";
    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    const showSecretOverlay =
      (isSecret && !isLoggedIn) || (isPwaOnly && !isStandalone());

    const secretOverlay = section.querySelector(".secret-overlay");
    if (secretOverlay) {
      secretOverlay.classList.toggle("visible", showSecretOverlay);
    }

    if (showSecretOverlay) {
      const titleKey = isPwaOnly ? "pwaTitle" : "secretTitle";
      const subtitleActionKey = isPwaOnly
        ? "pwaSubtitleAction"
        : "secretSubtitleAction";
      const subtitleRestKey = isPwaOnly
        ? "pwaSubtitleRest"
        : "secretSubtitleRest";

      section.querySelector(".secret-title").textContent =
        Utils.getTranslation(titleKey);

      const subtitleUElement = section.querySelector(".secret-subtitle u");
      const subtitleSpanElement = section.querySelector(
        ".secret-subtitle span",
      );

      if (subtitleUElement && subtitleSpanElement) {
        // The data-action attribute is used by the global mainClickHandler
        // to trigger the correct action when this element is clicked.
        subtitleUElement.dataset.action = isPwaOnly
          ? "install-pwa"
          : "toggle-login-panel";
        subtitleUElement.dataset.translateKey = subtitleActionKey;
        subtitleUElement.textContent =
          Utils.getTranslation(subtitleActionKey);
        subtitleSpanElement.dataset.translateKey = subtitleRestKey;
        subtitleSpanElement.textContent =
          Utils.getTranslation(subtitleRestKey);
      }
    }

    const likeBtn = section.querySelector(".like-button");
    if (likeBtn) {
      const slide = slidesData.find(
        (s) => String(s.likeId) === String(likeBtn.dataset.likeId),
      );
      if (slide) {
        updateLikeButtonState(
          likeBtn,
          !!(slide.isLiked && isLoggedIn),
          Number(slide.initialLikes || 0),
        );
      }
    }
  });
}

function updateTranslations() {
  const lang = State.get("currentLang");
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-translate-key]").forEach((el) => {
    el.textContent = Utils.getTranslation(el.dataset.translateKey);
  });
  document.querySelectorAll("[data-translate-aria-label]").forEach((el) => {
    el.setAttribute(
      "aria-label",
      Utils.getTranslation(el.dataset.translateAriaLabel),
    );
  });
  document.querySelectorAll("[data-translate-title]").forEach((el) => {
    el.setAttribute(
      "title",
      Utils.getTranslation(el.dataset.translateTitle),
    );
  });
  document
    .querySelectorAll("[data-translate-placeholder]")
    .forEach((el) => {
      el.setAttribute(
        "placeholder",
        Utils.getTranslation(el.dataset.translatePlaceholder),
      );
    });

  // Handle composite elements
  const sortTrigger = document.querySelector(".sort-trigger");
  if (sortTrigger) {
    const sortOrder = State.get("commentSortOrder");
    const currentSortText = Utils.getTranslation(
      sortOrder === "popular" ? "commentSortBest" : "commentSortNewest",
    );
    sortTrigger.innerHTML = `${Utils.getTranslation("commentSortTriggerText")}<span class="current-sort">${currentSortText}</span> ▼`;
  }

  const loginPrompt = document.querySelector(".login-to-comment-prompt p");
  if (loginPrompt) {
    loginPrompt.innerHTML = `<a href="#" data-action="toggle-login-panel" data-translate-key="loginToCommentAction">${Utils.getTranslation("loginToCommentAction")}</a><span data-translate-key="loginToCommentRest">${Utils.getTranslation("loginToCommentRest")}</span>`;
  }

  updateUIForLoginState();
}

function createSlideElement(slideData, index) {
  const slideFragment = DOM.template.content.cloneNode(true);
  const section = slideFragment.querySelector(".webyx-section");
  section.dataset.index = index;
  section.dataset.slideId = slideData.id;

  if (slideData.isIframe) {
    const tiktokSymulacja = section.querySelector(".tiktok-symulacja");
    const videoEl = tiktokSymulacja.querySelector("video");
    if (videoEl) videoEl.remove();
    const pauseOverlay = tiktokSymulacja.querySelector(".pause-overlay");
    if (pauseOverlay) pauseOverlay.remove();
    const secretOverlay = tiktokSymulacja.querySelector(".secret-overlay");
    if (secretOverlay) secretOverlay.remove();
    const errorOverlay = tiktokSymulacja.querySelector(".error-overlay");
    if (errorOverlay) errorOverlay.remove();

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.src = slideData.iframeUrl;
    iframe.frameBorder = "0";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    tiktokSymulacja.prepend(iframe);
  } else if (slideData.mp4Url) {
    const videoEl = section.querySelector("video");
    if (videoEl) {
      videoEl.src = slideData.mp4Url;
      if (slideData.access === 'secret') {
        videoEl.pause();
      }
    }
  }

  section.querySelector(".tiktok-symulacja").dataset.access =
    slideData.access;
  section.querySelector(".profileButton img").src = slideData.avatar;
  section.querySelector(".text-user").textContent = slideData.user;
  section.querySelector(".text-description").textContent =
    slideData.description;

  const likeBtn = section.querySelector(".like-button");
  likeBtn.dataset.likeId = slideData.likeId;
  updateLikeButtonState(likeBtn, slideData.isLiked, slideData.initialLikes);

  const commentsBtn = section.querySelector(".commentsButton");
  const commentsCountEl = commentsBtn.querySelector(".comment-count");
  commentsCountEl.textContent = Utils.formatCount(
    slideData.initialComments,
  );

  const videoEl = section.querySelector("video");
  const pauseOverlay = section.querySelector(".pause-overlay");
  const replayOverlay = section.querySelector(".replay-overlay");

  if (videoEl && pauseOverlay && replayOverlay) {
    // Gdy video się kończy - pokaż replay
    videoEl.addEventListener("ended", () => {
      replayOverlay.classList.add("visible");
    });

    // Gdy video zaczyna grać - ukryj overlays
    videoEl.addEventListener("play", () => {
      replayOverlay.classList.remove("visible");
      pauseOverlay.classList.remove("visible");
    });

    videoEl.addEventListener("playing", () => {
      replayOverlay.classList.remove("visible");
      pauseOverlay.classList.remove("visible");
    });
  }
  const progressBar = section.querySelector(".progress-bar");
  const progressBarFill = section.querySelector(".progress-bar-fill");

  if (videoEl) {
    videoEl.addEventListener(
      "playing",
      () => {
        tiktokSymulacja.classList.add("video-loaded");
      },
      { once: true },
    );
  }

  if (videoEl && progressBar && progressBarFill) {
    const handle = section.querySelector(".progress-bar-handle");
    let isDragging = false;

    const updateProgress = () => {
      if (isDragging || !videoEl.duration) return;
      const progress = (videoEl.currentTime / videoEl.duration) * 100;
      progressBarFill.style.width = `${progress}%`;
      if (handle) handle.style.left = `${progress}%`;
    };

    const seek = (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX =
        (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const width = rect.width;
      const progress = Math.max(0, Math.min(1, clickX / width));

      if (videoEl.duration > 0) {
        videoEl.currentTime = progress * videoEl.duration;
        progressBarFill.style.width = `${progress * 100}%`;
        if (handle) handle.style.left = `${progress * 100}%`;
      }
    };

    videoEl.addEventListener("timeupdate", updateProgress);

    const startDrag = (e) => {
      if (e.type === "touchstart") {
        e.preventDefault();
      }
      isDragging = true;
      progressBar.classList.add("dragging");
      const wasPlaying = !videoEl.paused;
      videoEl.pause();

      seek(e);

      const onDrag = (moveEvent) => {
        if (!isDragging) return;
        moveEvent.preventDefault();
        seek(moveEvent);
      };

      const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        progressBar.classList.remove("dragging");
        if (wasPlaying) {
          videoEl.play().catch((err) => {
            console.error("Play failed after drag:", err);
          });
        }
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchmove", onDrag, {
          passive: false,
        });
        document.removeEventListener("touchend", endDrag);
      };

      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", endDrag);
      document.addEventListener("touchmove", onDrag, { passive: false });
      document.addEventListener("touchend", endDrag);
    };

    progressBar.addEventListener("mousedown", startDrag);
    progressBar.addEventListener("touchstart", startDrag, {
      passive: false,
    });
  }

  return section;
}

function renderSlides() {
  const wrapper = DOM.container.querySelector(".swiper-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";
  if (slidesData.length === 0) return;

  slidesData.forEach((data, index) => {
    const slideElement = createSlideElement(data, index);
    wrapper.appendChild(slideElement);
  });
}

function populateProfileModal(slideData) {
  if (!slideData || !DOM.tiktokProfileModal) return;

  // Basic info
  const atUsername = `@${slideData.user
    .toLowerCase()
    .replace(/\s/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")}`;
  DOM.tiktokProfileModal.querySelector("#tiktok-profile-avatar").src =
    slideData.avatar;
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-profile-username",
  ).textContent = atUsername;
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-profile-nickname",
  ).textContent = slideData.user;
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-profile-at-username",
  ).textContent = atUsername;
  DOM.tiktokProfileModal.querySelector("#tiktok-profile-bio").textContent =
    `To jest bio użytkownika ${slideData.user}.\nOdkryj więcej! ✨`;

  // Stats
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-following-count",
  ).textContent = Math.floor(Math.random() * 500);
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-followers-count",
  ).textContent = Utils.formatCount(Math.floor(Math.random() * 5000000));
  DOM.tiktokProfileModal.querySelector("#tiktok-likes-count").textContent =
    Utils.formatCount(slideData.initialLikes * 3.5); // Mock total likes

  // Video Grid (mock data)
  const videoGrid = DOM.tiktokProfileModal.querySelector("#videos-grid");
  videoGrid.innerHTML = ""; // Clear previous
  for (let i = 1; i <= 9; i++) {
    const thumb = document.createElement("div");
    thumb.className = "video-thumbnail";
    thumb.innerHTML = `
                    <img src="https://picsum.photos/200/280?random=${slideData.id}-${i}" alt="Miniatura filmu">
                    <div class="video-views">
                        <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        ${Utils.formatCount(Math.floor(Math.random() * 3000000))}
                    </div>
                `;
    videoGrid.appendChild(thumb);
  }
}

function updateCommentFormVisibility() {
  const isLoggedIn = State.get("isUserLoggedIn");
  const form = document.getElementById("comment-form");
  const prompt = document.querySelector(".login-to-comment-prompt");

  if (form && prompt) {
    if (isLoggedIn) {
      form.style.display = "flex";
      prompt.style.display = "none";
    } else {
      form.style.display = "none";
      prompt.style.display = "block";
    }
  }
}

function updateVolumeButton(isMuted) {
  document.querySelectorAll(".volume-button").forEach(button => {
    const onIcon = button.querySelector(".volume-on-icon");
    const offIcon = button.querySelector(".volume-off-icon");
    if (onIcon && offIcon) {
      onIcon.style.display = isMuted ? 'none' : 'block';
      offIcon.style.display = isMuted ? 'block' : 'none';
    }
  });
}

function initKeyboardListener() {
  const commentsModal = DOM.commentsModal;
  if (!commentsModal) return;

  if (!window.visualViewport) {
    console.warn('Visual Viewport API not supported');
    return;
  }

  let initialHeight = window.visualViewport.height;
  let isKeyboardVisible = false;

  const handleViewportChange = () => {
    const currentHeight = window.visualViewport.height;
    const heightDiff = initialHeight - currentHeight;

    const newKeyboardState = heightDiff > 150;

    if (newKeyboardState !== isKeyboardVisible) {
      isKeyboardVisible = newKeyboardState;
      commentsModal.classList.toggle('keyboard-visible', isKeyboardVisible);

      if (isKeyboardVisible) {
        setTimeout(() => {
          const modalBody = commentsModal.querySelector('.modal-body');
          if (modalBody) {
            modalBody.scrollTop = modalBody.scrollHeight;
          }
        }, 100);
      }
    }

    commentsModal.style.setProperty('--keyboard-offset', `${heightDiff}px`);
  };

  window.visualViewport.addEventListener('resize', handleViewportChange);
  window.visualViewport.addEventListener('scroll', handleViewportChange);

  commentsModal.addEventListener('transitionend', function cleanupOnClose(e) {
    if (e.target === commentsModal && !commentsModal.classList.contains('visible')) {
      isKeyboardVisible = false;
      commentsModal.classList.remove('keyboard-visible');
      commentsModal.style.removeProperty('--keyboard-offset');
      initialHeight = window.visualViewport.height;
    }
  });
}

function initEmojiPicker() {
  const emojiPicker = document.querySelector('.emoji-picker');
  if (!emojiPicker || emojiPicker.children.length > 0) return;

  const fragment = document.createDocumentFragment();
  Config.EMOJI_LIST.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-item';
    btn.textContent = emoji;
    btn.setAttribute('aria-label', `Insert ${emoji}`);
    btn.addEventListener('click', () => insertEmoji(emoji));
    fragment.appendChild(btn);
  });
  emojiPicker.appendChild(fragment);
}

function insertEmoji(emoji) {
  const input = document.querySelector('#comment-input');
  if (!input) return;

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;

  input.value = text.substring(0, start) + emoji + text.substring(end);
  input.selectionStart = input.selectionEnd = start + emoji.length;
  input.focus();

  hideEmojiPicker();
}

// Dodaj zmienną dla debounce na początku pliku (przed funkcją)
let emojiPickerTimeout = null;
let emojiPickerClickListener = null;

function toggleEmojiPicker() {
  const picker = document.querySelector('.emoji-picker');
  if (!picker) {
    console.warn('Emoji picker element not found');
    return;
  }

  // Debounce - zapobiegaj podwójnym kliknięciom
  if (emojiPickerTimeout) {
    return;
  }

  const isVisible = picker.classList.contains('visible');

  if (isVisible) {
    hideEmojiPicker();
  } else {
    picker.classList.add('visible');

    // Usuń stary listener jeśli istnieje
    if (emojiPickerClickListener) {
      document.removeEventListener('click', emojiPickerClickListener);
      emojiPickerClickListener = null;
    }

    // Dodaj nowy listener po micro-delay
    setTimeout(() => {
      emojiPickerClickListener = (e) => closeEmojiPickerOnClickOutside(e);
      document.addEventListener('click', emojiPickerClickListener, { once: true });
    }, 10);
  }

  // Debounce timer
  emojiPickerTimeout = setTimeout(() => {
    emojiPickerTimeout = null;
  }, 300);
}

function hideEmojiPicker() {
  const picker = document.querySelector('.emoji-picker');
  if (picker) {
    picker.classList.remove('visible');
  }

  // Usuń pending listener
  if (emojiPickerClickListener) {
    document.removeEventListener('click', emojiPickerClickListener);
    emojiPickerClickListener = null;
  }
}

function closeEmojiPickerOnClickOutside(e) {
  const picker = document.querySelector('.emoji-picker');
  const emojiBtn = document.querySelector('.emoji-btn');

  // Walidacja elementów
  if (!picker || !emojiBtn) {
    return;
  }

  // Sprawdź czy kliknięcie było poza pickerem i przyciskiem
  if (!picker.contains(e.target) && !emojiBtn.contains(e.target)) {
    hideEmojiPicker();
  }
}

function handleImageAttachment() {
  const fileInput = document.querySelector('.comment-image-input');

  if (!fileInput) {
    console.error('Comment image input not found');
    UI.showAlert(
      Utils.getTranslation('imageInputError') || 'Nie można załączyć obrazu',
      true
    );
    return;
  }

  // Sprawdź czy użytkownik jest zalogowany
  if (!State.get('isUserLoggedIn')) {
    UI.showAlert(Utils.getTranslation('likeAlert') || 'Zaloguj się, aby dodać obraz', true);
    return;
  }

  fileInput.click();
}

function handleImageSelect(e) {
  const file = e.target.files[0];

  if (!file) {
    return;
  }

  // Walidacja typu
  if (!file.type.startsWith('image/')) {
    UI.showAlert(
      Utils.getTranslation('fileSelectImageError') || 'Wybierz plik obrazu (JPG, PNG, GIF)',
      true
    );
    e.target.value = '';
    return;
  }

  // Walidacja rozmiaru
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    UI.showAlert(
      Utils.getTranslation('fileTooLargeError') || 'Obraz jest za duży. Maksymalny rozmiar: 5MB',
      true
    );
    e.target.value = '';
    return;
  }

  // Sprawdź czy można odczytać plik
  const reader = new FileReader();

  reader.onerror = () => {
    console.error('Failed to read file');
    UI.showAlert(
      Utils.getTranslation('fileReadError') || 'Nie można odczytać pliku',
      true
    );
    e.target.value = '';
  };

  reader.onload = () => {
    // Plik jest OK - zapisz go
    selectedCommentImage = file;
    showImagePreview(file);
  };

  // Rozpocznij odczyt (tylko dla walidacji)
  reader.readAsDataURL(file);

  // Wyczyść input żeby można było wybrać ten sam plik ponownie
  e.target.value = '';
}

function showImagePreview(file) {
  const container = document.querySelector('.image-preview-container');
  if (!container) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    container.innerHTML = `
      <div class="image-preview">
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image-btn" data-action="remove-comment-image">&times;</button>
      </div>
    `;
    container.classList.add('visible');
  };
  reader.readAsDataURL(file);
}

function removeCommentImage() {
  selectedCommentImage = null;
  const container = document.querySelector('.image-preview-container');
  if (container) {
    container.classList.remove('visible');
    container.innerHTML = '';
  }
}

function focusCommentInput() {
  const input = document.querySelector('#comment-input');
  if (input) {
    setTimeout(() => {
      input.focus();

      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}

function scrollToComment(commentId) {
  const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (commentEl) {
    commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    commentEl.style.background = 'rgba(255, 0, 85, 0.1)';
    setTimeout(() => {
      commentEl.style.background = '';
    }, 1000);
  }
}

function openImageLightbox(imageUrl) {
  const lightbox = document.querySelector('.image-lightbox');
  if (!lightbox) return;

  const img = lightbox.querySelector('img');
  img.src = imageUrl;
  lightbox.classList.add('visible');

  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  const lightbox = document.querySelector('.image-lightbox');
  if (!lightbox) return;

  lightbox.classList.remove('visible');
  document.body.style.overflow = '';
}

function renderComments(comments) {
  const modalBody = DOM.commentsModal.querySelector(".modal-body");
  if (!modalBody) return;

  modalBody.innerHTML = "";

  if (!comments || comments.length === 0) {
    modalBody.innerHTML =
      '<p class="no-comments-message" data-translate-key="noComments">Brak komentarzy. Bądź pierwszy!</p>';
    return;
  }

  const commentList = document.createElement("div");
  commentList.className = "comments-list";

  const repliesMap = new Map();
  comments.forEach((comment) => {
    if (comment.parentId) {
      if (!repliesMap.has(comment.parentId)) {
        repliesMap.set(comment.parentId, []);
      }
      repliesMap.get(comment.parentId).push(comment);
    }
  });

  const createCommentElement = (comment) => {
    const commentEl = document.createElement("div");
    commentEl.className = "comment-item";
    commentEl.dataset.commentId = comment.id;

    const avatarWrapper = document.createElement("div");
    avatarWrapper.className = "comment-avatar-wrapper";
    const avatarImg = document.createElement("img");
    avatarImg.src = comment.avatar;
    avatarImg.alt = "Avatar";
    avatarImg.className = "comment-avatar";
    avatarImg.loading = "lazy";
    avatarWrapper.appendChild(avatarImg);

    const main = document.createElement("div");
    main.className = "comment-main";

    const body = document.createElement("div");
    body.className = "comment-body";
    const userSpan = document.createElement("span");
    userSpan.className = "comment-user";
    userSpan.textContent = comment.user;
    const textP = document.createElement("p");
    textP.className = "comment-text";
    textP.textContent = comment.text;
    body.appendChild(userSpan);
    body.appendChild(textP);

    // DODAJ: Obsługa obrazu w komentarzu
    if (comment.image_url) {
      const imageDiv = document.createElement("div");
      imageDiv.className = "comment-image";
      imageDiv.innerHTML = `<img src="${comment.image_url}" alt="Comment image" loading="lazy">`;
      imageDiv.addEventListener('click', () => openImageLightbox(comment.image_url));
      body.appendChild(imageDiv);
    }

    const footer = document.createElement("div");
    footer.className = "comment-footer";
    const timestampSpan = document.createElement("span");
    timestampSpan.className = "comment-timestamp";
    timestampSpan.textContent = new Date(comment.timestamp).toLocaleString();
    const replyBtn = document.createElement("button");
    replyBtn.className = "comment-action-btn comment-reply-btn";
    replyBtn.dataset.action = "reply-to-comment";
    replyBtn.textContent = Utils.getTranslation("commentReplyAction");

    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "comment-actions-wrapper";
    actionsWrapper.appendChild(replyBtn);

    if (comment.canEdit) {
      const editBtn = document.createElement("button");
      editBtn.className = "comment-action-btn comment-edit-btn";
      editBtn.dataset.action = "edit-comment";
      editBtn.textContent = Utils.getTranslation("commentEditAction");

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "comment-action-btn comment-delete-btn";
      deleteBtn.dataset.action = "delete-comment";
      deleteBtn.textContent = Utils.getTranslation("commentDeleteAction");

      actionsWrapper.appendChild(editBtn);
      actionsWrapper.appendChild(deleteBtn);
    }

    const likesDiv = document.createElement("div");
    likesDiv.className = "comment-likes";
    const likeBtn = document.createElement("button");
    likeBtn.className = `comment-like-btn ${comment.isLiked ? "active" : ""}`;
    likeBtn.dataset.action = "toggle-comment-like";
    likeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    const likeCountSpan = document.createElement("span");
    likeCountSpan.className = "comment-like-count";
    likeCountSpan.textContent = Utils.formatCount(comment.likes);
    likesDiv.appendChild(likeBtn);
    likesDiv.appendChild(likeCountSpan);

    footer.appendChild(timestampSpan);
    footer.appendChild(actionsWrapper);
    footer.appendChild(likesDiv);

    main.appendChild(body);
    main.appendChild(footer);

    commentEl.appendChild(avatarWrapper);
    commentEl.appendChild(main);

    return commentEl;
  };

  const topLevelComments = comments.filter((c) => !c.parentId);

  topLevelComments.forEach((comment) => {
    const threadWrapper = document.createElement("div");
    threadWrapper.className = "comment-thread";

    const parentEl = createCommentElement(comment);
    threadWrapper.appendChild(parentEl);

    const commentReplies = repliesMap.get(comment.id);
    if (commentReplies && commentReplies.length > 0) {
      const repliesContainer = document.createElement("div");
      repliesContainer.className = "comment-replies";

      commentReplies.forEach((reply) => {
        const replyEl = createCommentElement(reply);
        repliesContainer.appendChild(replyEl);
      });

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-replies-btn";
      const updateToggleText = () => {
        const isVisible = repliesContainer.classList.contains("visible");
        const key = isVisible ? "toggleRepliesHide" : "toggleRepliesShow";
        const text = Utils.getTranslation(key).replace(
          "{count}",
          commentReplies.length,
        );
        toggleBtn.innerHTML = `<span class="arrow"></span> ${text}`;
      };

      toggleBtn.addEventListener("click", () => {
        repliesContainer.classList.toggle("visible");
        toggleBtn.classList.toggle("expanded");
        updateToggleText();
      });

      updateToggleText();

      parentEl.querySelector(".comment-main").appendChild(toggleBtn);
      threadWrapper.appendChild(repliesContainer);
    }
    commentList.appendChild(threadWrapper);
  });

  modalBody.appendChild(commentList);
}

function initGlobalPanels() {
  initEmojiPicker();

  // Setup file input handler
  const fileInput = document.querySelector('.comment-image-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleImageSelect);
  }

  // Setup lightbox close
  const lightboxClose = document.querySelector('.image-lightbox-close');
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeImageLightbox);
  }

  const lightbox = document.querySelector('.image-lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeImageLightbox();
      }
    });
  }
}

export const UI = {
  DOM,
  showAlert,
  openModal,
  closeModal,
  updateUIForLoginState,
  updateTranslations,
  applyLikeStateToDom,
  createSlideElement,
  renderSlides,
  initGlobalPanels,
  populateProfileModal,
  renderComments,
  updateCommentFormVisibility,
  initKeyboardListener,
  showToast,
  updateVolumeButton,
  toggleEmojiPicker,
  hideEmojiPicker,
  handleImageAttachment,
  removeCommentImage,
  focusCommentInput,
  scrollToComment,
  openImageLightbox,
  closeImageLightbox,
};