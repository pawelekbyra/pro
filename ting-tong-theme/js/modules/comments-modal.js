import { Utils } from './utils.js';
import { API, slidesData } from './api.js';
import { State } from './state.js';
import { UI } from './ui.js'; // Dodano referencję do UI

let DOM = {};
// Hardcoded Website ID: 14495 (Jawne)
const HYVOR_WEBSITE_ID = '14495';

function cacheDOM() {
    DOM.commentsModal = document.getElementById("comments-modal-container");
    DOM.commentsContainer = document.getElementById('hyvor-comments-container');
    DOM.loadingSpinner = document.getElementById('hyvor-loading-spinner');
    DOM.titleElement = DOM.commentsModal ? DOM.commentsModal.querySelector('#commentsTitle') : null;
}

/**
 * Główna funkcja do ładowania Hyvor Talk dla aktywnego slajdu.
 */
async function loadHyvorTalkComments() {
    // Sprawdzenie, czy komponent Hyvor Talk jest załadowany globalnie
    if (!DOM.commentsContainer || typeof window.HyvorTalk === 'undefined') return;

    const swiper = State.get('swiper');
    if (!swiper) return;

    // Pokaż spinner i wyczyść kontener (usunięcie poprzedniego widżetu)
    DOM.commentsContainer.innerHTML = '';
    DOM.loadingSpinner.style.display = 'block';

    const slideElement = swiper.slides[swiper.activeIndex];
    const slideId = slideElement.dataset.slideId;
    const slideData = slidesData.find(s => s.id === slideId);

    if (!slideData) return;

    // Hyvor Talk page-id musi być unikalne dla każdego slajdu
    const pageId = slideId;
    const pageTitle = slideData.title;
    // Użyj dostępnego języka z modułu State
    const pageLang = State.get('currentLang') || 'pl';

    // 1. Pobierz dane SSO z serwera
    let ssoUser = null;
    let ssoHash = null;

    try {
        const ssoResult = await API.ajax('tt_hyvor_get_sso');
        if (ssoResult.success && ssoResult.data && ssoResult.data.is_logged_in) {
            ssoUser = ssoResult.data.sso_user;
            ssoHash = ssoResult.data.sso_hash;
        }
    } catch (e) {
        console.error("Błąd pobierania danych SSO dla Hyvor Talk:", e);
    }

    // 2. Utwórz komponent Hyvor Talk
    const commentsComponent = document.createElement('hyvor-talk-comments');

    // Ustaw atrybuty
    commentsComponent.setAttribute('website-id', HYVOR_WEBSITE_ID);
    commentsComponent.setAttribute('page-id', pageId);
    commentsComponent.setAttribute('page-title', pageTitle);
    commentsComponent.setAttribute('language', pageLang);
    commentsComponent.setAttribute('colors', 'dark');
    commentsComponent.setAttribute('loading', 'lazy');

    // 3. Dodaj atrybuty SSO, jeśli użytkownik jest zalogowany
    if (ssoUser && ssoHash) {
        commentsComponent.setAttribute('sso-user', ssoUser);
        commentsComponent.setAttribute('sso-hash', ssoHash);
        // Opcjonalnie: Ustaw Login URL na pusty, aby wymusić automatyczne logowanie
        commentsComponent.setAttribute('login-url', 'javascript:void(0)');
    } else {
        // Jeśli nie jest zalogowany, ustaw Login URL na URL, który otwiera modal logowania
        // Zakładam, że AppBaseURL jest dostępny globalnie (lub w module Config)
        const loginUrl = window.AppBaseURL ? `${window.AppBaseURL}?openLoginModal=true` : '/';
        commentsComponent.setAttribute('login-url', loginUrl);
    }

    // 4. Dodaj komponent do DOM
    // Ukryj spinner po załadowaniu
    commentsComponent.addEventListener('loaded', () => {
        DOM.loadingSpinner.style.display = 'none';
    });

    if (DOM.commentsContainer) {
        DOM.commentsContainer.appendChild(commentsComponent);
    }

    // Opcjonalna aktualizacja tytułu modala
    if (DOM.titleElement) {
        DOM.titleElement.textContent = Utils.getTranslation('commentsModalTitle');
    }
}

function init() {
    cacheDOM();
    if (DOM.commentsModal) {
        // Wymagane: uruchomienie ładowania Hyvor Talk po otwarciu modala
        DOM.commentsModal.addEventListener('modal:open', loadHyvorTalkComments);
    }
}

export const CommentsModal = {
    init,
    // Wszystkie stare funkcje zarządzania komentarzami (renderComments, handleFormSubmit, itp.)
    // muszą zostać usunięte z modułu.
};
