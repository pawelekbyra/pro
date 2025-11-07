import { UI } from './ui.js';
import { State } from './state.js';
import { slidesData } from './api.js';

const ProfileModal = (function () {
    let DOM = {};

    function cacheDOM() {
        DOM.profileModal = document.getElementById('tiktok-profile-modal');
        if (!DOM.profileModal) return;
        DOM.closeButton = DOM.profileModal.querySelector('[data-action="close-profile-modal"]');
        DOM.avatar = DOM.profileModal.querySelector('.tiktok-profile-avatar');
        DOM.userName = DOM.profileModal.querySelector('.tiktok-profile-username');
        DOM.userStats = {
            following: DOM.profileModal.querySelector('.stat-following .stat-value'),
            followers: DOM.profileModal.querySelector('.stat-followers .stat-value'),
            likes: DOM.profileModal.querySelector('.stat-likes .stat-value')
        };
        DOM.bio = DOM.profileModal.querySelector('.tiktok-profile-bio');
    }

    function openProfileModal() {
        const swiper = State.get('swiper');
        if (!swiper) return;

        // Użyj realIndex, aby poprawnie obsłużyć tryb pętli
        const activeSlideData = slidesData[swiper.realIndex];
        if (!activeSlideData || !activeSlideData.author) {
            console.error('Nie można znaleźć danych autora dla aktywnego slajdu.');
            return;
        }

        const author = activeSlideData.author;

        if (!DOM.profileModal) {
            cacheDOM(); // Spróbuj ponownie zbuforować, jeśli modal został dodany dynamicznie
            if (!DOM.profileModal) {
                 console.error('Modal profilu nie został znaleziony w DOM.');
                 return;
            }
        }

        // Wypełnij modal danymi
        DOM.avatar.src = author.avatar || '';
        DOM.userName.textContent = `@${author.name}` || '';
        DOM.bio.textContent = author.bio || 'Brak opisu.';

        // Mockowe statystyki, ponieważ nie ma ich w API
        DOM.userStats.following.textContent = author.following || Math.floor(Math.random() * 1000);
        DOM.userStats.followers.textContent = author.followers || Math.floor(Math.random() * 10000);
        DOM.userStats.likes.textContent = author.likes || Math.floor(Math.random() * 100000);


        UI.openModal(DOM.profileModal, { animationClass: 'slide-in-right' });
    }

    function closeProfileModal() {
        if (!DOM.profileModal) return;
        UI.closeModal(DOM.profileModal, { animationClass: 'slide-out-right' });
    }

    function bindEvents() {
        if (!DOM.profileModal) return;
        DOM.closeButton.addEventListener('click', closeProfileModal);

        // Zamykanie przez kliknięcie w tło
        DOM.profileModal.addEventListener('click', (e) => {
            if (e.target === DOM.profileModal) {
                closeProfileModal();
            }
        });
    }

    function init() {
        cacheDOM();
        if (DOM.profileModal) {
            bindEvents();
        } else {
            // Jeśli modal nie istnieje przy pierwszym ładowaniu, spróbuj ponownie po chwili
            setTimeout(() => {
                cacheDOM();
                if (DOM.profileModal) {
                    bindEvents();
                }
            }, 1000);
        }
    }

    return {
        init,
        openProfileModal
    };
})();

export { ProfileModal };