document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. MOCK DATA & CONFIGURATION
    // ==========================================================================
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
                    'id': 'slide-001', 'likeId': '1', 'user': 'Paweł Polutek', 'description': 'To jest dynamicznie załadowany opis dla pierwszego slajdu. Działa!',
                    'mp4Url': 'https://pawelperfect.pl/wp-content/uploads/2025/07/17169505-hd_1080_1920_30fps.mp4',
                    'hlsUrl': null, 'poster': '', 'avatar': 'https://i.pravatar.cc/100?u=pawel', 'access': 'public',
                    'initialLikes': 1500, 'isLiked': false, 'initialComments': 567
                },
                {
                    'id': 'slide-002', 'likeId': '2', 'user': 'Web Dev', 'description': 'Kolejny slajd, kolejne wideo. #efficiency',
                    'mp4Url': 'https://pawelperfect.pl/wp-content/uploads/2025/07/4434150-hd_1080_1920_30fps-1.mp4',
                    'hlsUrl': null, 'poster': '', 'avatar': 'https://i.pravatar.cc/100?u=webdev', 'access': 'public',
                    'initialLikes': 2200, 'isLiked': false, 'initialComments': 1245
                },
                {
                    'id': 'slide-003', 'likeId': '3', 'user': 'Creative Coder', 'description': 'A teraz coś z innej beczki - HLS stream!',
                    'mp4Url': null,
                    'hlsUrl': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'poster': '', 'avatar': 'https://i.pravatar.cc/100?u=coder', 'access': 'secret',
                    'initialLikes': 50, 'isLiked': false, 'initialComments': 12
                }
            ]
        };
    }

    const Config = {
      PREFETCH_NEIGHBORS: true,
      PREFETCH_MARGIN: '150%',
      UNLOAD_FAR_SLIDES: true,
      FAR_DISTANCE: 2,
      LQIP_POSTER: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGIctGhgoMSA+PIxCSkdHTFROU2A3NkVJQkpbY2P/2wBDAQYGBgoJEQoSDxAHExQXHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAAoABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAfEAEAAgICAwEBAAAAAAAAAAABAhEDBCESMUFRYnH/xAAaAQADAQEBAQAAAAAAAAAAAAAAAQIDBAUG/8QAHREAAgICAwEBAAAAAAAAAAAAAAECEQMhEjFBYf/a.AABEIAKAAYQMBIgACEQEDEQA/AOgY2XQk9RLbl+nEdI9Tae4grQYdQl5+Lq+wMv04jo9W45pTDl30y9U2nuJpDDy7aZeobT3EFaDBzH6cvVtp7iaQYOY/Tl6ttPcQVcDBzH6cvVtp7iAtgYOY/Tl6ttPcQFoMHGfpz9W2nuIC2Bg4z9Ofq209xAWgwcZ+nP1ba+4gLgYOM/Tn6ttPcQFoMHGfpz9W2nuIC0GDjP05+re09xAWgwcZ+nL1ba+4gLpL2DCPxZeqbT3EFaDBxH6cvVtp7iCtBg4j9OXq209xBWgwcR+nL1ba+4grQYOY/Tl6ttPcQVcDBzH6cvVtp7iAtgYOY/Tl6ttPcQFoMHGfpz9W2nuIC0GDjP05+re09xAWgwcZ+nL1ba+4gukvYMI/Fl6ptPcQVoMHGfpz9W2nuICtBg4j9OXq209xBWgwcR+nL1ba+4grQYOY/Tl6ttPcQVsDBzH6cvVtp7iAtgYOM/Tl6ttPcQFoMHGfpz9W2nuIC0GDjP05+re09xAWgwcZ+nL1ba+4gukvYMI/Fl6ptPcQVoMGHkP05eqbT3EFaDBh5D9OXqm09xBWgweQ/Tl6ptPcQVcDB5D9OXq209xBWwMHkP05erbT3EBaDB5D9OXq209xAWgweR+nP1bae4gLpP//Z',
      TRANSLATIONS: {
        pl: { loggedOutText: "Nie masz psychy się zalogować", loggedInText: 'Jesteś zalogowany', loginSuccess: "Zalogowano pomyślnie!", loginFailed: "Logowanie nie powiodło się. Spróbuj ponownie.", accountHeaderText: 'Konto', menuAriaLabel: 'Menu', subscribeAriaLabel: 'subskrajbować', shareTitle: 'Udostępnij', shareAriaLabel: 'Udostępnij', shareText: 'Szeruj', infoTitle: 'OCB?!', infoAriaLabel: 'OCB?!', infoText: 'OCB?!', tipTitle: 'Napiwek', tipAriaLabel: 'Napiwek', tipText: 'Napiwek', languageAriaLabel: 'Zmień język', languageText: 'PL', subscribeAlert: 'Zaloguj się, aby subskrajbować.', likeAlert: 'Zaloguj się, aby lajkować.', notificationAlert: 'Zaloguj się i bądź na bieżąco.', menuAccessAlert: 'Zaloguj się, aby uzyskać dostęp do menu.', logoutSuccess: 'Zostałeś wylogowany.', likeError: 'Błąd komunikacji z serwerem.', secretTitle: 'Ściśle Tajne', secretSubtitle: 'Zaloguj się, aby odblokować', infoModalTitle: 'OCB?!', infoModalBodyP1: 'Lorem ipsum dolor sit amet...', infoModalBodyP2: 'Ut in nulla enim...', infoModalBodyTip: 'Podoba Ci się? Zostaw napiwek...', infoModalBodyP3: 'Donec id elit non mi porta...', closeAccountAriaLabel: 'Zamknij panel konta', closeInfoAriaLabel: 'Zamknij informacje', accountMenuButton: 'Konto', logoutLink: 'Wyloguj', profileTab: 'Profil', passwordTab: 'Hasło', deleteTab: 'Usuń konto', loggedInState: 'Zalogowany', loggedOutState: 'Gość', linkCopied: 'Link skopiowany do schowka!', likeAriaLabel: 'Polub', notificationAriaLabel: 'Powiadomienia', commentsAriaLabel: 'Komentarze', commentsModalTitle: 'Komentarze', closeCommentsAriaLabel: 'Zamknij komentarze', likeAriaLabelWithCount: 'Polub. Aktualna liczba polubień: {count}', unlikeAriaLabelWithCount: 'Cofnij polubienie. Aktualna liczba polubień: {count}', notificationsTitle: 'Powiadomienia', closeNotificationsAriaLabel: 'Zamknij powiadomienia', notificationsEmpty: 'Wszystko na bieżąco!', notif1Preview: 'Nowa wiadomość od Admina', notif1Time: '2 min temu', notif1Full: 'Cześć! Chcieliśmy tylko dać znać, że nowa wersja aplikacji jest już dostępna. Sprawdź nowe funkcje w panelu konta!', notif2Preview: 'Twój profil został zaktualizowany', notif2Time: '10 min temu', notif2Full: 'Twoje zmiany w profilu zostały pomyślnie zapisane. Możesz je przejrzeć w dowolnym momencie, klikając w swój awatar.', notif3Preview: 'Specjalna oferta czeka na Ciebie!', notif3Time: '1 godz. temu', notif3Full: 'Nie przegap! Przygotowaliśmy dla Ciebie specjalną letnią promocję. Zgarnij dodatkowe bonusy już teraz. Oferta ograniczona czasowo.' },
        en: { loggedOutText: "You don't have the guts to log in", loggedInText: 'You are logged in', loginSuccess: "Logged in successfully!", loginFailed: "Login failed. Please try again.", accountHeaderText: 'Account', menuAriaLabel: 'Menu', subscribeAriaLabel: 'Subscribe', shareTitle: 'Share', shareAriaLabel: 'Share', shareText: 'Share', infoTitle: 'WTF?!', infoAriaLabel: 'WTF?!', infoText: 'WTF?!', tipTitle: 'Tip', tipAriaLabel: 'Tip', tipText: 'Tip', languageAriaLabel: 'Change language', languageText: 'EN', subscribeAlert: 'Log in to subscribe.', likeAlert: 'Log in to like.', notificationAlert: 'Log in to stay up to date.', menuAccessAlert: 'Log in to access the menu.', logoutSuccess: 'You have been logged out.', likeError: 'Server communication error.', secretTitle: 'Top Secret', secretSubtitle: 'Log in to unlock', infoModalTitle: 'WTF?!', infoModalBodyP1: 'Lorem ipsum dolor sit amet...', infoModalBodyP2: 'Ut in nulla enim...', infoModalBodyTip: 'Enjoying the app? Leave a tip...', infoModalBodyP3: 'Donec id elit non mi porta...', closeAccountAriaLabel: 'Close account panel', closeInfoAriaLabel: 'Close information', accountMenuButton: 'Account', logoutLink: 'Logout', profileTab: 'Profile', passwordTab: 'Password', deleteTab: 'Delete account', loggedInState: 'Logged In', loggedOutState: 'Guest', linkCopied: 'Link copied to clipboard!', likeAriaLabel: 'Like', notificationAriaLabel: 'Notifications', commentsAriaLabel: 'Comments', commentsModalTitle: 'Comments', closeCommentsAriaLabel: 'Close comments', likeAriaLabelWithCount: 'Like. Current likes: {count}', unlikeAriaLabelWithCount: 'Unlike. Current likes: {count}', notificationsTitle: 'Notifications', closeNotificationsAriaLabel: 'Close notifications', notificationsEmpty: 'You are all caught up!', notif1Preview: 'New message from Admin', notif1Time: '2 mins ago', notif1Full: 'Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!', notif2Preview: 'Your profile has been updated', notif2Time: '10 mins ago', notif2Full: 'Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.', notif3Preview: 'A special offer is waiting for you!', notif3Time: '1 hour ago', notif3Full: 'Don\'t miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.' }
      }
    };
    const slidesData = (typeof TingTongData !== 'undefined' && Array.isArray(TingTongData.slides)) ? TingTongData.slides : [];
    slidesData.forEach(s => { s.likeId = String(s.likeId); });

    // ==========================================================================
    // 2. STATE MANAGEMENT
    // ==========================================================================
    const State = (function() {
        const _state = {
            isUserLoggedIn: (typeof TingTongData !== 'undefined' && TingTongData.isLoggedIn) || false,
            currentLang: 'pl',
            isDraggingProgress: false,
            lastFocusedElement: null,
            swiper: null,
            players: {}, // Store video.js players by slide ID
        };
        return {
            get: (key) => _state[key],
            set: (key, value) => { _state[key] = value; },
        };
    })();

    // ==========================================================================
    // 3. UTILITIES
    // ==========================================================================
    const Utils = (function() {
        return {
            getTranslation: (key) => (Config.TRANSLATIONS[State.get('currentLang')]?.[key]) || key,
            formatCount: (count) => {
                count = Number(count) || 0;
                if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
                if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
                return String(count);
            },
            vibrateTry: (ms = 35) => {
                if (navigator.vibrate) { try { navigator.vibrate(ms); } catch(e) {} }
            },
            setAppHeightVar: () => {
              document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
            }
        };
    })();

    // ==========================================================================
    // 4. API MODULE
    // ==========================================================================
    const API = (function() {
        async function _request(action, data = {}) {
            // This is a mock API for demonstration.
            console.log(`API call: ${action}`, data);
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network
            switch(action) {
                case 'tt_ajax_login':
                    if (data.user_login === 'test' && data.user_pass === 'test') {
                        return { success: true, data: { message: 'Login successful' } };
                    }
                    return { success: false, data: { message: 'Invalid credentials' } };
                case 'tt_ajax_logout':
                    return { success: true };
                case 'toggle_like':
                    const slide = slidesData.find(s => s.likeId === data.post_id);
                    if (slide) {
                        slide.isLiked = !slide.isLiked;
                        slide.initialLikes += slide.isLiked ? 1 : -1;
                        return { success: true, data: { status: slide.isLiked ? 'liked' : 'unliked', count: slide.initialLikes }};
                    }
                    return { success: false, data: { message: 'Post not found' } };
                default:
                    return { success: false, data: { message: 'Unknown API action' } };
            }
        }
        return {
            login: (data) => _request('tt_ajax_login', data),
            logout: () => _request('tt_ajax_logout'),
            toggleLike: (postId) => _request('toggle_like', { post_id: postId }),
        };
    })();

    // ==========================================================================
    // 5. UI MODULE
    // ==========================================================================
    const UI = (function() {
        const DOM = {
            preloader: document.getElementById('preloader'),
            swiperWrapper: document.querySelector('.swiper-wrapper'),
            template: document.getElementById('slide-template'),
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
            const swiper = State.get('swiper');
            if (!swiper) return;

            document.querySelectorAll('.swiper-slide').forEach((slide) => {
                const sim = slide.querySelector('.tiktok-symulacja');
                if (!sim) return;

                sim.classList.toggle('is-logged-in', isLoggedIn);
                const slideId = slide.dataset.slideId;
                const slideData = slidesData.find(s => s.id === slideId);

                if (!slideData) return;

                const showSecretOverlay = slideData.access === 'secret' && !isLoggedIn;
                slide.querySelector('.secret-overlay').classList.toggle('visible', showSecretOverlay);
                slide.querySelector('.video-js').classList.toggle('secret-active', showSecretOverlay);

                sim.querySelector('.topbar .central-text-wrapper').classList.toggle('with-arrow', !isLoggedIn);
                sim.querySelector('.login-panel').classList.remove('active');
                sim.querySelector('.topbar').classList.remove('login-panel-active');
                sim.querySelector('.logged-in-menu').classList.remove('active');
                sim.querySelector('.topbar .topbar-text').textContent = isLoggedIn ? Utils.getTranslation('loggedInText') : Utils.getTranslation('loggedOutText');

                if (slide.classList.contains('swiper-slide-active')) {
                    VideoManager.updatePlaybackForLoginChange(slide, showSecretOverlay);
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

        return { DOM, showAlert, openModal, closeModal, updateUIForLoginState, updateTranslations, applyLikeStateToDom };
    })();

    // ==========================================================================
    // 6. VIDEO & SLIDE MANAGER
    // ==========================================================================
    const VideoManager = (function() {

        function createSlideElement(slideData) {
            const templateNode = UI.DOM.template.content.cloneNode(true);
            const slide = templateNode.querySelector('.swiper-slide');
            slide.dataset.slideId = slideData.id;

            // Populate slide with data
            const videoEl = slide.querySelector('.video-js');
            const sourceEl = videoEl.querySelector('source');
            const videoUrl = slideData.hlsUrl || slideData.mp4Url;
            sourceEl.src = videoUrl;
            sourceEl.type = slideData.hlsUrl ? 'application/x-mpegURL' : 'video/mp4';

            videoEl.poster = slideData.poster || Config.LQIP_POSTER;
            slide.querySelector('.profileButton img').src = slideData.avatar;
            slide.querySelector('.text-user').textContent = slideData.user;
            slide.querySelector('.text-description').textContent = slideData.description;

            const likeBtn = slide.querySelector('.like-button');
            likeBtn.dataset.likeId = slideData.likeId;
            const likeCountEl = slide.querySelector('.like-count');
            likeCountEl.textContent = Utils.formatCount(slideData.initialLikes);
            likeBtn.classList.toggle('active', slideData.isLiked);

            // Init progress bar
            initProgressBar(slide.querySelector('.video-progress'), videoEl);

            return slide;
        }

        function initProgressBar(progressEl, videoEl) {
            if (!progressEl || !videoEl) return;

            const player = State.get('players')[videoEl.id];
            if (!player) return; // Player not ready yet

            progressEl.classList.add('skeleton');
            player.one('loadedmetadata', () => progressEl.classList.remove('skeleton'));

            let pointerId = null;
            const seek = (e) => {
                const rect = progressEl.getBoundingClientRect();
                const x = ('clientX' in e ? e.clientX : (e.touches?.[0]?.clientX || 0));
                const percent = ((x - rect.left) / rect.width) * 100;
                const clamped = Math.max(0, Math.min(100, percent));
                if (player.duration()) player.currentTime((clamped / 100) * player.duration());
                updateProgressUI(player);
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
            };
            progressEl.addEventListener('pointerup', endDrag);
            progressEl.addEventListener('pointercancel', endDrag);
        }

        function updateProgressUI(player) {
            if (State.get('isDraggingProgress') || !player || !player.duration()) return;
            const section = player.el().closest('.swiper-slide');
            if (!section) return;
            const percent = (player.currentTime() / player.duration()) * 100;
            section.querySelector('.progress-line').style.width = `${percent}%`;
            section.querySelector('.progress-dot').style.left = `${percent}%`;
            section.querySelector('.video-progress').setAttribute('aria-valuenow', String(Math.round(percent)));
        };

        function updatePlaybackForLoginChange(slide, isSecret) {
            const videoEl = slide.querySelector('.video-js');
            if (!videoEl) return;
            const player = State.get('players')[videoEl.id];
            if (!player) return;

            if (isSecret) {
                player.pause();
                player.currentTime(0);
            } else if (player.paused()) {
                player.play().catch(e => console.error("Play prevented", e));
            }
        }

        function handleVideoClick(videoEl) {
            if (State.get('isDraggingProgress')) return;
            const player = State.get('players')[videoEl.id];
            if (!player) return;
            const pauseIcon = videoEl.closest('.swiper-slide')?.querySelector('.pause-icon');
            if (player.paused()) {
                player.play().catch(e => console.error("Play prevented", e));
                pauseIcon?.classList.remove('visible');
            } else {
                player.pause();
                pauseIcon?.classList.add('visible');
            }
        }

        return { createSlideElement, updateProgressUI, updatePlaybackForLoginChange, handleVideoClick };
    })();

    // ==========================================================================
    // 7. EVENT HANDLERS
    // ==========================================================================
    const Handlers = (function() {
        async function handleLogin(form) {
            const submitButton = form.querySelector('input[type="submit"]');
            submitButton.disabled = true;
            try {
                const data = {
                    user_login: form.querySelector('#user_login')?.value,
                    user_pass: form.querySelector('#user_pass')?.value
                };
                const json = await API.login(data);
                if (json.success) {
                    State.set('isUserLoggedIn', true);
                    UI.showAlert(Utils.getTranslation('loginSuccess'));
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
                UI.updateUIForLoginState();
            }
            link.disabled = false;
        }

        async function handleLikeToggle(button) {
            if (!State.get('isUserLoggedIn')) {
                Utils.vibrateTry(); UI.showAlert(Utils.getTranslation('likeAlert'));
                return;
            }
            const slideId = button.closest('.swiper-slide')?.dataset.slideId;
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
            if (!json.success) { // Revert on failure
                slideData.isLiked = isCurrentlyLiked;
                slideData.initialLikes = currentCount;
                UI.applyLikeStateToDom(slideData.likeId, isCurrentlyLiked, currentCount);
                UI.showAlert(json.data?.message || Utils.getTranslation('likeError'), true);
            }
            button.disabled = false;
        }

        function handleShare() {
            navigator.clipboard.writeText(window.location.href).then(() => UI.showAlert(Utils.getTranslation('linkCopied')));
        }

        function handleLanguageToggle() {
            const newLang = State.get('currentLang') === 'pl' ? 'en' : 'pl';
            State.set('currentLang', newLang);
            localStorage.setItem('tt_lang', newLang);
            UI.updateTranslations();
        }

        return {
            mainClickHandler: (e) => {
                const target = e.target;
                const actionTarget = target.closest('[data-action]');
                if (!actionTarget) {
                    if (target.closest('.video-js')) VideoManager.handleVideoClick(target.closest('.video-js'));
                    return;
                }
                const action = actionTarget.dataset.action;
                const section = actionTarget.closest('.swiper-slide');
                switch (action) {
                    case 'toggle-like': handleLikeToggle(actionTarget); break;
                    case 'share': handleShare(); break;
                    case 'toggle-language': handleLanguageToggle(); break;
                    case 'open-comments-modal': UI.openModal(UI.DOM.commentsModal); break;
                    case 'open-info-modal': UI.openModal(UI.DOM.infoModal); break;
                    case 'open-account-modal': if(section) section.querySelector('.logged-in-menu').classList.remove('active'); AccountPanel.openAccountModal(); break;
                    case 'close-account-modal': AccountPanel.closeAccountModal(); break;
                    case 'logout': e.preventDefault(); handleLogout(actionTarget); break;
                    case 'toggle-main-menu':
                        if (State.get('isUserLoggedIn')) {
                            section.querySelector('.logged-in-menu').classList.toggle('active');
                        } else {
                             Utils.vibrateTry(); UI.showAlert(Utils.getTranslation('menuAccessAlert'));
                        }
                        break;
                    case 'toggle-login-panel':
                        if (!State.get('isUserLoggedIn')) {
                            section.querySelector('.login-panel').classList.toggle('active');
                            section.querySelector('.topbar').classList.toggle('login-panel-active');
                        }
                        break;
                    case 'subscribe': if (!State.get('isUserLoggedIn')) { Utils.vibrateTry(); UI.showAlert(Utils.getTranslation('subscribeAlert')); } break;
                    case 'toggle-notifications': UI.DOM.notificationPopup.classList.toggle('visible'); break;
                    case 'close-notifications': UI.DOM.notificationPopup.classList.remove('visible'); break;
                    case 'show-tip-jar': document.querySelector('#bmc-wbtn')?.click(); break;
                }
            },
            formSubmitHandler: (e) => {
                const form = e.target.closest('form.login-form');
                if (form) { e.preventDefault(); handleLogin(form); }
            }
        };
    })();

    // ==========================================================================
    // 8. ACCOUNT PANEL (Simplified, as it's complex)
    // ==========================================================================
    const AccountPanel = (function(){
        function init() {
            document.getElementById('accountModal').addEventListener('click', (e) => {
                if (e.target.dataset.action === 'close-account-modal' || e.target.id === 'accountModal') {
                    closeAccountModal();
                }
            });
        }
        function openAccountModal() { UI.openModal(UI.DOM.accountModal); }
        function closeAccountModal() { UI.closeModal(UI.DOM.accountModal); }
        return { init, openAccountModal, closeAccountModal };
    })();

    // ==========================================================================
    // 9. APP INITIALIZATION
    // ==========================================================================
    const App = (function() {

        function initializeGlobalListeners() {
            Utils.setAppHeightVar();
            window.addEventListener('resize', Utils.setAppHeightVar);
            document.body.addEventListener('click', Handlers.mainClickHandler);
            document.body.addEventListener('submit', Handlers.formSubmitHandler);

            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.addEventListener('click', (e) => { if (e.target === modal) UI.closeModal(modal); });
                modal.querySelector('.modal-close-btn, .topbar-close-btn')?.addEventListener('click', () => UI.closeModal(modal));
            });
        }

        function initializeSwiperAndPlayers() {
            // Create all slides and add them to the DOM
            slidesData.forEach(slideData => {
                const slideEl = VideoManager.createSlideElement(slideData);
                UI.DOM.swiperWrapper.appendChild(slideEl);
            });

            // Now, initialize all video.js players
            const players = {};
            document.querySelectorAll('.swiper-slide .video-js').forEach(videoEl => {
                const player = videojs(videoEl, {
                    controls: false,
                    autoplay: false, // We control autoplay via Swiper events
                    muted: true,
                    loop: true,
                    playsinline: true,
                    preload: 'metadata'
                });
                player.on('timeupdate', () => VideoManager.updateProgressUI(player));
                players[player.id()] = player;
            });
            State.set('players', players);

            // Initialize Swiper
            const swiper = new Swiper('.swiper', {
                direction: 'vertical',
                loop: true,
                mousewheel: true,
                on: {
                    slideChangeTransitionEnd: function () {
                        Object.values(State.get('players')).forEach((p) => {
                            const slide = p.el().closest('.swiper-slide');
                            if (slide && slide.classList.contains('swiper-slide-active')) {
                                const slideData = slidesData.find(s => s.id === slide.dataset.slideId);
                                const isSecret = slideData && slideData.access === 'secret' && !State.get('isUserLoggedIn');
                                if (!isSecret) {
                                    p.play().catch(e => console.error("Play failed", e));
                                    p.muted(false);
                                } else {
                                    p.pause();
                                }
                            } else {
                                p.pause();
                                p.currentTime(0);
                            }
                        });
                    },
                },
            });
            State.set('swiper', swiper);

            // Initial play for the first slide
            const initialPlayer = Object.values(players)[swiper.realIndex];
            if (initialPlayer) {
                initialPlayer.play().catch(e=>console.error(e));
                initialPlayer.muted(false);
            }
        }

        function startApp(selectedLang) {
            State.set('currentLang', selectedLang);
            localStorage.setItem('tt_lang', selectedLang);

            UI.DOM.preloader.classList.add('preloader-hiding');
            UI.DOM.preloader.addEventListener('transitionend', () => UI.DOM.preloader.style.display = 'none', { once: true });

            initializeSwiperAndPlayers();
            UI.updateTranslations();
        }

        function initPreloader() {
            const savedLang = localStorage.getItem('tt_lang');
            if (savedLang) {
                startApp(savedLang);
                return;
            }
            setTimeout(() => UI.DOM.preloader.classList.add('content-visible'), 500);
            UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(button => {
                button.addEventListener('click', () => {
                    UI.DOM.preloader.querySelectorAll('.language-selection button').forEach(btn => btn.disabled = true);
                    button.classList.add('is-selected');
                    // Unlock audio context on first user interaction
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) { new AudioContext().resume(); }

                    setTimeout(() => startApp(button.dataset.lang), 300);
                }, { once: true });
            });
        }

        return {
            init: () => {
                initializeGlobalListeners();
                AccountPanel.init();
                initPreloader();
            }
        };
    })();

    App.init();
});
