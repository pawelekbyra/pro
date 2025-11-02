import { Config } from './config.js';
import { State } from './state.js';
import { Utils } from './utils.js';
// import { PWA } from './pwa.js'; // Usunięte, aby przerwać zależność cykliczną
import { API, slidesData } from './api.js';

let PWA_MODULE = null; // Zmienna przechowująca wstrzykniętą zależność
function setPwaModule(pwaModule) {
  PWA_MODULE = pwaModule;
}

let selectedCommentImage = null;

const DOM = {};
let alertTimeout;

function initDOMCache() {
  DOM.container = document.getElementById("webyx-container");
  DOM.template = document.getElementById("slide-template");
  DOM.preloader = document.getElementById("preloader");
  DOM.alertBox = document.getElementById("alertBox");
  DOM.alertText = document.getElementById("alertText");
  DOM.commentsModal = document.getElementById("comments-modal-container");
  DOM.accountModal = document.getElementById("accountModal");
  DOM.tiktokProfileModal = document.getElementById("tiktok-profile-modal");
  DOM.notificationPopup = document.getElementById("notificationPopup");
  DOM.pwaDesktopModal = document.getElementById("pwa-desktop-modal");
  DOM.pwaIosInstructions = document.getElementById("pwa-ios-instructions");
  DOM.welcomeModal = document.getElementById("welcome-modal");
  DOM.infoModal = document.getElementById("infoModal");
}
function showToast(message, isError = false) {
    showAlert(message, isError);
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

const activeModals = new Set();

function openModal(modal, options = {}) {
    if (!modal) {
        console.error("Attempted to open a null modal element.");
        return;
    }

    // ZMIANY: Wymuś wyświetlanie i usuń blokującą klasę
    modal.style.display = 'block'; // **Kluczowa zmiana: wymusza widoczność, nadpisując CSS**
    modal.classList.remove("is-hiding"); // Zapobiega błędom po przerwanej animacji zamykania

    if (modal.id === 'comments-modal-container') {
        const swiper = State.get('swiper');
        if (swiper) {
            const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;
            const slideData = slidesData.find(s => s.id === slideId);
            const count = slideData ? slideData.initialComments : 0;
            const titleEl = modal.querySelector('#commentsTitle');
            if (titleEl) {
                titleEl.textContent = `${Utils.getTranslation('commentsModalTitle')} (${count})`;
            }
        }
    }

    modal.classList.add('visible');
    activeModals.add(modal);

    if (activeModals.size === 1) {
        document.body.style.overflow = 'hidden';
    }

    // ... reszta kodu bez zmian ...

    if (options.onOpen) {
        options.onOpen();
    }

    // Store the onClose callback on the element itself
    if (options.onClose) {
        modal.onCloseCallback = options.onClose;
    }

    State.set("lastFocusedElement", document.activeElement);
    DOM.container.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-hidden", "false");
    const focusable = getFocusable(modal);
    (focusable.length > 0 ? focusable[0] : modal.querySelector(".modal-content,.fl-modal-content, .tiktok-profile-content"))?.focus();
    modal._focusTrapDispose = trapFocus(modal);
}

function closeModal(modal) {
    if (!modal || !activeModals.has(modal) || modal.classList.contains("is-hiding")) return;

    const isAnimated = modal.querySelector('.first-login-modal-content-wrapper,.modal-content, .tiktok-profile-content, .account-modal-content');

    modal.classList.add("is-hiding");
    modal.setAttribute("aria-hidden", "true");

    const cleanup = () => {
        modal.removeEventListener("transitionend", cleanup);
        modal.classList.remove("visible", "is-hiding");

        if (modal._focusTrapDispose) {
            modal._focusTrapDispose();
            delete modal._focusTrapDispose;
        }

        activeModals.delete(modal);

        if (activeModals.size === 0) {
            document.body.style.overflow = '';
        }

        DOM.container.removeAttribute("aria-hidden");
        State.get("lastFocusedElement")?.focus();

        // Execute and clear the onClose callback
        if (typeof modal.onCloseCallback === 'function') {
            modal.onCloseCallback();
            delete modal.onCloseCallback;
        }

        if (modal.id === "commentsModal") {
            State.set("replyingToComment", null, true);
            const replyContext = document.querySelector(".reply-context");
            if (replyContext) replyContext.style.display = "none";
            if (typeof UI.removeCommentImage === 'function') UI.removeCommentImage();
            const commentInput = document.querySelector("#comment-input");
            if (commentInput) commentInput.value = "";
        }
    };

    if (isAnimated) {
        modal.addEventListener("transitionend", cleanup, { once: true });
        setTimeout(cleanup, 500); // Fallback
    } else {
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

/**
 * Sprawdza czy dla danego slajdu jest aktywna nakładka blokująca
 */
function isSlideOverlayActive(slideElement) {
  if (!slideElement) return false;

  const secretOverlay = slideElement.querySelector('.secret-overlay');
  const pwaSecretOverlay = slideElement.querySelector('.pwa-secret-overlay');

  const isSecretVisible = secretOverlay && secretOverlay.classList.contains('visible');
  const isPwaSecretVisible = pwaSecretOverlay && pwaSecretOverlay.classList.contains('visible');

  return isSecretVisible || isPwaSecretVisible;
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
    const isPwaSecret = sim.dataset.access === "pwa-secret";
    const isStandalone = PWA_MODULE ? PWA_MODULE.isStandalone() : false;
    const video = section.querySelector("video");

    // Determine overlay visibility
    const showSecret = isSecret && !isLoggedIn;
    const showPwaSecret = isPwaSecret && !isStandalone;

    // If an overlay is active, force the UI to be visible
    if (showSecret || showPwaSecret) {
      sim.classList.add("video-loaded");
    }

    // Toggle "secret" overlay
    const secretOverlay = section.querySelector(".secret-overlay");
    if (secretOverlay) {
        secretOverlay.classList.toggle("visible", showSecret);
        if (showSecret) {
            secretOverlay.querySelector(".secret-title").textContent = Utils.getTranslation("secretTitle");
            const subtitleUElement = secretOverlay.querySelector(".secret-subtitle u");
            const subtitleSpanElement = secretOverlay.querySelector(".secret-subtitle span");
            if (subtitleUElement && subtitleSpanElement) {
                subtitleUElement.dataset.action = "toggle-login-panel";
                subtitleUElement.textContent = Utils.getTranslation("secretSubtitleAction");
                subtitleSpanElement.textContent = " " + Utils.getTranslation("secretSubtitleRest");
            }
        }
    }

    // Toggle "pwa-secret" overlay
    const pwaSecretOverlay = section.querySelector(".pwa-secret-overlay");
    if (pwaSecretOverlay) {
        pwaSecretOverlay.classList.toggle("visible", showPwaSecret);
        if (showPwaSecret) {
            pwaSecretOverlay.querySelector(".pwa-secret-title").textContent = Utils.getTranslation("pwaTitle");
            const subtitleUElement = pwaSecretOverlay.querySelector(".pwa-secret-subtitle u");
            const subtitleSpanElement = pwaSecretOverlay.querySelector(".pwa-secret-subtitle span");
            if (subtitleUElement && subtitleSpanElement) {
                subtitleUElement.textContent = Utils.getTranslation("pwaSecretSubtitleAction");
                subtitleSpanElement.textContent = Utils.getTranslation("pwaSecretSubtitleRest");
            }
        }
    }

    // Control video playback based on overlay state
    if (video) {
        const isOverlayVisible = showSecret || showPwaSecret;
        const isCurrentSlide = section.classList.contains('swiper-slide-active');

        // First, enforce pausing if any overlay is active.
        // This is the most important rule.
        if (isOverlayVisible) {
            if (!video.paused) {
                video.pause();
            }
        }
        // Only if no overlays are active, consider playing the video.
        else if (isCurrentSlide && video.paused) {
            video.play().catch(e => console.warn("Autoplay prevented on UI update:", e));
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
      // Wideo zablokowane domyślnie pauzujemy. Logika UI je odblokuje, jeśli warunki są spełnione.
      if (slideData.access === 'secret' || slideData.access === 'pwa-secret') {
        videoEl.pause();
      }
    }
  }

  // Ustawienie początkowej widoczności nakładek.
  // Główna logika jest w `updateUIForLoginState`, ale to zapewnia poprawny stan przed pierwszym renderowaniem.
  if (slideData.access === 'pwa-secret' && PWA_MODULE && !PWA_MODULE.isStandalone()) {
    const pwaSecretOverlay = section.querySelector('.pwa-secret-overlay');
    if (pwaSecretOverlay) {
      pwaSecretOverlay.classList.add('visible');
    }
    // ✅ FIX: Natychmiast dodaj klasę video-loaded dla slajdów PWA, aby UI był widoczny
    section.querySelector('.tiktok-symulacja').classList.add('video-loaded');
  }

  section.querySelector(".tiktok-symulacja").dataset.access =
    slideData.access;
  const avatarImg = section.querySelector(".profileButton img");
  avatarImg.src = slideData.author.avatar;
  if (slideData.author.is_vip) {
    avatarImg.classList.add("vip-avatar-border");
  }

  section.querySelector(".slide-title").textContent = slideData.title;
  section.querySelector(".author-name").textContent = slideData.author.name;
  section.querySelector(".slide-description").textContent =
    slideData.description;

  const likeBtn = section.querySelector(".like-button");
  likeBtn.dataset.likeId = slideData.likeId;
  updateLikeButtonState(likeBtn, slideData.isLiked, slideData.initialLikes);

  const commentsBtn = section.querySelector(".commentsButton");
  const commentsCountEl = commentsBtn.querySelector(".comment-count");
  commentsCountEl.textContent = Utils.formatCount(
    slideData.initialComments,
  );

  const tiktokSymulacja = section.querySelector(".tiktok-symulacja");
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

    // Gdy video jest odtwarzane (po play) - ukryj overlays
    videoEl.addEventListener("playing", () => {
      replayOverlay.classList.remove("visible");
      pauseOverlay.classList.remove("visible");
    });
  }
  const progressBar = section.querySelector(".progress-bar");
  const progressBarFill = section.querySelector(".progress-bar-fill");

  if (videoEl) {
    // ✅ FIX: Pokaż UI od razu po załadowaniu metadanych, nie czekaj na odtwarzanie
    videoEl.addEventListener(
      "loadedmetadata",
      () => {
        tiktokSymulacja.classList.add("video-loaded");
      },
      { once: true },
    );

    // Spróbuj odtworzyć (może zadziałać lub nie - ale UI już będzie widoczny)
    videoEl.addEventListener(
      "canplay",
      () => {
        // Tylko jeśli to aktywny slajd i brak overlay
        if (section.classList.contains('swiper-slide-active')) {
          const secretOverlay = section.querySelector('.secret-overlay');
          const pwaSecretOverlay = section.querySelector('.pwa-secret-overlay');
          const isOverlayVisible =
            (secretOverlay && secretOverlay.classList.contains('visible')) ||
            (pwaSecretOverlay && pwaSecretOverlay.classList.contains('visible'));

          if (!isOverlayVisible && videoEl.paused) {
            videoEl.play().catch(e => {
              console.log("Autoplay prevented, showing pause overlay");
              const pauseOverlay = section.querySelector('.pause-overlay');
              if (pauseOverlay) pauseOverlay.classList.add('visible');
            });
          }
        }
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
  if (!slideData || !slideData.author || !DOM.tiktokProfileModal) return;

  const { author } = slideData;

  // Basic info
  const atUsername = `@${author.name
    .toLowerCase()
    .replace(/\s/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")}`;
  DOM.tiktokProfileModal.querySelector("#tiktok-profile-avatar").src =
    author.avatar;
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-profile-username",
  ).textContent = author.name;
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-profile-nickname",
  ).textContent = author.name;
  DOM.tiktokProfileModal.querySelector(
    "#tiktok-profile-at-username",
  ).textContent = atUsername;
  DOM.tiktokProfileModal.querySelector("#tiktok-profile-bio").textContent =
    author.description;

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

/**
 * Globalny Keyboard Listener (v2 - Niezawodny)
 * Odporny na zmiany orientacji i poprawnie współpracuje z CSS "Freezer".
 */

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
    const container = DOM.commentsModal.querySelector('.comments-list');
    const emptyState = DOM.commentsModal.querySelector('.comments-empty-state');
    const errorState = DOM.commentsModal.querySelector('.comment-load-error');
    const template = document.getElementById('comment-template');

    if (!container || !emptyState || !errorState || !template) {
        console.error('Required comment elements not found in DOM.');
        if(errorState) errorState.style.display = 'block';
        return;
    }

    container.innerHTML = '';
    errorState.style.display = 'none';

    if (!comments || comments.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    const fragment = document.createDocumentFragment();

    comments.forEach(comment => {
        const commentNode = template.content.cloneNode(true);
        const commentItem = commentNode.querySelector('.comment-item');

        commentItem.dataset.commentId = comment.id;
        commentItem.querySelector('.comment-avatar img').src = comment.avatar || 'path/to/default-avatar.png';
        commentItem.querySelector('.comment-author').textContent = comment.user;
        commentItem.querySelector('.comment-timestamp').textContent = Utils.formatTimeAgo(comment.timestamp);
        commentItem.querySelector('.comment-text').textContent = comment.text;

        const imageAttachment = commentItem.querySelector('.comment-image-attachment');
        if (comment.image_url) {
            imageAttachment.style.display = 'block';
            imageAttachment.querySelector('img').src = comment.image_url;
            imageAttachment.querySelector('img').addEventListener('click', () => openImageLightbox(comment.image_url));
        } else {
            imageAttachment.style.display = 'none';
        }

        const likeBtn = commentItem.querySelector('.comment-like-btn');
        likeBtn.classList.toggle('active', comment.isLiked);
        commentItem.querySelector('.comment-like-count').textContent = Utils.formatCount(comment.likes);

        const optionsContainer = commentItem.querySelector('.comment-options');
        if (comment.canEdit) {
            optionsContainer.style.display = 'block';
        } else {
            optionsContainer.style.display = 'none';
        }

        fragment.appendChild(commentNode);
    });

    container.appendChild(fragment);
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
function openAuthorModal(slideData) {
  if (!slideData || !slideData.author) {
    // Lepszy komunikat błędu
    console.error("Slide data or Author object is missing/incomplete.");
    return;
  }
  populateProfileModal(slideData); // Przekazanie całego obiektu slajdu
  openModal(DOM.tiktokProfileModal);
}


export const UI = {
  initDOMCache,
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
  openAuthorModal,
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
  isSlideOverlayActive, // ✅ NOWE
  setPwaModule, // ✅ NOWE
  closeCommentsModal,
};

function closeCommentsModal() {
    const modal = DOM.commentsModal;
    if (!modal || !modal.classList.contains('visible') || modal.classList.contains('is-hiding')) {
        return;
    }

    modal.classList.add('is-hiding');
    modal.setAttribute('aria-hidden', 'true');

    const cleanup = () => {
        modal.removeEventListener('transitionend', cleanup);
        modal.classList.remove('visible', 'is-hiding');
        activeModals.delete(modal);

        if (activeModals.size === 0) {
            DOM.container.removeAttribute('aria-hidden');
            State.get('lastFocusedElement')?.focus();
        }
    };

    modal.addEventListener('transitionend', cleanup, { once: true });
    // Fallback w razie gdyby event się nie odpalił
    setTimeout(cleanup, 400);
}
