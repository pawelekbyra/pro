// ting-tong-theme/js/modules/comments-modal.js

import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

let isInitialized = false;

function getThreadId(slideId) {
// FastComments ID powinien być unikalny dla danej strony/slajdu.
return `${window.location.origin}/slide/${slideId}`;
}

async function initializeFastComments(slideId, containerElement) {
if (!window.FastCommentsState || !window.FastCommentsSDK) {
console.error("FastComments SDK or State is not available.");
UI.showAlert("Błąd: Biblioteka komentarzy nie załadowana.", true);
return;
}

const ssoPayload = State.get('isUserLoggedIn') ? await API.getFastCommentsSSOToken() : null;

const tenantId = window.TingTongData?.fcTenantId;
const widgetId = window.TingTongData?.fcWidgetId;
const region = window.TingTongData?.fcRegion;

if (!tenantId || !widgetId) {
console.error("Błąd: Brak kluczy konfiguracji FastComments (Tenant/Widget ID).");
UI.showAlert("Błąd: Brak konfiguracji komentarzy.", true);
return;
}

// Unikalny ID wątku dla każdego slajdu
const threadId = getThreadId(slideId);

// Opcje konfiguracji FastComments
const config = {
tenantId: tenantId,
widgetId: widgetId,
region: region, // "eu"
url: threadId,
title: document.title + ' - ' + slideId, // Tytuł wątku
sso: ssoPayload,
// Domyślna flaga FastComments do obsługi SPA
pageChange: true
};

// Renderowanie widżetu
if (containerElement.dataset.initialized !== 'true') {
window.FastCommentsSDK.render(containerElement, config);
containerElement.dataset.initialized = 'true';
} else {
// Ponowne użycie widżetu dla SPA (zmiana slajdu)
window.FastCommentsState.widget.instance.methods.setCommentUrl(threadId);
if (ssoPayload) {
// Aktualizacja SSO dla widżetu (jeśli stan logowania się zmienił)
window.FastCommentsState.widget.instance.methods.setSso(ssoPayload);
}
}
}

async function showModal() {
const modal = UI.DOM.commentsModal;
const container = UI.DOM.fastCommentsContainer;
const swiper = State.get('swiper');

if (!modal || !container || !swiper || !swiper.slides[swiper.activeIndex]) return;

const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;

// 1. Otwarcie modala (z animacją SlideInUp)
UI.openModal(modal, { animationClass: 'slideInUp', contentSelector: '.modal-content' });

// 2. Włączenie spinnera podczas ładowania FastComments (opcjonalnie)
container.innerHTML = '<div class="spinner"></div>';


// 3. Dynamiczne załadowanie SDK (jeśli jeszcze nie załadowane)
if (!window.FastCommentsSDK) {
await loadFastCommentsSDK();
}

// 4. Inicjalizacja widżetu
await initializeFastComments(slideId, container);

// 5. Aktualizacja tytułu (FastComments może to zrobić sam, ale dla spójności UI)
const slideData = UI.slidesData.find(s => s.id === slideId);
if (slideData) {
const count = slideData.initialComments || 0;
const titleEl = modal.querySelector('#commentsModalTitle');
if (titleEl) {
titleEl.textContent = `${UI.Utils.getTranslation('commentsModalTitle')} (${count})`;
}
}
}

function hideModal() {
const modal = UI.DOM.commentsModal;
if (modal) {
UI.closeModal(modal, { animationClass: 'slideOutDown', contentSelector: '.modal-content' });
}
}

function loadFastCommentsSDK() {
 return new Promise((resolve) => {
 if (window.FastCommentsSDK) {
 resolve();
 return;
 }
 const script = document.createElement('script');
 // FIX: Używamy globalnego (nie-regionalnego) endpointu CDN jako najbardziej niezawodnego fallbacku.
 // Adres https://cdn.fastcomments.com/js/embed.min.js zawsze powinien działać,
 // niezależnie od awarii regionalnych serwerów.
 script.src = 'https://cdn.fastcomments.com/js/embed.min.js'; // KLUCZOWA POPRAWKA
 script.async = true;
 script.onload = resolve;
 document.head.appendChild(script);
 });
 }

function init() {
if (isInitialized) return;
UI.DOM.commentsModal = document.getElementById("fastcomments-modal-container");
UI.DOM.fastCommentsContainer = document.getElementById("fastcomments-widget-0");
isInitialized = true;
}

export const CommentsModal = {
init,
showModal,
hideModal,
};
