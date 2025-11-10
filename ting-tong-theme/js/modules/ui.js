import { Config } from './config.js';
import { State } from './state.js';
import { Utils } from './utils.js';
// import { PWA } from './pwa.js'; // Usunięte, aby przerwać zależność cykliczną
import { API, slidesData } from './api.js';

let PWA_MODULE = null; // Zmienna przechowująca wstrzykniętą zależność
function setPwaModule(pwaModule) {
  PWA_MODULE = pwaModule;
}

function getIsUserLoggedIn() {
return State.get("isUserLoggedIn");
}

function updateProgress() {
    let progress = 0;
    function animate() {
        if(progress < 200){
            progress += 2;
            let percentage = (progress/500*100).toFixed(0);
            document.getElementById('progressFill').style.width = percentage + '%';
            document.getElementById('progressLabel').innerHTML = `Cel: <strong>${progress} z 500 EUR</strong> (${percentage}%)`;
            document.getElementById('supportersCount').innerText = Math.floor(progress/5);
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

function countdown() {
    const target = new Date('2026-01-01T00:00:00');
    const now = new Date();
    const diff = target - now;
    if(diff > 0){
        const days = Math.floor(diff/(1000*60*60*24));
        const hours = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
        const minutes = Math.floor((diff%(1000*60*60))/(1000*60));
        const seconds = Math.floor((diff%(1000*60))/1000);
        document.getElementById('days').innerText = days;
        document.getElementById('hours').innerText = hours;
        document.getElementById('minutes').innerText = minutes;
        document.getElementById('seconds').innerText = seconds;
        setTimeout(countdown,1000);
    } else {
        document.getElementById('countdownTimer').innerText = 'Premiera!';
    }
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
  DOM.notificationPopup = document.getElementById("notificationPopup");
  DOM.pwaDesktopModal = document.getElementById("pwa-desktop-modal");
  DOM.pwaIosInstructions = document.getElementById("pwa-ios-instructions");
  DOM.welcomeModal = document.getElementById("welcome-modal");
  DOM.infoModal = document.getElementById("infoModal");
  DOM.authorProfileModal = document.getElementById("author-profile-modal");
}

function openAuthorProfileModal(slideData) {
    const modal = DOM.authorProfileModal;
    if (!modal) return;

    // Używamy centralnej funkcji openModal, a logikę populacji przenosimy do onOpen.
    openModal(modal, {
        animationClass: 'slideInRight',
        onOpen: () => {
            // Populate data
            const author = slideData.author;
            modal.querySelector('.username-header').textContent = author.name;
            modal.querySelector('.profile-avatar').src = author.avatar;
            modal.querySelector('.fullname').textContent = author.name; // Assuming fullname is the same as name
            modal.querySelector('.bio').textContent = author.bio || '';

            // Mockup stats for now
            modal.querySelector('.following-count').textContent = '123';
            modal.querySelector('.followers-count').textContent = '45.6K';
            modal.querySelector('.likes-count').textContent = '1.2M';

            // Populate video grid (mockup)
            const videosGrid = modal.querySelector('#videos-grid');
            videosGrid.innerHTML = ''; // Clear previous content
            for (let i = 0; i < 12; i++) {
                const views = `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}K`;
                const thumbnailUrl = (i === 11 && slideData.videoThumbnail) ? slideData.videoThumbnail : `https://picsum.photos/200/300?random=${i}`;
                const videoThumbnail = `
                    <div class="video-thumbnail">
                        <img src="${thumbnailUrl}" alt="Video thumbnail">
                        <div class="video-views">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                            <span>${views}</span>
                        </div>
                    </div>
                `;
                videosGrid.innerHTML += videoThumbnail;
            }
        }
    });
}

function closeAuthorProfileModal() {
    const modal = DOM.authorProfileModal;
    if (!modal) return;
    closeModal(modal, { animationClass: 'slideOutRight' });
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

    const content = modal.querySelector('.modal-content, .elegant-modal-content, .profile-modal-content, .info-modal-content');
    const animationClass = options.animationClass;

    // Usunięcie poprzednich klas animacji, aby uniknąć konfliktów
    if (content && content._lastAnimationClass) {
        content.classList.remove(content._lastAnimationClass);
    }

    modal.style.display = 'flex';
    modal.classList.remove('is-hiding');
    modal.classList.add('visible');

    requestAnimationFrame(() => {
        if (content && animationClass) {
            content.classList.add(animationClass);
            content._lastAnimationClass = animationClass;
        }
    });

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

    if (modal.id === 'infoModal') {
        updateProgress();
        countdown();
    }

    // Umożliwienie zamknięcia przez kliknięcie tła, jeśli to nie jest modal wymuszony
    if (!options.isPersistent) {
        const closeOnClick = (e) => {
            // Sprawdź, czy kliknięto bezpośrednio w overlay
            if (e.target === modal) {
                closeModal(modal);
            }
        };
        modal.addEventListener('click', closeOnClick);
        modal._closeOnClick = closeOnClick;
    }

    activeModals.add(modal);
    document.body.style.overflow = 'hidden';
    DOM.container.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-hidden", "false");

    // Zarządzanie focusem
    State.set("lastFocusedElement", document.activeElement);
    const focusable = getFocusable(modal);
    const focusTarget = modal.querySelector(".modal-content, .fl-modal-content, .tiktok-profile-content, .profile-content") || modal;

    if (focusable.length > 0) {
        focusable[0].focus();
    } else {
        focusTarget.focus();
    }

    modal._focusTrapDispose = trapFocus(modal);

    if (options.onOpen) options.onOpen();
    if (options.onClose) modal.onCloseCallback = options.onClose;
}

function closeModal(modal, options = {}) {
    if (!modal || !activeModals.has(modal) || modal.classList.contains('is-hiding')) return;

    if (modal._closeOnClick) {
        modal.removeEventListener('click', modal._closeOnClick);
        delete modal._closeOnClick;
    }

    modal.setAttribute("aria-hidden", "true");
    modal.classList.add("is-hiding");

    const animationClass = options.animationClass;
    const content = modal.querySelector('.modal-content, .elegant-modal-content, .profile-modal-content, .info-modal-content');

    const cleanup = () => {
        // Usuń event listener, żeby uniknąć wielokrotnego wywołania
        if (content) content.removeEventListener('animationend', cleanup);
        modal.removeEventListener('transitionend', cleanup);

        modal.style.display = 'none';
        modal.classList.remove("visible", "is-hiding");

        // Usuń klasy animacji
        if (content && content._lastAnimationClass) {
            content.classList.remove(content._lastAnimationClass);
            delete content._lastAnimationClass;
        }
        if (content && animationClass) {
            content.classList.remove(animationClass);
        }


        if (modal._focusTrapDispose) {
            modal._focusTrapDispose();
            delete modal._focusTrapDispose;
        }

        activeModals.delete(modal);

        if (activeModals.size === 0) {
            document.body.style.overflow = '';
            DOM.container.removeAttribute("aria-hidden");
        }

        if (!options.keepFocus) {
            State.get("lastFocusedElement")?.focus();
        }

        if (typeof modal.onCloseCallback === 'function') {
            modal.onCloseCallback();
            delete modal.onCloseCallback;
        }
    };

    let animationEventFired = false;
    const duration = 600; // Domyślny czas trwania animacji w ms

    if (content && animationClass) {
        // Usuń poprzednią klasę animacji wejściowej
        if (content._lastAnimationClass) {
            content.classList.remove(content._lastAnimationClass);
        }
        content.classList.add(animationClass);
        content._lastAnimationClass = animationClass; // Zapamiętaj klasę wyjściową

        content.addEventListener('animationend', () => {
            animationEventFired = true;
            cleanup();
        }, { once: true });

        // Fallback, jeśli event 'animationend' się nie odpali
        setTimeout(() => {
            if (!animationEventFired) cleanup();
        }, duration + 50);

    } else {
        modal.classList.remove('visible');
        // Dla modali bez animacji keyframe (np. comments, które używają transition)
        modal.addEventListener('transitionend', () => {
             animationEventFired = true;
             cleanup();
        }, { once: true });

        // Fallback
        setTimeout(() => {
            if (!animationEventFired) cleanup();
        }, duration);
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

function closeWelcomeModal() {
    const modal = DOM.welcomeModal;
    if (!modal || !modal.classList.contains('visible') || modal.classList.contains('is-hiding')) {
        return;
    }

    modal.classList.add('is-hiding');
    modal.setAttribute('aria-hidden', 'true');

    const content = modal.querySelector('.welcome-modal-content');

    const cleanup = () => {
        if(content) content.removeEventListener('animationend', cleanup);
        modal.classList.remove('visible', 'is-hiding');
        activeModals.delete(modal);

        if (activeModals.size === 0) {
            DOM.container.removeAttribute('aria-hidden');
            const lastFocused = State.get('lastFocusedElement');
            if(lastFocused) lastFocused.focus();
        }
    };

    if(content){
        content.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, 700); // Fallback
    } else {
        closeModal(modal); // Fallback for simple structure
    }
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
  renderComments,
  updateCommentFormVisibility,
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
  getIsUserLoggedIn,
  closeCommentsModal,
  closeWelcomeModal,
  updateCrowdfundingStats,
  openAuthorProfileModal,
  closeAuthorProfileModal,
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