(() => {
      /* ============================
       * 1) CDN helper + preconnect
       * ============================ */
      const CDN_HOST = null; // <— ZMIEŃ jeśli używasz innego hosta CDN
      const isHttpUrl = (u) => /^https?:\/\//i.test(u);

      // Wstrzyknij preconnect/dns-prefetch (robimy to dynamicznie, żeby nie ruszać <head>)
      try {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (head && CDN_HOST) {
          const mk = (tag, attrs) => {
            const el = document.createElement(tag);
            Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
            return el;
          };
          // nie duplikuj
          if (!document.querySelector(`link[rel="preconnect"][href="${CDN_HOST}"]`)) {
            head.appendChild(mk('link', { rel: 'preconnect', href: CDN_HOST, crossorigin: '' }));
          }
          if (!document.querySelector(`link[rel="dns-prefetch"][href="//${CDN_HOST.replace(/^https?:\/\//,'')}"]`)) {
            head.appendChild(mk('link', { rel: 'dns-prefetch', href: '//' + CDN_HOST.replace(/^https?:\/\//,'') }));
          }
        }
      } catch(e){ /* no-op */ }

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
          return CDN_HOST.replace(/\/+$/,'') + '/' + url.replace(/^\/+/, '');
        } catch {
          return url;
        }
      }

      // Podmień src na CDN przy pierwszym ustawieniu źródeł (bez grzebania w Twoich funkcjach)
      // — obejście: obserwujemy dodawanie/zmianę <source>/<video>
      const mm = new MutationObserver(muts => {
        for (const m of muts) {
          const nodes = Array.from(m.addedNodes || []);
          for (const n of nodes) rewriteSources(n);
          if (m.type === 'attributes' && (m.target.tagName === 'SOURCE' || m.target.tagName === 'VIDEO') && m.attributeName === 'src') {
            rewriteNodeSrc(m.target);
          }
        }
      });
      mm.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

      function rewriteSources(root) {
        if (!root || !CDN_HOST) return;
        if (root.tagName === 'SOURCE' || root.tagName === 'VIDEO') rewriteNodeSrc(root);
        root.querySelectorAll?.('source, video').forEach(rewriteNodeSrc);
      }
      function rewriteNodeSrc(el) {
        try {
          const src = el.getAttribute('src');
          if (!src) return;
          const mapped = toCDN(src);
          if (mapped && mapped !== src) el.setAttribute('src', mapped);
        } catch(e){}
      }

      /* ===========================================
       * 2) Prefetch następnego slajdu (JIT, lekki)
       * =========================================== */
      function slideSelector() {
        return document.querySelectorAll('.slide, .webyx-section');
      }
      function getNextSlide(el) {
        let p = el.nextElementSibling;
        while (p && !(p.classList?.contains('slide') || p.classList?.contains('webyx-section'))) {
          p = p.nextElementSibling;
        }
        return p || null;
      }
      function prefetchSlide(slide) {
        if (!slide || slide.__tt_prefetched) return;
        const v = slide.querySelector?.('video');
        if (v) {
          v.setAttribute('preload', 'metadata');
        }
        slide.__tt_prefetched = true;
      }

      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const next = getNextSlide(e.target);
            if (next) prefetchSlide(next);
          }
        });
      }, { root: null, rootMargin: '150% 0px 150% 0px', threshold: 0.01 });

      const bootPrefetch = () => slideSelector().forEach(s => io.observe(s));
      // if (document.readyState === 'loading') {
      //   document.addEventListener('DOMContentLoaded', bootPrefetch, { once: true });
      // } else {
      //   bootPrefetch();
      // }

      /* ======================================================
       * 3) iOS: unmute na WYBORZE JĘZYKA (tak jak Android)
       * ====================================================== */
      const isIOS = () => /iP(hone|ad|od)/i.test(navigator.userAgent) ||
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      function unlockAudioFromLangChoiceOnce() {
        if (!isIOS()) return;
        let unlocked = false;
        const handler = (ev) => {
          const t = ev.target.closest?.('[data-lang], .lang-option, .language-option, .lang-flag, [data-translate-lang]');
          if (!t) return;
          if (unlocked) return;
          unlocked = true;

          const vids = document.querySelectorAll('video');
          vids.forEach(v => {
            try {
              v.muted = false;
              const p = v.play();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch(e){}
          });

          document.removeEventListener('click', handler, true);
        };
        document.addEventListener('click', handler, true);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', unlockAudioFromLangChoiceOnce, { once: true });
      } else {
        unlockAudioFromLangChoiceOnce();
      }

    })();

    document.addEventListener('DOMContentLoaded', () => {

        // Guard for undefined WordPress objects in standalone mode
        if (typeof window.ajax_object === 'undefined') {
            console.warn('`ajax_object` is not defined. Using mock data for standalone development.');
            window.ajax_object = {
                ajax_url: '#', // Prevent actual network requests
                nonce: '0a1b2c3d4e'
            };
        }

        if (typeof window.TingTongData === 'undefined') {
            console.warn('`TingTongData` is not defined. Using mock data for standalone development.');
            window.TingTongData = {
                isLoggedIn: false, // Start as logged out
                slides: [
                    {
                        'id': 'slide-001',
                        'likeId': '1',
                        'user': 'Paweł Polutek',
                        'description': 'To jest dynamicznie załadowany opis dla pierwszego slajdu. Działa!',
                        'mp4Url': 'https://cdn.pixabay.com/video/2024/08/16/226795_large.mp4',
                        'hlsUrl': null,
                        'poster': '',
                        'avatar': 'https://i.pravatar.cc/100?u=pawel',
                        'access': 'public',
                        'initialLikes': 567,
                        'isLiked': false,
                        'initialComments': 567
                    },
                    {
                        'id': 'slide-002',
                        'likeId': '2',
                        'user': 'Web Dev',
                        'description': 'Kolejny slajd, kolejne wideo. #efficiency',
                        'mp4Url': 'https://cdn.pixabay.com/video/2023/02/16/150957-799711743_large.mp4',
                        'hlsUrl': null,
                        'poster': '',
                        'avatar': 'https://i.pravatar.cc/100?u=webdev',
                        'access': 'public',
                        'initialLikes': 1245,
                        'isLiked': false,
                        'initialComments': 1245
                    },
                    {
                        'id': 'slide-003',
                        'likeId': '3',
                        'user': 'Tajemniczy Tester',
                        'description': 'Ten slajd jest tajny! 🤫',
                        'mp4Url': 'https://cdn.pixabay.com/video/2022/07/24/125314-733046618_tiny.mp4',
                        'hlsUrl': null,
                        'poster': '',
                        'avatar': 'https://i.pravatar.cc/100?u=tester',
                        'access': 'secret',
                        'initialLikes': 2,
                        'isLiked': false,
                        'initialComments': 2
                    }
                ]
            };
        }

        /**
         * ==========================================================================
         * 1. CONFIGURATION & APP DATA
         * ==========================================================================
         */
        const Config = {
          USE_HLS: true,
          PREFETCH_NEIGHBORS: true,
          PREFETCH_MARGIN: '150%',
          UNLOAD_FAR_SLIDES: true,
          FAR_DISTANCE: 2,
          LOW_DATA_MODE: false,
          RETRY_MAX_ATTEMPTS: 2,
          RETRY_BACKOFF_MS: 800,
          METRICS_ENDPOINT: '/api/tt-metrics',
          DEBUG_PANEL: true,
          GESTURE_GRACE_PERIOD_MS: 2000,
          LQIP_POSTER: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGIctGhgoMSA+PIxCSkdHTFROU2A3NkVJQkpbY2P/2wBDAQYGBgoJEQoSDxAHExQXHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAAoABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAAAAAAAAAAABAhEDBCESMUFRYnH/xAAaAQADAQEBAQAAAAAAAAAAAAAAAQIDBAUG/8QAHREAAgICAwEBAAAAAAAAAAAAAAECEQMhEjFBYf/a.AABEIAKAAYQMBIgACEQEDEQA/AOgY2XQk9RLbl+nEdI9Tae4grQYdQl5+Lq+wMv04jo9W45pTDl30y9U2nuJpDDy7aZeobT3EFaDBzH6cvVtp7iaQYOY/Tl6ttPcQVcDBzH6cvVtp7iAtgYOY/Tl6ttPcQFoMHGfpz9W2nuIC2Bg4z9Ofq209xAWgwcZ+nP1ba+4gLgYOM/Tn6ttPcQFoMHGfpz9W2nuIC0GDjP05+re09xAWgwcZ+nL1ba+4gLpL2DCPxZeqbT3EFaDBxH6cvVtp7iCtBg4j9OXq209xBWgwcR+nL1ba+4grQYOY/Tl6ttPcQVcDBzH6cvVtp7iAtgYOY/Tl6ttPcQFoMHGfpz9W2nuIC0GDjP05+re09xAWgwcZ+nL1ba+4gukvYMI/Fl6ptPcQVoMHGfpz9W2nuICtBg4j9OXq209xBWgwcR+nL1ba+4grQYOY/Tl6ttPcQVsDBzH6cvVtp7iAtgYOM/Tl6ttPcQFoMHGfpz9W2nuIC0GDjP05+re09xAWgwcZ+nL1ba+4gukvYMI/Fl6ptPcQVoMGHkP05eqbT3EFaDBh5D9OXqm09xBWgweQ/Tl6ptPcQVcDB5D9OXq209xBWwMHkP05erbT3EBaDB5D9OXq209xAWgweR+nP1bae4gLpP//Z',
          HLS: {
            abrEnabled: true,
            capLevelToPlayerSize: true,
            startLevel: -1,
            abrEwmaFastLive: true,
            maxAutoLevelCapping: null
          },
          TRANSLATIONS: {
            pl: { loggedOutText: "Nie masz psychy się zalogować", loggedInText: 'Ting Tong', loginSuccess: "Zalogowano pomyślnie!", loginFailed: "Logowanie nie powiodło się. Spróbuj ponownie.", accountHeaderText: 'Konto', menuAriaLabel: 'Menu', subscribeAriaLabel: 'subskrajbować', shareTitle: 'Udostępnij', shareAriaLabel: 'Udostępnij', shareText: 'Szeruj', infoTitle: 'OCB?!', infoAriaLabel: 'OCB?!', infoText: 'OCB?!', tipTitle: 'Napiwek', tipAriaLabel: 'Napiwek', tipText: 'Napiwek', languageAriaLabel: 'Zmień język', languageText: 'PL', subscribeAlert: 'Zaloguj się, aby subskrajbować.', likeAlert: 'Zaloguj się, aby lajkować.', notificationAlert: 'Zaloguj się i bądź na bieżąco.', menuAccessAlert: 'Zaloguj się, aby uzyskać dostęp do menu.', logoutSuccess: 'Zostałeś wylogowany.', likeError: 'Błąd komunikacji z serwerem.', secretTitle: 'Ściśle Tajne', secretSubtitle: 'Zaloguj się, aby odblokować', infoModalTitle: 'OCB?!', infoModalBodyP1: 'Lorem ipsum dolor sit amet...', infoModalBodyP2: 'Ut in nulla enim...', infoModalBodyTip: 'Podoba Ci się? Zostaw napiwek...', infoModalBodyP3: 'Donec id elit non mi porta...', closeAccountAriaLabel: 'Zamknij panel konta', closeInfoAriaLabel: 'Zamknij informacje', accountMenuButton: 'Konto', logoutLink: 'Wyloguj', profileTab: 'Profil', passwordTab: 'Hasło', deleteTab: 'Usuń konto', loggedInState: 'Zalogowany', loggedOutState: 'Gość', linkCopied: 'Link skopiowany do schowka!', likeAriaLabel: 'Polub', notificationAriaLabel: 'Powiadomienia', commentsAriaLabel: 'Komentarze', commentsModalTitle: 'Komentarze', closeCommentsAriaLabel: 'Zamknij komentarze', likeAriaLabelWithCount: 'Polub. Aktualna liczba polubień: {count}', unlikeAriaLabelWithCount: 'Cofnij polubienie. Aktualna liczba polubień: {count}', notificationsTitle: 'Powiadomienia', closeNotificationsAriaLabel: 'Zamknij powiadomienia', notificationsEmpty: 'Wszystko na bieżąco!', notif1Preview: 'Nowa wiadomość od Admina', notif1Time: '2 min temu', notif1Full: 'Cześć! Chcieliśmy tylko dać znać, że nowa wersja aplikacji jest już dostępna. Sprawdź nowe funkcje w panelu konta!', notif2Preview: 'Twój profil został zaktualizowany', notif2Time: '10 min temu', notif2Full: 'Twoje zmiany w profilu zostały pomyślnie zapisane. Możesz je przejrzeć w dowolnym momencie, klikając w swój awatar.', notif3Preview: 'Specjalna oferta czeka na Ciebie!', notif3Time: '1 godz. temu', notif3Full: 'Nie przegap! Przygotowaliśmy dla Ciebie specjalną letnią promocję. Zgarnij dodatkowe bonusy już teraz. Oferta ograniczona czasowo.',
            ocb_line1: "Ting Tong to aplikacja napiwkowa umożliwiająca wspieranie i rozwój mojej twórczosci.",
            ocb_line2: "Każda złotówka przekłada się bezpośrednio na nowe filmy i pomysły.",
            ocb_line3: "Za kulisami czeka strefa Ściśle Tajne – specjalne miejsce stworzone dla tych, którzy  pomagają mi iść dalej i tworzyć więcej. To Wasze wsparcie umożliwia każdą nową produkcję, a każda złotówka przekłada się rozwój wydarzeń.",
            ocb_line4: "Podoba Ci się na Ting Tongu? Zostaw napiwek, dołącz do społeczności i stań się częścią tej historii!",
             },
            en: { loggedOutText: "You don't have the guts to log in", loggedInText: 'You are logged in', loginSuccess: "Logged in successfully!", loginFailed: "Login failed. Please try again.", accountHeaderText: 'Account', menuAriaLabel: 'Menu', subscribeAriaLabel: 'Subscribe', shareTitle: 'Share', shareAriaLabel: 'Share', shareText: 'Share', infoTitle: 'WTF?!', infoAriaLabel: 'WTF?!', infoText: 'WTF?!', tipTitle: 'Tip', tipAriaLabel: 'Tip', tipText: 'Tip', languageAriaLabel: 'Change language', languageText: 'EN', subscribeAlert: 'Log in to subscribe.', likeAlert: 'Log in to like.', notificationAlert: 'Log in to stay up to date.', menuAccessAlert: 'Log in to access the menu.', logoutSuccess: 'You have been logged out.', likeError: 'Server communication error.', secretTitle: 'Top Secret', secretSubtitle: 'Log in to unlock', infoModalTitle: 'WTF?!', infoModalBodyP1: 'Lorem ipsum dolor sit amet...', infoModalBodyP2: 'Ut in nulla enim...', infoModalBodyTip: 'Enjoying the app? Leave a tip...', infoModalBodyP3: 'Donec id elit non mi porta...', closeAccountAriaLabel: 'Close account panel', closeInfoAriaLabel: 'Close information', accountMenuButton: 'Account', logoutLink: 'Logout', profileTab: 'Profile', passwordTab: 'Password', deleteTab: 'Delete account', loggedInState: 'Logged In', loggedOutState: 'Guest', linkCopied: 'Link copied to clipboard!', likeAriaLabel: 'Like', notificationAriaLabel: 'Notifications', commentsAriaLabel: 'Comments', commentsModalTitle: 'Comments', closeCommentsAriaLabel: 'Close comments', likeAriaLabelWithCount: 'Like. Current likes: {count}', unlikeAriaLabelWithCount: 'Unlike. Current likes: {count}', notificationsTitle: 'Notifications', closeNotificationsAriaLabel: 'Close notifications', notificationsEmpty: 'You are all caught up!', notif1Preview: 'New message from Admin', notif1Time: '2 mins ago', notif1Full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!', notif2Preview: 'Your profile has been updated', notif2Time: '10 mins ago', notif2Full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.', notif3Preview: 'A special offer is waiting for you!', notif3Time: '1 hour ago', notif3Full: 'Don\'t miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.',
            ocb_line1: "Ting Tong is a tipping app that allows you to support and grow my creative work.",
            ocb_line2: "Every contribution directly turns into new films and ideas.",
            ocb_line3: "Behind the scenes, there’s the Top Secret zone – a special space created for those who help me move forward and create even more. Your support makes every new production possible, and each tip drives the story further.",
            ocb_line4: "Do you like Ting Tong? Leave a tip, join the community, and become part of this story!",
            }
          }
        };

        const slidesData = (typeof TingTongData !== 'undefined' && Array.isArray(TingTongData.slides)) ? TingTongData.slides : [];
        slidesData.forEach(s => { s.likeId = String(s.likeId); });


        /**
         * ==========================================================================
         * 2. STATE MANAGEMENT
         * ==========================================================================
         */
        const State = (function() {
            const _state = {
                isUserLoggedIn: (typeof TingTongData !== 'undefined' && TingTongData.isLoggedIn) || false,
                currentLang: 'pl',
                currentSlideIndex: 0,
                isAutoplayBlocked: false,
                isDraggingProgress: false,
                lastFocusedElement: null,
                lastUserGestureTimestamp: 0,
                activeVideoSession: 0,
            };

            return {
                get: (key) => _state[key],
                set: (key, value) => { _state[key] = value; },
                getState: () => ({ ..._state }),
            };
        })();

        /**
         * ==========================================================================
         * 3. UTILITIES
         * ==========================================================================
         */
        const Utils = (function() {
            return {
                isDesktop: () => {
                    // A simple check for non-mobile devices.
                    // This is not foolproof, but sufficient for this task.
                    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
                    return !/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
                },
                getTranslation: (key) => (Config.TRANSLATIONS[State.get('currentLang')]?.[key]) || key,
                formatCount: (count) => {
                    count = Number(count) || 0;
                    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
                    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
                    return String(count);
                },
                fixProtocol: (url) => {
                    if (!url) return url;
                    try {
                        if (window.location.protocol === 'https:') {
                            const urlObj = new URL(url, window.location.origin);
                            if (urlObj.protocol === 'http:') {
                                urlObj.protocol = 'https:';
                                return urlObj.toString();
                            }
                        }
                    } catch (e) { /* Invalid URL, return as is */ }
                    return url;
                },
                toRelativeIfSameOrigin: (url) => {
                    if (!url) return url;
                    try {
                        const urlObj = new URL(url, window.location.origin);
                        if (urlObj.origin === window.location.origin) {
                            return urlObj.pathname + urlObj.search + urlObj.hash;
                        }
                    } catch (e) { /* Invalid URL, return as is */ }
                    return url;
                },
                vibrateTry: (ms = 35) => {
                    if (navigator.vibrate) {
                        try { navigator.vibrate(ms); } catch(e) {}
                    }
                },
                recordUserGesture: () => {
                    State.set('lastUserGestureTimestamp', Date.now());
                },
                setAppHeightVar: () => {
                  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
                },
                debounce: function(func, delay) {
                    let timeout;
                    return function(...args) {
                        const context = this;
                        clearTimeout(timeout);
                        timeout = setTimeout(() => func.apply(context, args), delay);
                    };
                },
                throttle: function(func, limit) {
                    let inThrottle;
                    return function(...args) {
                        const context = this;
                        if (!inThrottle) {
                            func.apply(context, args);
                            inThrottle = true;
                            setTimeout(() => inThrottle = false, limit);
                        }
                    };
                }
            };
        })();

        /**
         * ==========================================================================
         * 4. API MODULE
         * ==========================================================================
         */
        const API = (function() {
            async function _request(action, data = {}) {
                try {
                    const body = new URLSearchParams({ action, nonce: ajax_object.nonce, ...data });
                    const response = await fetch(ajax_object.ajax_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                        credentials: 'same-origin',
                        body
                    });
                    if (!response.ok) throw new Error(`Server responded with ${response.status}`);
                    const json = await response.json();
                    if (json.new_nonce) ajax_object.nonce = json.new_nonce;
                    return json;
                } catch (error) {
                    console.error(`API Client Error for action "${action}":`, error);
                    return { success: false, data: { message: error.message } };
                }
            }

            return {
                login: (data) => _request('tt_ajax_login', data),
                logout: () => _request('tt_ajax_logout'),
                toggleLike: (postId) => _request('toggle_like', { post_id: postId }),
                refreshNonce: async () => {
                    const json = await _request('tt_refresh_nonce');
                    if (json.success && json.nonce) ajax_object.nonce = json.nonce;
                    else console.error('Failed to refresh nonce.', json);
                },
                fetchSlidesData: () => _request('tt_get_slides_data_ajax'),
            };
        })();

        /**
         * ==========================================================================
         * 5. UI MODULE
         * ==========================================================================
         */
        const UI = (function() {
            const DOM = {
                container: document.getElementById('webyx-container'),
                wrapper: document.querySelector('.swiper-wrapper'),
                template: document.getElementById('slide-template'),
                preloader: document.getElementById('preloader'),
                alertBox: document.getElementById('alertBox'),
                alertText: document.getElementById('alertText'),
                infoModal: document.getElementById('infoModal'),
                commentsModal: document.getElementById('commentsModal'),
                accountModal: document.getElementById('accountModal'),
                notificationPopup: document.getElementById('notificationPopup'),
            };
            let alertTimeout;

            function showAlert(message, isError = false) {
                if (!DOM.alertBox || !DOM.alertText) return;
                clearTimeout(alertTimeout);
                DOM.alertBox.style.animation = 'none';
                requestAnimationFrame(() => {
                    DOM.alertBox.style.animation = '';
                    DOM.alertText.textContent = message;
                    DOM.alertBox.style.backgroundColor = isError ? 'var(--accent-color)' : 'rgba(0, 0, 0, 0.85)';
                    DOM.alertBox.classList.add('visible');
                });
                alertTimeout = setTimeout(() => DOM.alertBox.classList.remove('visible'), 3000);
            }

            function getFocusable(node) {
                if (!node) return [];
                return Array.from(node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
            }

            function trapFocus(modal) {
                const focusable = getFocusable(modal);
                if (focusable.length === 0) return () => {};
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                const handleKeyDown = (e) => {
                    if (e.key !== 'Tab') return;
                    if (e.shiftKey) {
                        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
                    } else {
                        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
                    }
                };
                modal.addEventListener('keydown', handleKeyDown);
                return () => modal.removeEventListener('keydown', handleKeyDown);
            }

            function openModal(modal) {
                State.set('lastFocusedElement', document.activeElement);
                DOM.container.setAttribute('aria-hidden', 'true');
                modal.classList.add('visible');
                modal.setAttribute('aria-hidden', 'false');
                const focusable = getFocusable(modal);
                (focusable.length > 0 ? focusable[0] : modal.querySelector('.modal-content'))?.focus();
                modal._focusTrapDispose = trapFocus(modal);
            }

            function closeModal(modal) {
                modal.classList.remove('visible');
                modal.setAttribute('aria-hidden', 'true');
                if (modal._focusTrapDispose) { modal._focusTrapDispose(); delete modal._focusTrapDispose; }
                DOM.container.removeAttribute('aria-hidden');
                State.get('lastFocusedElement')?.focus();
            }

            function updateLikeButtonState(likeButton, liked, count) {
                if (!likeButton) return;
                const likeCountEl = likeButton.querySelector('.like-count');
                likeButton.classList.toggle('active', liked);
                likeButton.setAttribute('aria-pressed', String(liked));
                if (likeCountEl) {
                    likeCountEl.textContent = Utils.formatCount(count);
                    likeCountEl.dataset.rawCount = String(count);
                }
                const translationKey = liked ? 'unlikeAriaLabelWithCount' : 'likeAriaLabelWithCount';
                const label = Utils.getTranslation(translationKey).replace('{count}', Utils.formatCount(count));
                likeButton.setAttribute('aria-label', label);
            }

            function applyLikeStateToDom(likeId, liked, count) {
                document.querySelectorAll(`.like-button[data-like-id="${likeId}"]`).forEach(btn => updateLikeButtonState(btn, liked, count));
            }

            function updateUIForLoginState() {
                const isLoggedIn = State.get('isUserLoggedIn');

                const topbar = document.querySelector('.topbar');
                if (topbar) {
                    topbar.querySelector('.central-text-wrapper').classList.toggle('with-arrow', !isLoggedIn);
                    topbar.classList.remove('login-panel-active');
                    topbar.querySelector('.topbar-text').textContent = isLoggedIn ? Utils.getTranslation('loggedInText') : Utils.getTranslation('loggedOutText');
                }
                document.querySelector('.login-panel')?.classList.remove('active');
                document.querySelector('.logged-in-menu')?.classList.remove('active');

                document.querySelectorAll('.swiper-slide').forEach((section) => {
                    const sim = section.querySelector('.tiktok-symulacja');
                    sim.classList.toggle('is-logged-in', isLoggedIn);
                    const isSecret = sim.dataset.access === 'secret';
                    const showSecretOverlay = isSecret && !isLoggedIn;

                    section.querySelector('.secret-overlay').classList.toggle('visible', showSecretOverlay);
                    section.querySelector('.videoPlayer').classList.toggle('secret-active', showSecretOverlay);

                    const likeBtn = section.querySelector('.like-button');
                    if (likeBtn) {
                        const slide = slidesData.find(s => String(s.likeId) === String(likeBtn.dataset.likeId));
                        if (slide) {
                            updateLikeButtonState(likeBtn, !!(slide.isLiked && isLoggedIn), Number(slide.initialLikes || 0));
                        }
                    }
                });
            }

            function updateTranslations() {
                const lang = State.get('currentLang');
                document.documentElement.lang = lang;
                document.querySelectorAll('[data-translate-key]').forEach(el => el.textContent = Utils.getTranslation(el.dataset.translateKey));
                document.querySelectorAll('[data-translate-aria-label]').forEach(el => el.setAttribute('aria-label', Utils.getTranslation(el.dataset.translateAriaLabel)));
                document.querySelectorAll('[data-translate-title]').forEach(el => el.setAttribute('title', Utils.getTranslation(el.dataset.translateTitle)));
                updateUIForLoginState();
            }

            function createSlideElement(slideData, index) {
                const slideFragment = DOM.template.content.cloneNode(true);
                const section = slideFragment.querySelector('.swiper-slide');
                section.dataset.index = index;
                section.dataset.slideId = slideData.id;

                const loginPanel = section.querySelector('.login-panel');
                const renderedForm = document.getElementById('um-login-render-container');
                if (loginPanel && renderedForm) {
                    loginPanel.innerHTML = renderedForm.innerHTML;
                    const form = loginPanel.querySelector('.login-form');
                    if (form) {
                        form.querySelector('label[for="user_login"]')?.remove();
                        form.querySelector('#user_login')?.setAttribute('placeholder', 'Login');
                        form.querySelector('label[for="user_pass"]')?.remove();
                        form.querySelector('#user_pass')?.setAttribute('placeholder', 'Hasło');
                        const submitButton = form.querySelector('#wp-submit');
                        if (submitButton) submitButton.value = 'ENTER';
                    }
                }

                section.querySelector('.tiktok-symulacja').dataset.access = slideData.access;
                section.querySelector('.videoPlayer').poster = slideData.poster || Config.LQIP_POSTER;
                section.querySelector('.profileButton img').src = slideData.avatar;
                section.querySelector('.text-user').textContent = slideData.user;
                section.querySelector('.text-description').textContent = slideData.description;

                const likeBtn = section.querySelector('.like-button');
                likeBtn.dataset.likeId = slideData.likeId;
                updateLikeButtonState(likeBtn, slideData.isLiked, slideData.initialLikes);

                const progressSlider = section.querySelector('.video-progress');
                VideoManager.initProgressBar(progressSlider, section.querySelector('.videoPlayer'));

                return section;
            }

            function renderSlides() {
                DOM.container.innerHTML = '';
                if (slidesData.length === 0) return;

                const addClone = (slideData, index, isFirst) => {
                    const clone = createSlideElement(slideData, index);
                    clone.dataset.isClone = 'true';
                    DOM.container.appendChild(clone);
                };

                addClone(slidesData[slidesData.length - 1], slidesData.length - 1, false);
                slidesData.forEach((data, index) => DOM.container.appendChild(createSlideElement(data, index)));
                addClone(slidesData[0], 0, true);
            }

            return { DOM, showAlert, openModal, closeModal, updateUIForLoginState, updateTranslations, applyLikeStateToDom, renderSlides };
        })();


        /**
         * ==========================================================================
         * 6. VIDEO MANAGER
         * ==========================================================================
         */
        const VideoManager = (function() {
            let hlsPromise = null;
            const hlsInstances = new Map();
            const attachedSet = new WeakSet();
            const retryCounts = new WeakMap();
            const hlsRecoverCounts = new Map();
            let playObserver, lazyObserver;

            window.TTStats = window.TTStats || { videoErrors: 0, videoRetries: 0, hlsErrors: 0, hlsRecovered: 0, ttfpSamples: 0, ttfpTotalMs: 0 };

            function _loadHlsLibrary() {
                if (window.Hls) return Promise.resolve();
                if (!hlsPromise) {
                    hlsPromise = import('https://cdn.jsdelivr.net/npm/hls.js@1.5.14/dist/hls.min.js')
                        .catch(err => {
                            console.error("Failed to load HLS.js", err);
                            hlsPromise = null;
                            throw err;
                        });
                }
                return hlsPromise;
            }

            function _guardedPlay(videoEl) {
                if ((Date.now() - State.get('lastUserGestureTimestamp')) < Config.GESTURE_GRACE_PERIOD_MS) {
                    const playPromise = videoEl.play();
                    if (playPromise) {
                        playPromise.catch(error => {
                            if (error.name === 'NotAllowedError') {
                                console.warn("Autoplay was blocked by the browser.", error);
                                State.set('isAutoplayBlocked', true);
                            }
                        });
                    }
                }
            }

            function _attachSrc(sectionEl) {
                const video = sectionEl.querySelector('.videoPlayer');
                if (!video || attachedSet.has(video)) return;
                const slideId = sectionEl.dataset.slideId;
                const slideData = slidesData.find(s => s.id === slideId);

                const canAttach = slideData && !(slideData.access === 'secret' && !State.get('isUserLoggedIn'));
                if (!canAttach) return;

                const setMp4Source = (mp4Url) => {
                    if (!mp4Url) return;
                    const finalUrl = Utils.toRelativeIfSameOrigin(Utils.fixProtocol(mp4Url));
                    const sourceEl = video.querySelector('source');
                    if (sourceEl) { sourceEl.src = finalUrl; sourceEl.type = 'video/mp4'; }
                    video.load();
                };

                if (Config.USE_HLS && slideData.hlsUrl) {
                    const finalHlsUrl = Utils.toRelativeIfSameOrigin(Utils.fixProtocol(slideData.hlsUrl));
                    if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        const sourceEl = video.querySelector('source');
                        if(sourceEl) { sourceEl.src = finalHlsUrl; sourceEl.type = 'application/vnd.apple.mpegurl'; }
                        video.load();
                    } else {
                        _loadHlsLibrary().then(() => {
                            if (window.Hls?.isSupported()) {
                                if (hlsInstances.has(slideId)) hlsInstances.get(slideId).destroy();
                                const hls = new window.Hls(Config.HLS);
                                hls.loadSource(finalHlsUrl);
                                hls.attachMedia(video);
                                hls.on(window.Hls.Events.ERROR, (event, data) => {
                                    if (data.fatal) {
                                       hls.destroy(); hlsInstances.delete(slideId); setMp4Source(slideData.mp4Url);
                                    }
                                });
                                hlsInstances.set(slideId, hls);
                            } else {
                                setMp4Source(slideData.mp4Url);
                            }
                        }).catch(() => setMp4Source(slideData.mp4Url));
                    }
                } else {
                    setMp4Source(slideData.mp4Url);
                }

                attachedSet.add(video);
            }

            function _detachSrc(sectionEl) {
                const video = sectionEl.querySelector('.videoPlayer');
                if (!video) return;
                try { video.pause(); } catch(e) {}
                const slideId = sectionEl.dataset.slideId;
                if (slideId && hlsInstances.has(slideId)) {
                  try { hlsInstances.get(slideId).destroy(); } catch(e){}
                  hlsInstances.delete(slideId);
                }
                const sourceEl = video.querySelector('source');
                if (sourceEl) { sourceEl.removeAttribute('src'); }
                video.removeAttribute('src');
                video.load();
                attachedSet.delete(video);
            }

            function _startProgressUpdates(video) {
                _stopProgressUpdates(video);
                const session = State.get('activeVideoSession');
                const updateFn = () => {
                    if (session !== State.get('activeVideoSession') || !video.duration) return;
                    _updateProgressUI(video);
                    if (!video.paused) {
                        video.rAF_id = requestAnimationFrame(updateFn);
                    }
                };
                updateFn();
            }

            function _stopProgressUpdates(video) {
                if (video.rAF_id) cancelAnimationFrame(video.rAF_id);
            }

            function _updateProgressUI(video) {
                if (State.get('isDraggingProgress') || !video || !video.duration) return;
                const section = video.closest('.webyx-section');
                if (!section) return;
                const percent = (video.currentTime / video.duration) * 100;
                section.querySelector('.progress-line').style.width = `${percent}%`;
                section.querySelector('.progress-dot').style.left = `${percent}%`;
                section.querySelector('.video-progress').setAttribute('aria-valuenow', String(Math.round(percent)));
            };

            function _onActiveSlideChanged(newIndex, oldIndex = -1) {
                State.set('activeVideoSession', State.get('activeVideoSession') + 1);

                const allSections = UI.DOM.container.querySelectorAll('.webyx-section:not([data-is-clone="true"])');

                if (oldIndex > -1 && oldIndex < allSections.length) {
                    const oldSection = allSections[oldIndex];
                    const oldVideo = oldSection.querySelector('.videoPlayer');
                    if (oldVideo) { oldVideo.pause(); _stopProgressUpdates(oldVideo); }
                    oldSection.querySelector('.pause-icon')?.classList.remove('visible');
                    const progressLine = oldSection.querySelector('.progress-line');
                    const progressDot = oldSection.querySelector('.progress-dot');
                    if(progressLine && progressDot) {
                        progressLine.style.width = '0%';
                        progressDot.style.left = '0%';
                    }
                }

                if (newIndex < allSections.length) {
                    const newSection = allSections[newIndex];
                    const newVideo = newSection.querySelector('.videoPlayer');
                    const isSecret = newSection.querySelector('.tiktok-symulacja').dataset.access === 'secret';

                    if (!(isSecret && !State.get('isUserLoggedIn')) && !State.get('isAutoplayBlocked')) {
                        _guardedPlay(newVideo);
                    }
                    _startProgressUpdates(newVideo);
                }
            }

            function _initLazyObserver() {
                if (lazyObserver) return;
                lazyObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const section = entry.target.closest('.webyx-section');
                        if (!section) return;
                        if (entry.isIntersecting) {
                            _attachSrc(section);
                        } else if (Config.UNLOAD_FAR_SLIDES) {
                            const index = parseInt(section.dataset.index, 10);
                            const distance = Math.abs(index - State.get('currentSlideIndex'));
                            if (distance > Config.FAR_DISTANCE) _detachSrc(section);
                        }
                    });
                }, { root: UI.DOM.container, rootMargin: Config.PREFETCH_MARGIN, threshold: 0.01 });
                UI.DOM.container.querySelectorAll('.webyx-section:not([data-is-clone="true"])').forEach(sec => lazyObserver.observe(sec));
            }

            return {
                init: () => {
                    _initLazyObserver();
                    playObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const newIndex = parseInt(entry.target.dataset.index, 10);
                                if (newIndex !== State.get('currentSlideIndex')) {
                                    const oldIndex = State.get('currentSlideIndex');
                                    State.set('currentSlideIndex', newIndex);
                                    _onActiveSlideChanged(newIndex, oldIndex);
                                    UI.updateUIForLoginState();
                                }
                            }
                        });
                    }, { root: UI.DOM.container, threshold: 0.75 });

                    UI.DOM.container.querySelectorAll('.webyx-section:not([data-is-clone="true"])').forEach(section => playObserver.observe(section));
                },
                initProgressBar: (progressEl, videoEl) => {
                    if (!progressEl || !videoEl) return;
                    progressEl.classList.add('skeleton');
                    videoEl.addEventListener('loadedmetadata', () => progressEl.classList.remove('skeleton'), { once: true });

                    let pointerId = null;
                    const seek = (e) => {
                        const rect = progressEl.getBoundingClientRect();
                        const x = ('clientX' in e ? e.clientX : (e.touches?.[0]?.clientX || 0));
                        const percent = ((x - rect.left) / rect.width) * 100;
                        const clamped = Math.max(0, Math.min(100, percent));
                        if (videoEl.duration) videoEl.currentTime = (clamped / 100) * videoEl.duration;
                        _updateProgressUI(videoEl);
                    };

                    progressEl.addEventListener('pointerdown', (e) => {
                        if (pointerId !== null) return;
                        pointerId = e.pointerId;
                        State.set('isDraggingProgress', true);
                        progressEl.classList.add('dragging');
                        progressEl.setPointerCapture(pointerId);
                        seek(e);
                    });

                    progressEl.addEventListener('pointermove', (e) => {
                        if (e.pointerId !== pointerId) return;
                        seek(e);
                    });

                    const endDrag = (e) => {
                        if (e.pointerId !== pointerId) return;
                        pointerId = null;
                        State.set('isDraggingProgress', false);
                        progressEl.classList.remove('dragging');
                        _startProgressUpdates(videoEl);
                    };
                    progressEl.addEventListener('pointerup', endDrag);
                    progressEl.addEventListener('pointercancel', endDrag);

                    progressEl.addEventListener('keydown', (e) => {
                        if (!videoEl.duration) return;
                        const step = videoEl.duration * 0.05;
                        switch (e.key) {
                            case 'ArrowLeft': videoEl.currentTime -= step; break;
                            case 'ArrowRight': videoEl.currentTime += step; break;
                            default: return;
                        }
                        e.preventDefault();
                    });
                },
                updatePlaybackForLoginChange: (section, isSecret) => {
                    const video = section.querySelector('.videoPlayer');
                    const hasSrc = video.querySelector('source')?.getAttribute('src');

                    if (!isSecret && !hasSrc) _attachSrc(section);

                    if (isSecret) {
                        video.pause();
                        _stopProgressUpdates(video);
                        video.currentTime = 0;
                        _updateProgressUI(video);
                    } else if (video.paused && document.body.classList.contains('loaded') && !State.get('isDraggingProgress') && !State.get('isAutoplayBlocked')) {
                       _guardedPlay(video);
                    }
                },
                handleVideoClick: (video) => {
                    if (State.get('isDraggingProgress')) return;
                    const pauseIcon = video.closest('.webyx-section')?.querySelector('.pause-icon');
                    if (video.paused) {
                        _guardedPlay(video);
                        pauseIcon?.classList.remove('visible');
                    } else {
                        video.pause();
                        pauseIcon?.classList.add('visible');
                    }
                },
            };
        })();

        /**
         * ==========================================================================
         * 7. EVENT HANDLERS & NOTIFICATIONS
         * ==========================================================================
         */
        const Handlers = (function() {
             // ... All handlers remain the same as they are event-driven and not dependent on scroll implementation
            function handleNotificationClick(event) {
                const item = event.target.closest('.notification-item');
                if (!item) return;

                item.classList.toggle('expanded');
                item.setAttribute('aria-expanded', item.classList.contains('expanded'));

                if (item.classList.contains('unread')) {
                    item.classList.remove('unread');
                }
            }

            async function handleLogin(form) {
                const submitButton = form.querySelector('input[type="submit"]');
                submitButton.disabled = true;
                try {
                    const data = Object.fromEntries(new FormData(form).entries());
                    const json = await API.login(data);
                    if (json.success) {
                        State.set('isUserLoggedIn', true);
                        UI.showAlert(Utils.getTranslation('loginSuccess'));
                        await API.refreshNonce();
                        App.fetchAndUpdateSlideData();
                        UI.updateUIForLoginState();
                    } else {
                        UI.showAlert(json.data?.message || Utils.getTranslation('loginFailed'), true);
                    }
                } finally {
                    submitButton.disabled = false;
                }
            }

            async function handleLogout(link) {
                if (link.disabled) return;
                link.disabled = true;
                const json = await API.logout();
                if (json.success) {
                    State.set('isUserLoggedIn', false);
                    UI.showAlert(Utils.getTranslation('logoutSuccess'));
                    slidesData.forEach(slide => slide.isLiked = false);
                    await API.refreshNonce();
                    UI.updateUIForLoginState();
                } else {
                    UI.showAlert(json.data?.message || 'Logout failed.', true);
                }
                link.disabled = false;
            }

            async function handleLikeToggle(button) {
                if (!State.get('isUserLoggedIn')) {
                    Utils.vibrateTry();
                    UI.showAlert(Utils.getTranslation('likeAlert'));
                    return;
                }
                const slideId = button.closest('.swiper-slide')?.dataset.slideId;
                const slideData = slidesData.find(s => s.id === slideId);
                if (!slideData) return;

                const isCurrentlyLiked = !!slideData.isLiked;
                const newLikedState = !isCurrentlyLiked;
                const currentCount = slideData.initialLikes;
                const newCount = newLikedState ? currentCount + 1 : Math.max(0, currentCount - 1);

                slideData.isLiked = newLikedState;
                slideData.initialLikes = newCount;
                UI.applyLikeStateToDom(slideData.likeId, newLikedState, newCount);
                button.disabled = true;

                const json = await API.toggleLike(slideData.likeId);

                if (!json.success) {
                    slideData.isLiked = isCurrentlyLiked;
                    slideData.initialLikes = currentCount;
                    UI.applyLikeStateToDom(slideData.likeId, isCurrentlyLiked, currentCount);
                    UI.showAlert(json.data?.message || Utils.getTranslation('likeError'), true);
                }
                button.disabled = false;
            }

            function handleShare(button) {
                const section = button.closest('.swiper-slide');
                const slideData = slidesData.find(s => s.id === section.dataset.slideId);
                if (navigator.share && slideData) {
                    navigator.share({
                        title: Utils.getTranslation('shareTitle'),
                        text: slideData.description,
                        url: window.location.href,
                    }).catch(err => { if (err.name !== 'AbortError') console.error('Share error:', err); });
                } else {
                    navigator.clipboard.writeText(window.location.href).then(() => UI.showAlert(Utils.getTranslation('linkCopied')));
                }
            }

            return {
                handleNotificationClick,
                mainClickHandler: (e) => {
                    const target = e.target;
                    const actionTarget = target.closest('[data-action]');
                    if (!actionTarget) {
                        if (target.closest('.videoPlayer')) VideoManager.handleVideoClick(target.closest('.videoPlayer'));
                        return;
                    }

                    const action = actionTarget.dataset.action;

                    switch (action) {
                        case 'toggle-like': handleLikeToggle(actionTarget); break;
                        case 'share': handleShare(actionTarget); break;
                        case 'open-comments-modal': UI.openModal(UI.DOM.commentsModal); break;
                        case 'open-info-modal':
                             const infoModalBody = UI.DOM.infoModal.querySelector('#infoModalBody');
                            if (infoModalBody) {
                                const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 40px; height: 40px; margin-bottom: 16px; color: var(--accent-color);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9h4v2h-4v-2zm0 4h4v2h-4v-2zm-2-9.75c0-.41.34-.75.75-.75h2.5c.41 0 .75.34.75.75v3.5h-4v-3.5z"/></svg>';
                                infoModalBody.innerHTML = `
                                    ${icon}
                                    <p style="margin-bottom: 1em;">${Utils.getTranslation('ocb_line1')}</p>
                                    <p style="margin-bottom: 1em;">${Utils.getTranslation('ocb_line2')}</p>
                                    <p style="margin-bottom: 1em;">${Utils.getTranslation('ocb_line3')}</p>
                                    <p><strong>${Utils.getTranslation('ocb_line4')}</strong></p>
                                `;
                            }
                            UI.openModal(UI.DOM.infoModal);
                            break;
                        case 'open-account-modal':
                            document.querySelector('.logged-in-menu').classList.remove('active');
                            AccountPanel.openAccountModal();
                            break;
                        case 'close-account-modal':
                            AccountPanel.closeAccountModal();
                            break;
                        case 'logout': e.preventDefault(); handleLogout(actionTarget); break;
                        case 'toggle-main-menu':
                            if (State.get('isUserLoggedIn')) {
                                document.querySelector('.logged-in-menu').classList.toggle('active');
                            } else {
                                Utils.vibrateTry();
                                UI.showAlert(Utils.getTranslation('menuAccessAlert'));
                            }
                            break;
                        case 'toggle-login-panel':
                            if (!State.get('isUserLoggedIn')) {
                                document.querySelector('.login-panel').classList.toggle('active');
                                document.querySelector('.topbar').classList.toggle('login-panel-active');
                            }
                            break;
                        case 'subscribe':
                            if (!State.get('isUserLoggedIn')) {
                                Utils.vibrateTry(); UI.showAlert(Utils.getTranslation('subscribeAlert'));
                            }
                            break;
                        case 'toggle-notifications':
                             if (State.get('isUserLoggedIn')) {
                                const popup = UI.DOM.notificationPopup;
                                popup.classList.toggle('visible');
                                if(popup.classList.contains('visible')) Notifications.render();
                            } else {
                                Utils.vibrateTry();
                                UI.showAlert(Utils.getTranslation('notificationAlert'));
                            }
                            break;
                        case 'close-notifications':
                            if (UI.DOM.notificationPopup) {
                                UI.DOM.notificationPopup.classList.remove('visible');
                            }
                            break;
                        case 'show-tip-jar': document.querySelector('#bmc-wbtn')?.click(); break;
                    }
                },
                formSubmitHandler: (e) => {
                    const form = e.target.closest('form.login-form');
                    if (form) { e.preventDefault(); handleLogin(form); }
                }
            };
        })();

        // ... Other modules like Notifications and AccountPanel remain largely unchanged ...
        const Notifications = (function() { /* ... */ })();
        const AccountPanel = (function(){ /* ... */ })();

        /**
         * ==========================================================================
         * 9. APP INITIALIZATION
         * ==========================================================================
         */
        const App = (function() {
            let swiper;

            function _initializeGlobalListeners() {
                 // ... same as before
            }

            async function _fetchAndUpdateSlideData() {
                // ... same as before
            }

            function _startApp(selectedLang) {
                State.set('currentLang', selectedLang);
                localStorage.setItem('tt_lang', selectedLang);

                UI.renderSlides();
                UI.updateTranslations();
                VideoManager.init();

                setTimeout(() => {
                    UI.DOM.preloader.classList.add('preloader-hiding');
                    UI.DOM.container.classList.add('ready');
                    UI.DOM.preloader.addEventListener('transitionend', () => UI.DOM.preloader.style.display = 'none', { once: true });
                }, 1000);

                if (slidesData.length > 0) {
                    const viewHeight = window.innerHeight;
                    UI.DOM.container.classList.add('no-transition');
                    UI.DOM.container.scrollTo({ top: viewHeight, behavior: 'auto' });
                    requestAnimationFrame(() => {
                        UI.DOM.container.classList.remove('no-transition');
                        UI.DOM.container.addEventListener('scroll', () => {
                            clearTimeout(window.scrollEndTimeout);
                            window.scrollEndTimeout = setTimeout(() => {
                                const physicalIndex = Math.round(UI.DOM.container.scrollTop / viewHeight);
                                if (physicalIndex === 0) {
                                    UI.DOM.container.classList.add('no-transition');
                                    UI.DOM.container.scrollTop = slidesData.length * viewHeight;
                                    requestAnimationFrame(() => UI.DOM.container.classList.remove('no-transition'));
                                } else if (physicalIndex === slidesData.length + 1) {
                                    UI.DOM.container.classList.add('no-transition');
                                    UI.DOM.container.scrollTop = viewHeight;
                                    requestAnimationFrame(() => UI.DOM.container.classList.remove('no-transition'));
                                }
                            }, 50);
                        }, { passive: true });
                    });
                }
            }

            function _initializePreloader() {
                setTimeout(() => UI.DOM.preloader.classList.add('content-visible'), 500);
                UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(button => {
                    button.addEventListener('click', () => {
                        UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(btn => btn.disabled = true);
                        button.classList.add('is-selected');
                        setTimeout(() => _startApp(button.dataset.lang), 300);
                    }, { once: true });
                });
            }

            function _setInitialConfig() {
                // ... same as before
            }

            return {
                init: () => {
                    _setInitialConfig();
                    _initializeGlobalListeners();
                    AccountPanel.init();
                    _initializePreloader();
                    document.body.classList.add('loaded');
                },
                fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
            };
        })();

        App.init();

        /**
         * ==========================================================================
         * 10. PWA INSTALL PROMPT LOGIC
         * ==========================================================================
         */
        const PWA = (function() { /* ... same as before ... */ })();
        PWA.init();

        const mockLoginToggle = document.getElementById('mock-login-toggle');
        if (mockLoginToggle) { /* ... same as before ... */ }
    });
