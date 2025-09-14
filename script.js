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
                        'user': 'Plyr',
                        'description': 'Big Buck Bunny - MP4',
                        'mp4Url': 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
                        'hlsUrl': '',
                        'poster': 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
                        'avatar': 'https://i.pravatar.cc/100?u=plyr',
                        'access': 'public',
                        'initialLikes': 101,
                        'isLiked': false,
                        'initialComments': 11
                    },
                    {
                        'id': 'slide-002',
                        'likeId': '2',
                        'user': 'HLS.js',
                        'description': 'Apple Advanced HLS Stream',
                        'mp4Url': '',
                        'hlsUrl': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                        'poster': 'https://i.ytimg.com/vi/x36xhzz/maxresdefault.jpg',
                        'avatar': 'https://i.pravatar.cc/100?u=hlsjs',
                        'access': 'public',
                        'initialLikes': 202,
                        'isLiked': false,
                        'initialComments': 22
                    },
                    {
                        'id': 'slide-003',
                        'likeId': '3',
                        'user': 'Bitmovin',
                        'description': 'Art of Motion - HLS',
                        'mp4Url': '',
                        'hlsUrl': 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
                        'poster': 'https://bitmovin.com/wp-content/uploads/2020/09/art-of-motion-poster.jpg',
                        'avatar': 'https://i.pravatar.cc/100?u=bitmovin',
                        'access': 'secret',
                        'initialLikes': 303,
                        'isLiked': false,
                        'initialComments': 33
                    },
                    {
                        'id': 'slide-004',
                        'likeId': '4',
                        'user': 'Unified Streaming',
                        'description': 'Tears of Steel - HLS (fMP4)',
                        'mp4Url': '',
                        'hlsUrl': 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
                        'poster': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Tears_of_Steel_poster.jpg/1200px-Tears_of_Steel_poster.jpg',
                        'avatar': 'https://i.pravatar.cc/100?u=unified',
                        'access': 'pwa',
                        'initialLikes': 404,
                        'isLiked': false,
                        'initialComments': 44
                    },
                    {
                        'id': 'slide-005',
                        'likeId': '5',
                        'user': 'Apple',
                        'description': 'BipBop - HLS',
                        'mp4Url': '',
                        'hlsUrl': 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8',
                        'poster': 'https://i.ytimg.com/vi/moctobpltc/maxresdefault.jpg',
                        'avatar': 'https://i.pravatar.cc/100?u=apple',
                        'access': 'public',
                        'initialLikes': 505,
                        'isLiked': false,
                        'initialComments': 55
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
          PREFETCH_NEIGHBORS: true,
          PREFETCH_MARGIN: '150%',
          UNLOAD_FAR_SLIDES: true,
          FAR_DISTANCE: 2,
          LOW_DATA_MODE: false,
          METRICS_ENDPOINT: '/api/tt-metrics',
          DEBUG_PANEL: true,
          GESTURE_GRACE_PERIOD_MS: 2000,
          TRANSLATIONS: {
                pl: { loggedOutText: "Nie masz psychy się zalogować", loggedInText: 'Ting Tong', loginSuccess: "Zalogowano pomyślnie!", loginFailed: "Logowanie nie powiodło się. Spróbuj ponownie.", accountHeaderText: 'Konto', menuAriaLabel: 'Menu', subscribeAriaLabel: 'subskrajbować', shareTitle: 'Udostępnij', shareAriaLabel: 'Udostępnij', shareText: 'Szeruj', infoTitle: 'OCB?!', infoAriaLabel: 'OCB?!', infoText: 'OCB?!', tipTitle: 'Napiwek', tipAriaLabel: 'Napiwek', tipText: 'Napiwek', languageAriaLabel: 'Zmień język', languageText: 'PL', subscribeAlert: 'Zaloguj się, aby subskrajbować.', likeAlert: 'Zaloguj się, aby lajkować.', notificationAlert: 'Zaloguj się i bądź na bieżąco.', menuAccessAlert: 'Zaloguj się, aby uzyskać dostęp do menu.', logoutSuccess: 'Zostałeś wylogowany.', likeError: 'Błąd komunikacji z serwerem.', secretTitle: 'Ściśle Tajne', secretSubtitle: 'Zaloguj się, aby odblokować', pwaTitle: 'Ściśle Tajne', pwaSubtitle: 'Ściągnij apkę, aby zobaczyć', infoModalTitle: 'OCB?!', infoModalBodyP1: 'Lorem ipsum dolor sit amet...', infoModalBodyP2: 'Ut in nulla enim...', infoModalBodyTip: 'Podoba Ci się? Zostaw napiwek...', infoModalBodyP3: 'Donec id elit non mi porta...', closeAccountAriaLabel: 'Zamknij panel konta', closeInfoAriaLabel: 'Zamknij informacje', accountMenuButton: 'Konto', logoutLink: 'Wyloguj', profileTab: 'Profil', passwordTab: 'Hasło', deleteTab: 'Usuń konto', loggedInState: 'Zalogowany', loggedOutState: 'Gość', linkCopied: 'Link skopiowany do schowka!', likeAriaLabel: 'Polub', notificationAriaLabel: 'Powiadomienia', commentsAriaLabel: 'Komentarze', commentsModalTitle: 'Komentarze', closeCommentsAriaLabel: 'Zamknij komentarze', likeAriaLabelWithCount: 'Polub. Aktualna liczba polubień: {count}', unlikeAriaLabelWithCount: 'Cofnij polubienie. Aktualna liczba polubień: {count}', notificationsTitle: 'Powiadomienia', closeNotificationsAriaLabel: 'Zamknij powiadomienia', notificationsEmpty: 'Wszystko na bieżąco!', notif1Preview: 'Nowa wiadomość od Admina', notif1Time: '2 min temu', notif1Full: 'Cześć! Chcieliśmy tylko dać znać, że nowa wersja aplikacji jest już dostępna. Sprawdź nowe funkcje w panelu konta!', notif2Preview: 'Twój profil został zaktualizowany', notif2Time: '10 min temu', notif2Full: 'Twoje zmiany w profilu zostały pomyślnie zapisane. Możesz je przejrzeć w dowolnym momencie, klikając w swój awatar.', notif3Preview: 'Specjalna oferta czeka na Ciebie!', notif3Time: '1 godz. temu', notif3Full: 'Nie przegap! Przygotowaliśmy dla Ciebie specjalną letnią promocję. Zgarnij dodatkowe bonusy już teraz. Oferta ograniczona czasowo.', pwaModalTitle: 'Pełne doświadczenie Ting Tong na Twoim telefonie!', pwaModalBody: 'Zeskanuj kod QR lub odwiedź nas na telefonie, aby pobrać aplikację i odblokować pełne możliwości.', installPwaHeading: 'Zobacz więcej!', installPwaSubheading: 'Zainstaluj aplikację Ting Tong na swoim telefonie.', installPwaAction: 'Zainstaluj', openPwaAction: 'Otwórz', videoErrorTitle: 'Błąd Wideo', videoErrorSubtitle: 'Nie można załadować materiału.', videoErrorRetry: 'Spróbuj ponownie', alreadyInstalledText: 'Przecież już ściągłeś' },
                en: { loggedOutText: "You don't have the guts to log in", loggedInText: 'You are logged in', loginSuccess: "Logged in successfully!", loginFailed: "Login failed. Please try again.", accountHeaderText: 'Account', menuAriaLabel: 'Menu', subscribeAriaLabel: 'Subscribe', shareTitle: 'Share', shareAriaLabel: 'Share', shareText: 'Share', infoTitle: 'WTF?!', infoAriaLabel: 'WTF?!', infoText: 'WTF?!', tipTitle: 'Tip', tipAriaLabel: 'Tip', tipText: 'Tip', languageAriaLabel: 'Change language', languageText: 'EN', subscribeAlert: 'Log in to subscribe.', profileViewAlert: 'Log in to see the profile.', likeAlert: 'Log in to like.', notificationAlert: 'Log in to stay up to date.', menuAccessAlert: 'Log in to access the menu.', logoutSuccess: 'You have been logged out.', likeError: 'Server communication error.', secretTitle: 'Top Secret', secretSubtitle: 'Log in to unlock', pwaTitle: 'Top Secret', pwaSubtitle: 'Download the app to view', infoModalTitle: 'WTF?!', infoModalBodyP1: 'Lorem ipsum dolor sit amet...', infoModalBodyP2: 'Ut in nulla enim...', infoModalBodyTip: 'Enjoying the app? Leave a tip...', infoModalBodyP3: 'Donec id elit non mi porta...', closeAccountAriaLabel: 'Close account panel', closeInfoAriaLabel: 'Close information', accountMenuButton: 'Account', logoutLink: 'Logout', profileTab: 'Profile', passwordTab: 'Password', deleteTab: 'Delete account', loggedInState: 'Logged In', loggedOutState: 'Guest', linkCopied: 'Link copied to clipboard!', likeAriaLabel: 'Like', notificationAriaLabel: 'Notifications', commentsAriaLabel: 'Comments', commentsModalTitle: 'Comments', closeCommentsAriaLabel: 'Close comments', likeAriaLabelWithCount: 'Like. Current likes: {count}', unlikeAriaLabelWithCount: 'Unlike. Current likes: {count}', notificationsTitle: 'Notifications', closeNotificationsAriaLabel: 'Close notifications', notificationsEmpty: 'You are all caught up!', notif1Preview: 'New message from Admin', notif1Time: '2 mins ago', notif1Full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!', notif2Preview: 'Your profile has been updated', notif2Time: '10 mins ago', notif2Full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.', notif3Preview: 'A special offer is waiting for you!', notif3Time: '1 hour ago', notif3Full: 'Don\'t miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.', pwaModalTitle: 'The full Ting Tong experience is on your phone!', pwaModalBody: 'Scan the QR code below or visit us on your phone to download the app and unlock the full experience.', installPwaHeading: 'See more!', installPwaSubheading: 'Install the Ting Tong app on your phone.', installPwaAction: 'Install', openPwaAction: 'Open', videoErrorTitle: 'Video Error', videoErrorSubtitle: 'Could not load the content.', videoErrorRetry: 'Try Again', alreadyInstalledText: "You've already installed the app!" }
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
                lastFocusedElement: null,
                lastUserGestureTimestamp: 0,
                activeVideoSession: 0,
                isUnmutedByUser: false,
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
                template: document.getElementById('slide-template'),
                preloader: document.getElementById('preloader'),
                alertBox: document.getElementById('alertBox'),
                alertText: document.getElementById('alertText'),
                infoModal: document.getElementById('infoModal'),
                commentsModal: document.getElementById('commentsModal'),
                accountModal: document.getElementById('accountModal'),
                tiktokProfileModal: document.getElementById('tiktok-profile-modal'),
                notificationPopup: document.getElementById('notificationPopup'),
                pwaDesktopModal: document.getElementById('pwa-desktop-modal'),
                pwaInstallPrompt: document.getElementById('pwaInstallPrompt'),
                pwaIosInstructions: document.getElementById('pwa-ios-instructions'),
                pwaDesktopInstallButton: document.querySelector('.topbar-icon-btn.desktop-only'),
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
                const currentSlideIndex = State.get('currentSlideIndex');

                // Update global UI elements
                const topbar = document.querySelector('#app-frame > .topbar');
                const loginPanel = document.querySelector('#app-frame > .login-panel');
                const loggedInMenu = document.querySelector('#app-frame > .logged-in-menu');

                if (topbar) {
                    topbar.querySelector('.central-text-wrapper').classList.toggle('with-arrow', !isLoggedIn);
                    topbar.querySelector('.topbar-text').textContent = isLoggedIn ? 'Ting Tong' : Utils.getTranslation('loggedOutText');
                    topbar.classList.remove('login-panel-active');
                }
                if (loginPanel) {
                    loginPanel.classList.remove('active');
                }
                if(loggedInMenu) {
                    loggedInMenu.classList.remove('active');
                }

                // Update per-slide elements
                DOM.container.querySelectorAll('.webyx-section').forEach((section) => {
                    const sim = section.querySelector('.tiktok-symulacja');
                    sim.classList.toggle('is-logged-in', isLoggedIn);
                    const isSecret = sim.dataset.access === 'secret';
                    const isPwaOnly = sim.dataset.access === 'pwa';
                    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

                    const showSecretOverlay = (isSecret && !isLoggedIn) || (isPwaOnly && !isStandalone());

                    const secretOverlay = section.querySelector('.secret-overlay');
                    if (secretOverlay) {
                        secretOverlay.classList.toggle('visible', showSecretOverlay);
                    }

                    if (showSecretOverlay) {
                        const titleKey = isPwaOnly ? 'pwaTitle' : 'secretTitle';
                        const subtitleKey = isPwaOnly ? 'pwaSubtitle' : 'secretSubtitle';
                        section.querySelector('.secret-title').textContent = Utils.getTranslation(titleKey);
                        section.querySelector('.secret-subtitle').textContent = Utils.getTranslation(subtitleKey);
                    }

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
                const section = slideFragment.querySelector('.webyx-section');
                section.dataset.index = index;
                section.dataset.slideId = slideData.id;

                section.querySelector('.tiktok-symulacja').dataset.access = slideData.access;
                section.querySelector('.profileButton img').src = slideData.avatar;
                section.querySelector('.text-user').textContent = slideData.user;
                section.querySelector('.text-description').textContent = slideData.description;

                const likeBtn = section.querySelector('.like-button');
                likeBtn.dataset.likeId = slideData.likeId;
                updateLikeButtonState(likeBtn, slideData.isLiked, slideData.initialLikes);

                return section;
            }

            function renderSlides() {
                const wrapper = DOM.container.querySelector('.swiper-wrapper');
                if (!wrapper) return;
                wrapper.innerHTML = '';
                if (slidesData.length === 0) return;

                slidesData.forEach((data, index) => {
                    const slideElement = createSlideElement(data, index);
                    wrapper.appendChild(slideElement);
                });
            }

            function initGlobalPanels() {
                // This function is now empty as the form is hardcoded in index.html
            }

            function populateProfileModal(slideData) {
                if (!slideData || !DOM.tiktokProfileModal) return;

                // Basic info
                DOM.tiktokProfileModal.querySelector('#tiktok-profile-avatar').src = slideData.avatar;
                DOM.tiktokProfileModal.querySelector('#tiktok-profile-username').textContent = `@${slideData.user.toLowerCase().replace(/\s/g, '_')}`;
                DOM.tiktokProfileModal.querySelector('#tiktok-profile-nickname').textContent = slideData.user;
                DOM.tiktokProfileModal.querySelector('#tiktok-profile-bio').textContent = `To jest bio użytkownika ${slideData.user}.\nOdkryj więcej! ✨`;

                // Stats
                DOM.tiktokProfileModal.querySelector('#tiktok-following-count').textContent = Math.floor(Math.random() * 500);
                DOM.tiktokProfileModal.querySelector('#tiktok-followers-count').textContent = Utils.formatCount(Math.floor(Math.random() * 5000000));
                DOM.tiktokProfileModal.querySelector('#tiktok-likes-count').textContent = Utils.formatCount(slideData.initialLikes * 3.5); // Mock total likes

                // Video Grid (mock data)
                const videoGrid = DOM.tiktokProfileModal.querySelector('#videos-grid');
                videoGrid.innerHTML = ''; // Clear previous
                for (let i = 1; i <= 9; i++) {
                    const thumb = document.createElement('div');
                    thumb.className = 'video-thumbnail';
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

            return {
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
                populateProfileModal
            };
        })();


        const VideoManager = (function() {
            const players = {};
            const hlsInstances = {};

            function loadPlayerForSlide(swiperInstance, index) {
                const slideEl = swiperInstance.slides[index];
                if (!slideEl) return;

                const slideId = slideEl.dataset.slideId;
                if (!slideId || players[slideId]) {
                    return;
                }

                const slideData = slidesData.find(s => s.id === slideId);
                if (!slideData) return;

                const video = slideEl.querySelector('.player');
                if (!video) return;

                const player = new Plyr(video, {
                    muted: !State.get('isUnmutedByUser'), // All videos start muted, unless unmuted by user
                    autoplay: false,
                    controls: [],
                    clickToPlay: false,
                    tooltips: { controls: false, seek: false }
                });
                players[slideId] = player;

                const source = slideData.hlsUrl || slideData.mp4Url;
                const isHls = !!slideData.hlsUrl;
                const nativeHlsSupport = video.canPlayType('application/vnd.apple.mpegurl');

                player.on('ready', () => {
                    if (swiperInstance.realIndex === index) {
                        const playPromise = player.play();
                        if (playPromise) {
                            playPromise.catch(e => {if (e.name !== 'AbortError') console.error('Autoplay error on ready', e)});
                        }
                    }
                });

                if (isHls && nativeHlsSupport) {
                    // Native HLS support (Safari, iOS)
                    video.src = source;
                } else if (isHls && Hls.isSupported()) {
                    // HLS support via Hls.js (Chrome, Android)
                    const hls = new Hls();
                    hlsInstances[slideId] = hls;
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.ERROR, function(event, data) {
                        if (data.fatal) {
                            console.error("HLS fatal error:", data);
                            switch(data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                                case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                                default: break;
                            }
                        }
                    });
                } else {
                    // MP4
                    player.source = {
                        type: 'video',
                        sources: [{ src: source, type: 'video/mp4' }],
                        poster: slideData.poster,
                    };
                }
            }

            function onActiveSlideChanged(swiperInstance) {
                const activeIndex = swiperInstance.realIndex;

                // Pause all non-active players
                Object.keys(players).forEach(slideId => {
                    const player = players[slideId];
                    // Find the slide element associated with this player
                    const slideForPlayer = player.elements.container.closest('.swiper-slide');
                    if (slideForPlayer && !slideForPlayer.classList.contains('swiper-slide-active')) {
                        player.pause();
                    }
                });

                // Load and/or play the active slide
                const activeSlideEl = swiperInstance.slides[swiperInstance.activeIndex];
                if (activeSlideEl) {
                    const slideId = activeSlideEl.dataset.slideId;
                    if (!players[slideId]) {
                        loadPlayerForSlide(swiperInstance, swiperInstance.activeIndex);
                    } else {
                        const player = players[slideId];
                        if (player.paused) {
                            const playPromise = player.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(e => { if (e.name !== 'AbortError') console.error('Play interrupted on existing player', e) });
                            }
                        }
                    }
                }
            }

            return {
                init: () => {
                    new Swiper('.swiper', {
                        direction: 'vertical',
                        mousewheel: true,
                        loop: true,
                        keyboard: true,
                        on: {
                            init: function () {
                                const swiperInstance = this;
                                onActiveSlideChanged(swiperInstance);
                            },
                            slideChange: onActiveSlideChanged,
                        },
                    });
                }
            };
        })();


        /**
         * ==========================================================================
         * PWA MODULE
         * ==========================================================================
         */
        const PWA = (function() {
            // DOM Elements
            const installBar = document.getElementById('pwa-install-bar');
            const installButton = document.getElementById('pwa-install-button');
            const iosInstructions = document.getElementById('pwa-ios-instructions');
            const iosCloseButton = document.getElementById('pwa-ios-close-button');
            const desktopModal = document.getElementById('pwa-desktop-modal');

            // Predicates
            const isIOS = () => {
                if (typeof window === 'undefined' || !window.navigator) return false;
                return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            };
            const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            const isDesktop = () => !isIOS() && !/Android/i.test(navigator.userAgent);

            // State
            let installPromptEvent = null;
            let isAppInstalled = isStandalone(); // Initialize state


            // Actions
            function showIosInstructions() {
                if (iosInstructions) iosInstructions.classList.add('visible');
            }

            function hideIosInstructions() {
                if (iosInstructions) iosInstructions.classList.remove('visible');
            }

            function updatePwaUiForInstalledState() {
                if (!installBar || !installButton) return;
            }

            function showDesktopModal() {
                if (desktopModal) UI.openModal(desktopModal);
            }

            function closePwaModals() {
                if (desktopModal && desktopModal.classList.contains('visible')) UI.closeModal(desktopModal);
                if (iosInstructions && iosInstructions.classList.contains('visible')) hideIosInstructions();
            }

            function showInstallBar() {
                if (!installBar) {
                    return;
                }
                const preloader = document.getElementById('preloader');
                const showBar = () => {
                    installBar.classList.add('visible');
                };
                if (preloader && preloader.style.display !== 'none' && !preloader.classList.contains('preloader-hiding')) {
                    const observer = new MutationObserver((mutations, obs) => {
                        if (preloader.style.display === 'none') {
                            showBar();
                            obs.disconnect();
                        }
                    });
                    observer.observe(preloader, { attributes: true, attributeFilter: ['style'] });
                } else {
                    showBar();
                }
            }

            // Initialization
            function init() {
                // Always attach event listener to the install button.
                if (installButton) {
                    installButton.addEventListener('click', handleInstallClick);
                }

                // If running in standalone PWA mode, update the UI to show the installed state.
                if (isStandalone()) {
                    updatePwaUiForInstalledState();
                    // Do not set up other install listeners if already installed.
                    return;
                }

                // For mobile browsers, always show the installation bar.
                showInstallBar();

                // For browsers that support `beforeinstallprompt` (like Chrome on Android)
                if ('onbeforeinstallprompt' in window) {
                    window.addEventListener('beforeinstallprompt', (e) => {
                        e.preventDefault();
                        installPromptEvent = e;
                        if (installButton) {
                            installButton.disabled = false;
                        }
                    });

                    window.addEventListener('appinstalled', () => {
                        console.log('PWA was installed');
                        installPromptEvent = null;
                        isAppInstalled = true; // Set state
                        updatePwaUiForInstalledState();
                    });
                }


                // Attach other event listeners
                if (iosCloseButton) {
                    iosCloseButton.addEventListener('click', hideIosInstructions);
                }
            }

            function handleInstallClick() {
                // Check if the app is already installed and show an alert.
                if (isAppInstalled) {
                    UI.showAlert(Utils.getTranslation('alreadyInstalledText'));
                    return;
                }

                if (installPromptEvent) {
                    installPromptEvent.prompt();
                    installPromptEvent.userChoice.then((choiceResult) => {
                        console.log(`PWA prompt user choice: ${choiceResult.outcome}`);
                        if (choiceResult.outcome === 'accepted') {
                            // The 'appinstalled' event will handle the UI change.
                        } else {
                            // User dismissed the prompt, do nothing.
                        }
                    });
                } else if (isIOS()) {
                    // On iOS, we show instructions.
                    showIosInstructions();
                } else if (isDesktop()) {
                    showDesktopModal();
                } else {
                    // If not on iOS and there's no prompt, the app is likely installed.
                    UI.showAlert(Utils.getTranslation('alreadyInstalledText'));
                }
            }

            // --- PATCH: Dynamically adjust progress bar for PWA prompt ---
            const pwaBar = document.getElementById('pwa-install-bar');
            const root = document.documentElement;

            if (pwaBar) {
                const pwaObserver = new MutationObserver(() => {
                    requestAnimationFrame(() => {
                        if (pwaBar.classList.contains('visible')) {
                            // When PWA bar is visible, position the progress bar above it.
                            root.style.setProperty('--progress-bar-bottom-offset', `${pwaBar.offsetHeight}px`);
                        } else {
                            // When PWA bar is hidden, revert to the default position above the main bottom bar.
                            root.style.removeProperty('--progress-bar-bottom-offset');
                        }
                    });
                });

                pwaObserver.observe(pwaBar, { attributes: true, attributeFilter: ['class'] });

                // Initial check in case the bar is already visible on load
                if (pwaBar.classList.contains('visible')) {
                     root.style.setProperty('--progress-bar-bottom-offset', `${pwaBar.offsetHeight}px`);
                }
            }
            // --- END PATCH ---

            return { init, handleInstallClick, closePwaModals };
        })();

        /**
         * ==========================================================================
         * 7. EVENT HANDLERS & NOTIFICATIONS
         * ==========================================================================
         */
        const Handlers = (function() {
            function mockToggleLogin() {
                const isLoggedIn = State.get('isUserLoggedIn');
                State.set('isUserLoggedIn', !isLoggedIn);
                UI.updateUIForLoginState();
                const message = !isLoggedIn ? Utils.getTranslation('loginSuccess') : Utils.getTranslation('logoutSuccess');
                UI.showAlert(message);

                // If we are logging in, close the panel
                if (!isLoggedIn) {
                    const loginPanel = document.querySelector('#app-frame > .login-panel');
                    if (loginPanel) loginPanel.classList.remove('active');
                    const topbar = document.querySelector('#app-frame > .topbar');
                    if (topbar) topbar.classList.remove('login-panel-active');
                }
            }

            function handleNotificationClick(event) {
                const item = event.target.closest('.notification-item');
                if (!item) return;

                item.classList.toggle('expanded');
                item.setAttribute('aria-expanded', item.classList.contains('expanded'));

                if (item.classList.contains('unread')) {
                    item.classList.remove('unread');
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
                const slideId = button.closest('.webyx-section')?.dataset.slideId;
                const slideData = slidesData.find(s => s.id === slideId);
                if (!slideData) return;

                const isCurrentlyLiked = !!slideData.isLiked;
                const newLikedState = !isCurrentlyLiked;
                const currentCount = slideData.initialLikes;
                const newCount = newLikedState ? currentCount + 1 : Math.max(0, currentCount - 1);

                // Optimistic UI update
                slideData.isLiked = newLikedState;
                slideData.initialLikes = newCount;
                UI.applyLikeStateToDom(slideData.likeId, newLikedState, newCount);
                button.disabled = true;

                const json = await API.toggleLike(slideData.likeId);

                if (json.success) {
                    slideData.isLiked = json.data.status === 'liked';
                    slideData.initialLikes = json.data.count;
                    UI.applyLikeStateToDom(slideData.likeId, slideData.isLiked, slideData.initialLikes);
                } else {
                    // Revert
                    slideData.isLiked = isCurrentlyLiked;
                    slideData.initialLikes = currentCount;
                    UI.applyLikeStateToDom(slideData.likeId, isCurrentlyLiked, currentCount);
                    UI.showAlert(json.data?.message || Utils.getTranslation('likeError'), true);
                }
                button.disabled = false;
            }

            function handleShare(button) {
                const section = button.closest('.webyx-section');
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

            function handleLanguageToggle() {
                const newLang = State.get('currentLang') === 'pl' ? 'en' : 'pl';
                State.set('currentLang', newLang);
                localStorage.setItem('tt_lang', newLang);
                UI.updateTranslations();
                Notifications.render();
            }

            return {
                handleNotificationClick,
                profileModalTabHandler: (e) => {
                    const tab = e.target.closest('.tab');
                    if (!tab) return;

                    const modal = tab.closest('#tiktok-profile-modal');
                    if (!modal) return;

                    // Deactivate all tabs and galleries
                    modal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    modal.querySelectorAll('.video-gallery').forEach(g => g.classList.remove('active'));

                    // Activate clicked tab and corresponding gallery
                    tab.classList.add('active');
                    const contentId = tab.dataset.tabContent;
                    const gallery = modal.querySelector(`#${contentId}`);
                    if (gallery) {
                        gallery.classList.add('active');
                    }
                },
                mainClickHandler: (e) => {
                    const target = e.target;
                    const actionTarget = target.closest('[data-action]');
                    if (!actionTarget) {
                        return;
                    }

                    const action = actionTarget.dataset.action;

                    const topbar = document.querySelector('#app-frame > .topbar');
                    const loginPanel = document.querySelector('#app-frame > .login-panel');
                    const loggedInMenu = document.querySelector('#app-frame > .logged-in-menu');

                    switch (action) {
                        case 'go-back':
                            const modalToClose = actionTarget.closest('.modal-overlay');
                            if (modalToClose) {
                                UI.closeModal(modalToClose);
                            }
                            break;
                        case 'open-public-profile':
                             if (!State.get('isUserLoggedIn')) {
                                Utils.vibrateTry();
                                UI.showAlert(Utils.getTranslation('profileViewAlert'));
                                return;
                            }
                            const profileSection = actionTarget.closest('.webyx-section');
                            if (profileSection) {
                                const slideData = slidesData.find(s => s.id === profileSection.dataset.slideId);
                                if (slideData) {
                                    UI.populateProfileModal(slideData);
                                    UI.openModal(UI.DOM.tiktokProfileModal);
                                }
                            }
                            break;
                        case 'toggle-like': handleLikeToggle(actionTarget); break;
                        case 'share': handleShare(actionTarget); break;
                        case 'toggle-language': handleLanguageToggle(); break;
                        case 'open-comments-modal': UI.openModal(UI.DOM.commentsModal); break;
                        case 'open-info-modal': mockToggleLogin(); break;
                        case 'open-desktop-pwa-modal': PWA.openDesktopModal(); break;
                        case 'open-ios-pwa-modal': PWA.openIosModal(); break;
                        case 'install-pwa': PWA.handleInstallClick(); break;
                        case 'open-account-modal':
                            if (loggedInMenu) loggedInMenu.classList.remove('active');
                            AccountPanel.openAccountModal();
                            break;
                        case 'close-modal':
                            const modal = actionTarget.closest('.modal-overlay');
                            if (modal) {
                                UI.closeModal(modal);
                            } else {
                                PWA.closePwaModals();
                            }
                            break;
                        case 'close-account-modal':
                            AccountPanel.closeAccountModal();
                            break;
                        case 'logout':
                            e.preventDefault();
                            handleLogout(actionTarget);
                            break;
                        case 'toggle-main-menu':
                            if (State.get('isUserLoggedIn')) {
                                if (loggedInMenu) loggedInMenu.classList.toggle('active');
                            } else {
                                Utils.vibrateTry();
                                UI.showAlert(Utils.getTranslation('menuAccessAlert'));
                            }
                            break;
                        case 'toggle-login-panel':
                            if (!State.get('isUserLoggedIn')) {
                                if (loginPanel) loginPanel.classList.toggle('active');
                                if (topbar) topbar.classList.toggle('login-panel-active');
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
                    const form = e.target.closest('form#tt-login-form');
                    if (form) {
                        e.preventDefault();
                        mockToggleLogin();
                    }
                }
            };
        })();

        const Notifications = (function() {
            const mockData = [
                { id: 1, type: 'message', previewKey: 'notif1Preview', timeKey: 'notif1Time', fullKey: 'notif1Full', unread: true },
                { id: 2, type: 'profile', previewKey: 'notif2Preview', timeKey: 'notif2Time', fullKey: 'notif2Full', unread: true },
                { id: 3, type: 'offer', previewKey: 'notif3Preview', timeKey: 'notif3Time', fullKey: 'notif3Full', unread: false },
            ];

            const icons = {
                message: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>`,
                profile: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
                offer: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>`
            };

            return {
                render: () => {
                    const listEl = UI.DOM.notificationPopup.querySelector('.notification-list');
                    const emptyStateEl = UI.DOM.notificationPopup.querySelector('.notification-empty-state');
                    listEl.innerHTML = '';
                    listEl.appendChild(emptyStateEl);

                    if (mockData.length === 0) {
                        emptyStateEl.classList.remove('hidden-by-js');
                        return;
                    }

                    emptyStateEl.classList.add('hidden-by-js');
                    const fragment = document.createDocumentFragment();

                    mockData.forEach(notif => {
                        const item = document.createElement('li');
                        item.className = `notification-item ${notif.unread ? 'unread' : ''}`;
                        item.setAttribute('role', 'button');
                        item.setAttribute('tabindex', '0');
                        item.setAttribute('aria-expanded', 'false');

                        item.innerHTML = `
                            <div class="notif-header">
                                <div class="notif-icon" aria-hidden="true">${icons[notif.type] || ''}</div>
                                <div class="notif-content-wrapper">
                                    <div class="notif-summary">
                                        <span class="notif-preview">${Utils.getTranslation(notif.previewKey)}</span>
                                        <span class="notif-time">${Utils.getTranslation(notif.timeKey)}</span>
                                    </div>
                                    <div class="unread-dot"></div>
                                    <svg class="expand-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                </div>
                            </div>
                            <div class="notif-full-details">
                                <div class="notif-full-details-content">
                                    ${Utils.getTranslation(notif.fullKey)}
                                </div>
                            </div>
                        `;
                        fragment.appendChild(item);
                    });
                    listEl.appendChild(fragment);
                }
            }
        })();


        /**
         * ==========================================================================
         * 8. ACCOUNT PANEL
         * ==========================================================================
         */
        const AccountPanel = (function(){
            // Global variables for the panel
            let cropImage = null;
            let cropCanvas = null;
            let cropCtx = null;
            let scale = 1;
            let offsetX = 0;
            let offsetY = 0;
            let isDragging = false;
            let lastX = 0;
            let lastY = 0;
            let minScale = 1;
            let maxScale = 3;

            // Global state for settings
            let userSettings = {
                emailConsent: true,
                emailLanguage: 'pl'
            };

            // Main initialization function
            function init() {
                initializeModal();
                initializeCropper();
                setupEventListeners();
                loadUserSettings();
            }

            // Load user settings - MOCK
            async function loadUserSettings() {
                try {
                    // MOCK - simulating settings load
                    await new Promise(resolve => setTimeout(resolve, 500));
                    userSettings = { emailConsent: true, emailLanguage: 'pl' };
                    updateSettingsUI();
                } catch (error) {
                    console.log('Could not load settings:', error);
                }
            }

            function updateSettingsUI() {
                const consentToggle = document.getElementById('emailConsent');
                if (userSettings.emailConsent) {
                    consentToggle.classList.add('active');
                } else {
                    consentToggle.classList.remove('active');
                }
                document.querySelectorAll('.language-option').forEach(option => {
                    option.classList.remove('active');
                    if (option.dataset.lang === userSettings.emailLanguage) {
                        option.classList.add('active');
                    }
                });
            }

            // Settings handlers
            function toggleEmailConsent() {
                userSettings.emailConsent = !userSettings.emailConsent;
                updateSettingsUI();
            }

            function selectLanguage(lang) {
                userSettings.emailLanguage = lang;
                updateSettingsUI();
            }

            async function saveSettings() {
                const button = document.getElementById('saveSettingsBtn');
                const originalText = button.textContent;
                try {
                    button.disabled = true;
                    button.innerHTML = '<span class="loading-spinner"></span> Zapisywanie...';
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    showSuccess('settingsSuccess', 'Ustawienia zostały zapisane! (DEMO)');
                } catch (error) {
                    showError('settingsError', error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = originalText;
                }
            }

            // Profile data functions
            async function loadInitialProfileData() {
                try {
                    const result = await loadUserProfile();
                    if (result.success) {
                        populateProfileForm(result.data);
                    } else {
                        throw new Error(result.data?.message || 'Nie udało się załadować profilu');
                    }
                } catch (error) {
                    console.log('Could not load profile data:', error);
                    showError('profileError', 'Nie można załadować danych profilu.');
                }
            }

            function populateProfileForm(data) {
                if (data.first_name) document.getElementById('firstName').value = data.first_name;
                if (data.last_name) document.getElementById('lastName').value = data.last_name;
                if (data.email) document.getElementById('email').value = data.email;
                if (data.display_name) document.getElementById('displayName').textContent = data.display_name;
                if (data.email) document.getElementById('userEmail').textContent = data.email;
                if (data.avatar) document.getElementById('userAvatar').src = data.avatar;
            }

            // Modal visibility functions
            function openAccountModal() {
                const modal = document.getElementById('accountModal');
                modal.classList.add('visible');
                document.body.style.overflow = 'hidden';
                loadInitialProfileData(); // Fetch live data when opening
            }

            function closeAccountModal() {
                const modal = document.getElementById('accountModal');
                const modalContent = modal.querySelector('.account-modal-content');

                // Do nothing if the modal is not visible or is already closing.
                if (!modal.classList.contains('visible') || modal.classList.contains('is-hiding')) {
                    return;
                }

                const onTransitionEnd = (event) => {
                    // Ensure we're reacting to the end of the transform on the correct element.
                    if (event.target === modalContent && event.propertyName === 'transform') {
                        modal.classList.remove('visible');
                        modal.classList.remove('is-hiding');
                        // Clean up the event listener.
                        modalContent.removeEventListener('transitionend', onTransitionEnd);
                    }
                };

                modalContent.addEventListener('transitionend', onTransitionEnd);

                // Add the is-hiding class to trigger the closing animation.
                // The .visible class remains for now, so the overlay is still visible during the animation.
                modal.classList.add('is-hiding');

                // Restore body scrolling immediately.
                document.body.style.overflow = '';
            }

            // Tab switching
            function initializeModal() {
                const tabButtons = document.querySelectorAll('.account-tabs .tab-btn');
                const tabPanes = document.querySelectorAll('.account-content .tab-pane');

                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetTab = button.dataset.tab;
                        tabButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        tabPanes.forEach(pane => pane.classList.remove('active'));
                        document.getElementById(targetTab + '-tab').classList.add('active');
                        document.querySelector('.account-header h2').textContent = button.textContent;
                    });
                });
            }

            // Event Listeners setup
            function setupEventListeners() {
                document.getElementById('avatarFileInput').addEventListener('change', handleFileSelect);
                document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
                document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
                document.getElementById('deleteForm').addEventListener('submit', handleDeleteSubmit);

                document.getElementById('avatarEditBtn').addEventListener('click', () => document.getElementById('avatarFileInput').click());
                document.getElementById('emailConsent').addEventListener('click', toggleEmailConsent);
                document.querySelectorAll('.language-option').forEach(el => el.addEventListener('click', () => selectLanguage(el.dataset.lang)));
                document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

                const deleteInput = document.getElementById('deleteConfirmation');
                const deleteBtn = document.getElementById('deleteAccountBtn');
                if (deleteInput && deleteBtn) {
                    deleteInput.addEventListener('input', function() {
                        deleteBtn.disabled = this.value.trim().toUpperCase() !== 'USUWAM KONTO';
                    });
                }

                const zoomSlider = document.getElementById('zoomSlider');
                if (zoomSlider) {
                    zoomSlider.addEventListener('input', function() {
                        scale = parseFloat(this.value);
                        drawCropCanvas();
                    });
                }

                const cropCloseBtn = document.getElementById('cropCloseBtn');
                if (cropCloseBtn) {
                    cropCloseBtn.addEventListener('click', closeCropModal);
                }

                const zoomInBtn = document.getElementById('zoomInBtn');
                if (zoomInBtn) {
                    zoomInBtn.addEventListener('click', () => adjustZoom(0.1));
                }

                const zoomOutBtn = document.getElementById('zoomOutBtn');
                if (zoomOutBtn) {
                    zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));
                }

                const cropSaveBtn = document.getElementById('cropSaveBtn');
                if (cropSaveBtn) {
                    cropSaveBtn.addEventListener('click', cropAndSave);
                }

                document.addEventListener('keydown', function(event) {
                    if (event.key === 'Escape') {
                        if (document.getElementById('cropModal').classList.contains('visible')) {
                            closeCropModal();
                        } else if (document.getElementById('accountModal').classList.contains('visible')) {
                            closeAccountModal();
                        }
                    }
                });
            }

            function handleFileSelect(event) {
                const file = event.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) return showError('profileError', 'Proszę wybrać plik obrazu.');
                if (file.size > 5 * 1024 * 1024) return showError('profileError', 'Plik jest za duży. Maksymalny rozmiar to 5MB.');

                const reader = new FileReader();
                reader.onload = function(e) {
                    cropImage = new Image();
                    cropImage.onload = function() {
                        openCropModal();
                        initializeCropCanvas();
                    };
                    cropImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            function openCropModal() { document.getElementById('cropModal').classList.add('visible'); }
            function closeCropModal() { document.getElementById('cropModal').classList.remove('visible'); cropImage = null; }

            function initializeCropper() {
                cropCanvas = document.getElementById('cropCanvas');
                if (!cropCanvas) return;
                cropCtx = cropCanvas.getContext('2d');
                cropCanvas.addEventListener('mousedown', startDrag);
                cropCanvas.addEventListener('mousemove', drag);
                window.addEventListener('mouseup', endDrag);
                cropCanvas.addEventListener('mouseleave', endDrag);
                cropCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
                cropCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
                window.addEventListener('touchend', endDrag);
            }

            function initializeCropCanvas() {
                if (!cropImage) return;
                const canvasRect = cropCanvas.getBoundingClientRect();
                cropCanvas.width = canvasRect.width;
                cropCanvas.height = canvasRect.height;

                const cropCircleSize = Math.min(cropCanvas.width, cropCanvas.height) * 0.8;
                const imageMaxDimension = Math.max(cropImage.width, cropImage.height);

                minScale = cropCircleSize / imageMaxDimension;
                scale = minScale;
                offsetX = 0;
                offsetY = 0;

                const slider = document.getElementById('zoomSlider');
                slider.min = minScale.toFixed(2);
                slider.max = (minScale * 4).toFixed(2);
                slider.value = scale.toFixed(2);
                maxScale = minScale * 4;

                drawCropCanvas();
            }

            function drawCropCanvas() {
                if (!cropImage || !cropCtx) return;
                const canvas = cropCanvas;
                const ctx = cropCtx;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const imgWidth = cropImage.width * scale;
                const imgHeight = cropImage.height * scale;
                const x = (canvas.width - imgWidth) / 2 + offsetX;
                const y = (canvas.height - imgHeight) / 2 + offsetY;
                ctx.drawImage(cropImage, x, y, imgWidth, imgHeight);
            }

            function startDrag(event) { isDragging = true; lastX = event.clientX; lastY = event.clientY; cropCanvas.style.cursor = 'grabbing'; }
            function drag(event) { if (!isDragging) return; const deltaX = event.clientX - lastX; const deltaY = event.clientY - lastY; offsetX += deltaX; offsetY += deltaY; lastX = event.clientX; lastY = event.clientY; constrainOffsets(); drawCropCanvas(); }
            function endDrag() { isDragging = false; cropCanvas.style.cursor = 'grab'; }
            function handleTouchStart(event) { event.preventDefault(); if (event.touches.length === 1) { const touch = event.touches[0]; startDrag({ clientX: touch.clientX, clientY: touch.clientY }); } }
            function handleTouchMove(event) { event.preventDefault(); if (event.touches.length === 1 && isDragging) { const touch = event.touches[0]; drag({ clientX: touch.clientX, clientY: touch.clientY }); } }
            function adjustZoom(delta) { const newScale = Math.max(minScale, Math.min(maxScale, scale + delta)); scale = newScale; document.getElementById('zoomSlider').value = scale; constrainOffsets(); drawCropCanvas(); }
            function constrainOffsets() { if (!cropImage) return; const imgWidth = cropImage.width * scale; const imgHeight = cropImage.height * scale; const maxOffsetX = Math.max(0, (imgWidth - cropCanvas.width) / 2); const maxOffsetY = Math.max(0, (imgHeight - cropCanvas.height) / 2); offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX)); offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY)); }

            async function cropAndSave() {
                if (!cropImage) return;
                const button = document.getElementById('cropSaveBtn');
                const originalHTML = button.innerHTML;
                button.disabled = true;
                button.innerHTML = '<span class="loading-spinner"></span> Zapisywanie...';

                try {
                    const outputCanvas = document.createElement('canvas');
                    outputCanvas.width = 200;
                    outputCanvas.height = 200;
                    const outputCtx = outputCanvas.getContext('2d');

                    const cropSize = Math.min(cropCanvas.width, cropCanvas.height) * 0.8;
                    const srcSize = cropSize / scale;
                    const srcX = (cropImage.width - srcSize) / 2 - (offsetX / scale);
                    const srcY = (cropImage.height - srcSize) / 2 - (offsetY / scale);

                    outputCtx.drawImage(cropImage, srcX, srcY, srcSize, srcSize, 0, 0, 200, 200);

                    const dataUrl = outputCanvas.toDataURL('image/png', 0.9);
                    const result = await uploadAvatar(dataUrl);

                    if (result.success && result.data?.url) {
                        const newAvatarUrl = result.data.url + '?t=' + Date.now();
                        document.getElementById('userAvatar').src = newAvatarUrl;
                        document.querySelectorAll('.profile img, .tiktok-symulacja .profile img').forEach(img => { img.src = newAvatarUrl; });
                        showSuccess('profileSuccess', 'Avatar został zaktualizowany!');
                        closeCropModal();
                        document.dispatchEvent(new CustomEvent('tt:avatar-updated', { detail: { url: newAvatarUrl } }));
                    } else {
                        throw new Error(result.data?.message || 'Nie otrzymano URL avatara');
                    }
                } catch (error) {
                    showError('profileError', error.message || 'Błąd podczas przetwarzania obrazu.');
                } finally {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }
            }

            async function apiRequest(action, data = {}) {
                const body = new URLSearchParams({ action, nonce: ajax_object.nonce });
                for(const key in data) { body.append(key, data[key]); }
                try {
                    const response = await fetch(ajax_object.ajax_url, { method: 'POST', body, credentials: 'same-origin' });
                    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
                    const result = await response.json();
                    if (result.new_nonce) ajax_object.nonce = result.new_nonce;
                    return result;
                } catch (error) {
                    console.error(`Błąd API dla akcji "${action}":`, error);
                    return { success: false, data: { message: error.message } };
                }
            }
            async function uploadAvatar(dataUrl) { return apiRequest('tt_avatar_upload', { image: dataUrl }); }
            async function updateProfile(data) { return apiRequest('tt_profile_update', data); }
            async function changePassword(data) { return apiRequest('tt_password_change', data); }
            async function deleteAccount(confirmText) { return apiRequest('tt_account_delete', { confirm_text: confirmText }); }
            async function loadUserProfile() { return apiRequest('tt_profile_get'); }

            async function handleProfileSubmit(event) {
                event.preventDefault();
                const button = document.getElementById('saveProfileBtn');
                const originalText = button.textContent;
                button.disabled = true;
                button.innerHTML = '<span class="loading-spinner"></span> Zapisywanie...';
                try {
                    const data = { first_name: document.getElementById('firstName').value.trim(), last_name: document.getElementById('lastName').value.trim(), email: document.getElementById('email').value.trim() };
                    if (!data.first_name || !data.last_name || !data.email) throw new Error('Wszystkie pola są wymagane.');
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Podaj prawidłowy adres email.');
                    const result = await updateProfile(data);
                    if (result.success) {
                        showSuccess('profileSuccess', 'Profil został zaktualizowany!');
                        populateProfileForm(result.data);
                    } else { throw new Error(result.data?.message || 'Błąd aktualizacji profilu.'); }
                } catch (error) {
                    showError('profileError', error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = originalText;
                }
            }

            async function handlePasswordSubmit(event) {
                event.preventDefault();
                const button = document.getElementById('changePasswordBtn');
                const originalText = button.textContent;
                button.disabled = true;
                button.innerHTML = '<span class="loading-spinner"></span> Zmienianie...';
                try {
                    const currentPassword = document.getElementById('currentPassword').value, newPassword = document.getElementById('newPassword').value, confirmPassword = document.getElementById('confirmPassword').value;
                    if (!currentPassword || !newPassword || !confirmPassword) throw new Error('Wszystkie pola są wymagane.');
                    if (newPassword.length < 8) throw new Error('Nowe hasło musi mieć minimum 8 znaków.');
                    if (newPassword !== confirmPassword) throw new Error('Nowe hasła muszą być identyczne.');
                    const result = await changePassword({ current_password: currentPassword, new_password_1: newPassword, new_password_2: confirmPassword });
                    if (result.success) {
                        showSuccess('passwordSuccess', 'Hasło zostało zmienione!');
                        document.getElementById('passwordForm').reset();
                    } else { throw new Error(result.data?.message || 'Błąd zmiany hasła.'); }
                } catch (error) {
                    showError('passwordError', error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = originalText;
                }
            }

            async function handleDeleteSubmit(event) {
                event.preventDefault();
                const button = document.getElementById('deleteAccountBtn');
                const originalText = button.textContent;
                button.disabled = true;
                button.innerHTML = '<span class="loading-spinner"></span> Usuwanie...';
                try {
                    const confirmText = document.getElementById('deleteConfirmation').value;
                    if (confirmText.trim() !== 'USUWAM KONTO') throw new Error('Wpisz dokładnie: USUWAM KONTO');
                    const result = await deleteAccount(confirmText);
                    if (result.success) {
                        showSuccess('deleteSuccess', 'Konto zostało usunięte. Trwa wylogowywanie...');
                        setTimeout(() => window.location.reload(), 2000);
                    } else { throw new Error(result.data?.message || 'Błąd usuwania konta.'); }
                } catch (error) {
                    showError('deleteError', error.message);
                    if(!document.getElementById('deleteSuccess').classList.contains('show')) {
                      button.disabled = false;
                      button.textContent = originalText;
                    }
                }
            }

            function hideAllMessages() { document.querySelectorAll('.status-message').forEach(el => { el.classList.remove('show'); el.style.display = 'none'; }); }
            function showSuccess(elementId, message) { hideAllMessages(); const el = document.getElementById(elementId); el.textContent = message; el.style.display = 'block'; requestAnimationFrame(() => el.classList.add('show')); setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.style.display = 'none', 300); }, 3000); }
            function showError(elementId, message) { hideAllMessages(); const el = document.getElementById(elementId); el.textContent = message; el.style.display = 'block'; requestAnimationFrame(() => el.classList.add('show')); setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.style.display = 'none', 300); }, 4000); }

            return { init, openAccountModal, closeAccountModal };
        })();

        /**
         * ==========================================================================
         * 9. APP INITIALIZATION
         * ==========================================================================
         */
        const App = (function() {
            function _initializeGlobalListeners() {
                Utils.setAppHeightVar();
                window.addEventListener('resize', Utils.setAppHeightVar);
                window.addEventListener('orientationchange', Utils.setAppHeightVar);

                ['touchstart', 'pointerdown', 'click', 'keydown'].forEach(evt => {
                    document.addEventListener(evt, Utils.recordUserGesture, { passive: true });
                });

                document.body.addEventListener('click', Handlers.mainClickHandler);
                UI.DOM.container.addEventListener('submit', Handlers.formSubmitHandler);

                document.querySelectorAll('.modal-overlay:not(#accountModal)').forEach(modal => {
                    modal.addEventListener('click', (e) => { if (e.target === modal) UI.closeModal(modal); });
                    modal.querySelector('.modal-close-btn, .topbar-close-btn')?.addEventListener('click', () => UI.closeModal(modal));
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        const visibleModal = document.querySelector('.modal-overlay.visible:not(#accountModal):not(#cropModal)');
                        if(visibleModal) UI.closeModal(visibleModal);
                        if(UI.DOM.notificationPopup.classList.contains('visible')) UI.DOM.notificationPopup.classList.remove('visible');
                    }
                });

                document.addEventListener('click', (event) => {
                    const popup = UI.DOM.notificationPopup;
                    if (popup && popup.classList.contains('visible') &&
                        !popup.contains(event.target) &&
                        !event.target.closest('[data-action="toggle-notifications"]')) {
                        popup.classList.remove('visible');
                    }
                });

                UI.DOM.notificationPopup.querySelector('.notification-list').addEventListener('click', Handlers.handleNotificationClick);
                UI.DOM.tiktokProfileModal?.addEventListener('click', Handlers.profileModalTabHandler);

                UI.DOM.container.addEventListener('click', (e) => {
                    const slide = e.target.closest('.swiper-slide-active');
                    if (!slide) return;

                    // Ignore clicks on buttons in the sidebar or other interactive elements
                    if (e.target.closest('.sidebar, .bottombar, .profile, a, button')) {
                        return;
                    }

                    const slideId = slide.dataset.slideId;
                    const player = players[slideId];
                    if (player) {
                        player.muted = !player.muted;
                        State.set('isUnmutedByUser', true);
                    }
                });
            }

            async function _fetchAndUpdateSlideData() {
                const json = await API.fetchSlidesData();
                if (json.success && Array.isArray(json.data)) {
                    const newDataMap = new Map(json.data.map(item => [String(item.likeId), item]));
                    slidesData.forEach(existingSlide => {
                        const updatedInfo = newDataMap.get(String(existingSlide.likeId));
                        if (updatedInfo) {
                            existingSlide.isLiked = updatedInfo.isLiked;
                            existingSlide.initialLikes = updatedInfo.initialLikes;
                            UI.applyLikeStateToDom(existingSlide.likeId, existingSlide.isLiked, existingSlide.initialLikes);
                        }
                    });
                }
            }

            function _startApp(selectedLang) {
                try {
                    State.set('currentLang', selectedLang);
                    localStorage.setItem('tt_lang', selectedLang);
                    UI.renderSlides(); // Slajdy są teraz renderowane natychmiast
                    UI.updateTranslations();
                    VideoManager.init(); // Swiper jest inicjalizowany natychmiast, gdy slajdy są już w DOM

                    UI.DOM.preloader.classList.add('preloader-hiding');
                    UI.DOM.container.classList.add('ready');
                    UI.DOM.preloader.addEventListener('transitionend', () => UI.DOM.preloader.style.display = 'none', { once: true });
                } catch (error) {
                    alert('Application failed to start. Error: ' + error.message + '\\n\\nStack: ' + error.stack);
                    console.error("TingTong App Start Error:", error);
                }
            }

            function _initializePreloader() {
                setTimeout(() => UI.DOM.preloader.classList.add('content-visible'), 500);
                UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(button => {
                    button.addEventListener('click', () => {
                        UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(btn => btn.disabled = true);
                        button.classList.add('is-selected');
                        // Natychmiastowe uruchomienie aplikacji po wybraniu języka
                        _startApp(button.dataset.lang);
                    }, { once: true });
                });
            }

            function _setInitialConfig() {
                try {
                    const c = navigator.connection || navigator.webkitConnection;
                    if (c?.saveData) Config.LOW_DATA_MODE = true;
                    if (c?.effectiveType?.includes('2g')) Config.LOW_DATA_MODE = true;
                    if (c?.effectiveType?.includes('3g')) Config.HLS.maxAutoLevelCapping = 480;
                } catch(_) {}
            }

            return {
                init: () => {
                    _setInitialConfig();
                    _initializeGlobalListeners();
                    AccountPanel.init();
                    UI.initGlobalPanels();
                    PWA.init();
                    _initializePreloader();
                    document.body.classList.add('loaded');
                },
                fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
            };
        })();



        App.init();
    });
