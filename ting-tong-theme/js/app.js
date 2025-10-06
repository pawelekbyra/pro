import { Config } from './modules/config.js';
import { State } from './modules/state.js';
import { Utils } from './modules/utils.js';
import { API, slidesData } from './modules/api.js';
import { UI } from './modules/ui.js';
import { PWA } from './modules/pwa.js';
import { Handlers } from './modules/handlers.js';
import { Notifications } from './modules/notifications.js';
import { AccountPanel } from './modules/account-panel.js';

// DEZAKTYWACJA SERVICE WORKER (USUWANIE CACHE PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered');
    }
  });
}

(() => {
  /* ============================
   * 1) CDN helper + preconnect
   * ============================ */
  const CDN_HOST = null; // <— ZMIEŃ jeśli używasz innego hosta CDN
  const isHttpUrl = (u) => /^https?:\/\//i.test(u);

  // Wstrzyknij preconnect/dns-prefetch (robimy to dynamicznie, żeby nie ruszać <head>)
  try {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (head && CDN_HOST) {
      const mk = (tag, attrs) => {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        return el;
      };
      // nie duplikuj
      if (
        !document.querySelector(`link[rel="preconnect"][href="${CDN_HOST}"]`)
      ) {
        head.appendChild(
          mk("link", { rel: "preconnect", href: CDN_HOST, crossorigin: "" }),
        );
      }
      if (
        !document.querySelector(
          `link[rel="dns-prefetch"][href="//${CDN_HOST.replace(/^https?:\/\//, "")}"]`,
        )
      ) {
        head.appendChild(
          mk("link", {
            rel: "dns-prefetch",
            href: "//" + CDN_HOST.replace(/^https?:\/\//, ""),
          }),
        );
      }
    }
  } catch (e) {
    /* no-op */
  }

  // Helper mapujący origin → CDN (zachowuje ścieżkę)
  function toCDN(url) {
    if (!url || !CDN_HOST) return url;
    try {
      // jeśli już CDN — zostaw
      if (url.startsWith(CDN_HOST)) return url;
      // jeśli absolutny http(s) — podmień tylko host
      if (isHttpUrl(url)) {
        const u = new URL(url);
        const c = new URL(CDN_HOST);
        return `${c.origin}${u.pathname}${u.search}${u.hash}`;
      }
      // jeśli względny — dolej do CDN
      return CDN_HOST.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
    } catch {
      return url;
    }
  }

  // Podmień src na CDN przy pierwszym ustawieniu źródeł (bez grzebania w Twoich funkcjach)
  // — obejście: obserwujemy dodawanie/zmianę <source>/<video>
  const mm = new MutationObserver((muts) => {
    for (const m of muts) {
      const nodes = Array.from(m.addedNodes || []);
      for (const n of nodes) rewriteSources(n);
      if (
        m.type === "attributes" &&
        (m.target.tagName === "SOURCE" || m.target.tagName === "VIDEO") &&
        m.attributeName === "src"
      ) {
        rewriteNodeSrc(m.target);
      }
    }
  });
  mm.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });

  function rewriteSources(root) {
    if (!root || !CDN_HOST) return;
    if (root.tagName === "SOURCE" || root.tagName === "VIDEO")
      rewriteNodeSrc(root);
    root.querySelectorAll?.("source, video").forEach(rewriteNodeSrc);
  }
  function rewriteNodeSrc(el) {
    try {
      const src = el.getAttribute("src");
      if (!src) return;
      const mapped = toCDN(src);
      if (mapped && mapped !== src) el.setAttribute("src", mapped);
    } catch (e) {}
  }
})();

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
          },
        });

        setTimeout(() => {
          UI.DOM.preloader.classList.add("preloader-hiding");
          UI.DOM.container.classList.add("ready");
          const pwaInstallBar = document.getElementById("pwa-install-bar");
          const appFrame = document.getElementById("app-frame");

          // [Poprawiony fragment dla paska PWA]
          // Sprawdza, czy pasek istnieje i CZY JESTEŚMY W TRYBIE PRZEGLĄDARKOWYM.
          if (pwaInstallBar && !PWA.isStandalone()) {
            // Tryb przeglądarkowy: Pokaż pasek i dostosuj wysokość app-frame
            pwaInstallBar.classList.add("visible");
            if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
          } else {
            // Tryb PWA lub brak paska: Jawnie ukryj pasek za pomocą dedykowanej klasy.
            if (pwaInstallBar) {
              pwaInstallBar.classList.add("force-hide");
            }
            if (appFrame) {
              appFrame.classList.remove("app-frame--pwa-visible");
            }
          }
          document.querySelectorAll(".sidebar").forEach((sidebar) => {
            sidebar.classList.add("visible");
          });
          UI.DOM.preloader.addEventListener(
            "transitionend",
            () => {
              UI.DOM.preloader.style.display = "none";
              // Pokaż modal powitalny tylko w przeglądarce, nie w PWA
              if (!PWA.isStandalone() && UI.DOM.welcomeModal) {
                setTimeout(() => {
                  UI.openModal(UI.DOM.welcomeModal);
                }, 300); // Małe opóźnienie dla płynniejszego efektu
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
        AccountPanel.init();
        UI.initGlobalPanels();
        UI.initKeyboardListener();
        PWA.init();
        _initializePreloader();
        document.body.classList.add("loaded");
      },
      fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
    };
  })();

  App.init();
});