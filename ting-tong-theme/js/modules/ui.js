import { Config } from './config.js';
import { State } from './state.js';
import { Utils } from './utils.js';
// import { PWA } from './pwa.js'; // Usunięte, aby przerwać zależność cykliczną
import { API, slidesData } from './api.js';
import { CommentsModal } from './comments-modal.js';

let PWA_MODULE = null; // Zmienna przechowująca wstrzykniętą zależność
function setPwaModule(pwaModule) {
  PWA_MODULE = pwaModule;
}

function getIsUserLoggedIn() {
return State.get("isUserLoggedIn");
}

let countdownInterval = null;

function startCountdown() {
  const countdownElement = document.getElementById('countdown-timer');
  const countdownDateElement = document.getElementById('countdown-date');
  if (!countdownElement || !countdownDateElement) return;

  const endDate = new Date(countdownDateElement.textContent).getTime();

  const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = endDate - now;

    if (distance < 0) {
      clearInterval(countdownInterval);
      countdownElement.textContent = "Premiera!";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownElement.innerHTML = `
      <span class="countdown-part">${days}<span class="countdown-label-small">dni</span></span>
      <span class="countdown-part">${hours.toString().padStart(2, '0')}<span class="countdown-label-small">h</span></span>
      <span class="countdown-part">${minutes.toString().padStart(2, '0')}<span class="countdown-label-small">m</span></span>
      <span class="countdown-part">${seconds.toString().padStart(2, '0')}<span class="countdown-label-small">s</span></span>`;
  };

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
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
  DOM.commentsModal = document.getElementById("fastcomments-modal-container");
  DOM.fastCommentsContainer = document.getElementById("fastcomments-widget-0");
  DOM.accountModal = document.getElementById("accountModal");
  DOM.notificationPopup = document.getElementById("notificationPopup");
  DOM.pwaDesktopModal = document.getElementById("pwa-desktop-modal");
  DOM.pwaIosInstructions = document.getElementById("pwa-ios-instructions");
  DOM.welcomeModal = document.getElementById("welcome-modal");
  DOM.infoModal = document.getElementById("infoModal");
  DOM.authorProfileModal = document.getElementById("author-profile-modal");
  DOM.cropModal = document.getElementById("cropModal");
}

function openAuthorProfileModal(slideData, options = {}) {
    const modal = DOM.authorProfileModal;
    if (!modal) return;

    /* === POCZĄTEK POPRAWKI === */
    // Logika 'setTimeout' i 'classList.add' została usunięta.
    // 'openModal' zajmie się teraz wszystkim.
    /* === KONIEC POPRAWKI === */

    const content = modal.querySelector('.profile-modal-content');

    // Przekaż animację i selektor do 'openModal'
    openModal(modal, {
        /* === POCZĄTEK POPRAWKI === */
        animationClass: 'slideInRight',
        contentSelector: '.profile-modal-content',
        /* === KONIEC POPRAWKI === */
        onOpen: () => {
            const author = slideData.author;
            modal.querySelector('.username-header').textContent = Utils.getTranslation('authorProfileTitle');
            const avatarImg = modal.querySelector('.profile-avatar');
            avatarImg.src = author.avatar;
            avatarImg.classList.add('author-modal-avatar');
            modal.querySelector('.fullname').textContent = author.name;
            modal.querySelector('.bio').textContent = author.bio || '';

            modal.querySelector('.following-count').textContent = '123';
            modal.querySelector('.followers-count').textContent = '45.6K';
            modal.querySelector('.likes-count').textContent = '1.2M';

            const followBtn = modal.querySelector('.follow-btn');
            // --- Start: Pop & Bounce Animation ---
            const actionButtons = modal.querySelectorAll('.follow-btn, .social-btn');

            actionButtons.forEach(btn => {
                let bounceTimeout;

                // Funkcja czyszcząca klasy na wszelki wypadek
                const removeClasses = () => {
                    btn.classList.remove('pressed', 'bounced');
                    clearTimeout(bounceTimeout);
                };

                // Handler naciśnięcia
                const handlePress = (e) => {
                    // Zapobiegaj 'ghost click' na mobile
                    if (e.type === 'touchstart') e.preventDefault();
                    btn.classList.add('pressed');
                };

                // Handler puszczenia przycisku
                const handleRelease = () => {
                    // Wykonaj tylko jeśli był wciśnięty
                    if (!btn.classList.contains('pressed')) return;

                    btn.classList.remove('pressed');
                    btn.classList.add('bounced');

                    // Usuń klasę odbicia po chwili
                    bounceTimeout = setTimeout(() => {
                        btn.classList.remove('bounced');
                    }, 150);
                };

                // Dodaj kompletne listenery
                btn.addEventListener('mousedown', handlePress);
                btn.addEventListener('touchstart', handlePress, { passive: false });
                btn.addEventListener('mouseup', handleRelease);
                btn.addEventListener('mouseleave', removeClasses); // Czyści, jeśli wyjedziesz myszką
                btn.addEventListener('touchend', handleRelease);
            });
            // --- End: Pop & Bounce Animation ---
            const btnSpan = followBtn.querySelector('span');
            const btnSvg = followBtn.querySelector('svg');

            const isLoggedIn = getIsUserLoggedIn();

            if (isLoggedIn) {
                btnSpan.textContent = 'Subskrajbujesz';
                btnSvg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>';
                followBtn.disabled = true;
            } else {
                btnSpan.textContent = 'Zostań Patronem';
                btnSvg.innerHTML = '<rect x="2" y="7" width="20" height="12" rx="2" ry="2" /><path d="M2 10h20" /><circle cx="18" cy="13" r="2" />';
                followBtn.disabled = false;
            }

            const videosGrid = modal.querySelector('#videos-grid');
            videosGrid.innerHTML = '';

            const authorSlides = slidesData.filter(s => s.author.name === author.name && !s.isIframe);
            const otherSlides = authorSlides.filter(s => s.id !== slideData.id);
            const orderedSlides = [...otherSlides, slideData];

            const isStandalone = PWA_MODULE ? PWA_MODULE.isStandalone() : false;

            orderedSlides.forEach(authorSlide => {
                const thumbnailUrl = authorSlide.thumbnailUrl || `https://picsum.photos/200/300?random=${authorSlide.id}`;
                let overlayHtml = '';

                const isSecret = authorSlide.access === 'secret';
                const isPwaSecret = authorSlide.access === 'pwa-secret';
                const isLocked = (isSecret && !isLoggedIn) || (isPwaSecret && !isStandalone);

                if (isSecret && !isLoggedIn) {
                    overlayHtml = `
                        <div class="thumbnail-overlay-block">
                            <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                            <div class="badge">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2L2 9l10 13L22 9l-10-7zM2 9l10 3 10-3M12 12v10" /></svg>
                            </div>
                        </div>`;
                } else if (isPwaSecret && !isStandalone) {
                    overlayHtml = `
                        <div class="thumbnail-overlay-block">
                            <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                            <div class="badge">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                            </div>
                        </div>`;
                }

                const videoThumbnail = `
                    <div class="video-thumbnail ${isLocked ? 'locked-thumbnail' : ''}" data-video-url="${authorSlide.mp4Url}">
                        <img src="${thumbnailUrl}" alt="Video thumbnail">
                        ${overlayHtml}
                        <div class="video-views">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                            <span>${Utils.formatCount(authorSlide.initialLikes)}</span>
                        </div>
                    </div>
                `;
                videosGrid.innerHTML += videoThumbnail;
            });
        }
    });
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
    DOM.alertBox.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    DOM.alertBox.style.border = isError
      ? "1px solid var(--accent-color)"
      : "1px solid #000";
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

    modal.style.display = 'flex';
    modal.classList.remove('is-hiding');
    void modal.offsetWidth;
    modal.classList.add('visible');

    const contentSelector = options.contentSelector || '.modal-content, .elegant-modal-content, .profile-modal-content, .fl-modal-content, .welcome-modal-content';
    const contentElement = modal.querySelector(contentSelector);

    if (modal.id === 'fastcomments-modal-container') {
        contentElement.style.transform = 'translateY(100%)';
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
    } else if (options.animationClass && contentElement) {
        contentElement.style.animation = `${options.animationClass} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
        contentElement.addEventListener('animationend', () => {
            contentElement.style.animation = '';
        }, { once: true });
    }


    if (modal.id === 'infoModal') {
        startCountdown();
        updateCrowdfundingStats();
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

    // Dispatch the custom event
    modal.dispatchEvent(new CustomEvent('modal:open'));
}

function _resetVideoPlayer(videoModal) {
    if (!videoModal) return;
    const videoPlayer = videoModal.querySelector('video');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.removeAttribute('src');
        videoPlayer.load();
    }
}

function closeModal(modal, options = {}) {
    if (!modal || !activeModals.has(modal) || modal.classList.contains('is-hiding')) return;

    activeModals.delete(modal);

    if (activeModals.size === 0) {
        document.body.style.overflow = '';
        DOM.container.removeAttribute('aria-hidden');
    }

    modal.classList.add('is-hiding');
    modal.setAttribute('aria-hidden', 'true');

    const contentSelector = options.contentSelector || '.modal-content, .elegant-modal-content, .profile-modal-content, .fl-modal-content, .welcome-modal-content';
    const contentElement = modal.querySelector(contentSelector);

    let cleanupHasRun = false;
    const cleanup = () => {
        if (cleanupHasRun) return;
        cleanupHasRun = true;

        if (contentElement) {
            contentElement.removeEventListener('animationend', cleanup);
            contentElement.style.animation = ''; // Zresetuj animację po zakończeniu
        }
        modal.removeEventListener('transitionend', cleanup);


        modal.style.display = 'none';
        modal.classList.remove('is-hiding', 'visible');

        if (modal._focusTrapDispose) {
            modal._focusTrapDispose();
            delete modal._focusTrapDispose;
        }

        const lastFocused = State.get("lastFocusedElement");
        if (lastFocused && document.body.contains(lastFocused) && !options.keepFocus) {
            lastFocused.focus();
        }

        if (typeof options.onClose === 'function') {
            options.onClose();
        }
    };

    if (modal.id === 'fastcomments-modal-container') {
        modal.classList.remove('visible');
        const onTransitionEnd = () => {
            modal.removeEventListener('transitionend', onTransitionEnd);
            cleanup();
        };
        modal.addEventListener('transitionend', onTransitionEnd);
    } else if (options.animationClass && contentElement) {
        contentElement.style.animation = `${options.animationClass} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
        contentElement.addEventListener('animationend', cleanup, { once: true });
    } else {
        modal.classList.remove('visible');
        modal.addEventListener('transitionend', cleanup, { once: true });
    }

    setTimeout(cleanup, 500); // Ostateczny fallback
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

    const showSecret = isSecret && !isLoggedIn;
    const showPwaSecret = isPwaSecret && !isStandalone;
    const isOverlaid = showSecret || showPwaSecret;


    // If an overlay is active, force the UI to be visible
    if (isOverlaid) {
      sim.classList.add("video-loaded");
    }

    // Toggle "secret" overlay (static wall for guests)
    const secretOverlay = section.querySelector(".secret-overlay");
    if (secretOverlay) {
        secretOverlay.classList.toggle('visible', showSecret);
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

    // Control video playback/UI visibility based on overlay state
    if (video) {
        const isCurrentSlide = section.classList.contains('swiper-slide-active');

        // ZMIANA: Wideo ma ZAWSZE grać, jeśli to nie jest statyczna/pwa blokada
        if (isCurrentSlide && !showSecret && !showPwaSecret && video.paused) {
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

  if (slideData.id === 'slide-002') {
    section.classList.add('slide--light-theme');
  }

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

  const tiktokSymulacja = section.querySelector(".tiktok-symulacja");

  tiktokSymulacja.dataset.access = slideData.access;
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

        // Get current width to prevent "going back"
        const currentWidth = parseFloat(progressBarFill.style.width) || 0;
        if (progress < currentWidth && videoEl.currentTime > 0) {
            // This can happen on buffer/seek, let's ignore it to prevent visual glitch
            return;
        }

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

function initGlobalPanels() {
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
  slidesData,
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
  showToast,
  updateVolumeButton,
  isSlideOverlayActive, // ✅ NOWE
  setPwaModule, // ✅ NOWE
  getIsUserLoggedIn,
  closeWelcomeModal,
  updateCrowdfundingStats,
  openAuthorProfileModal,
};

async function updateCrowdfundingStats() {
    try {
        const result = await API.getNewCrowdfundingStats();
        if (result.success && result.data) {
            const stats = result.data;
            const patronsEl = document.querySelector('.stats-grid .stat-item:nth-child(1) .stat-value');
            const collectedEl = document.querySelector('.progress-label span strong');
            const progressFillEl = document.querySelector('.progress-section .progress-bar-fill');
            const progressLabelEl = document.querySelector('.progress-label');

            if (patronsEl) patronsEl.textContent = stats.patrons_count;

            if (progressLabelEl) {
                const goal = parseFloat(progressLabelEl.dataset.goal) || 500;
                const percentage = Math.min(100, (stats.collected_eur / goal) * 100);
                progressLabelEl.dataset.collected = stats.collected_eur.toFixed(2);
                progressLabelEl.dataset.percentage = percentage.toFixed(0);

                if (collectedEl) collectedEl.textContent = `${stats.collected_eur.toFixed(2)} z ${goal} EUR`;

                const labelSpan = progressLabelEl.querySelector('span');
                if(labelSpan) {
                    labelSpan.innerHTML = `Cel: <strong>${stats.collected_eur.toFixed(2)} z ${goal} EUR</strong> (${percentage.toFixed(0)}%)`;
                }
            }

            if (progressFillEl) {
                const goal = 500;
                const percentage = Math.min(100, (stats.collected_eur / goal) * 100);
                progressFillEl.style.width = `${percentage}%`;
            }
        }
    } catch (error) {
        console.error("Failed to update crowdfunding stats:", error);
    }
}

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