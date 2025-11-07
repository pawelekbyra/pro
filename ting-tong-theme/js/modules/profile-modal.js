import { UI } from './ui.js';
import { slidesData } from './api.js';
import { State } from './state.js';
import { Utils } from './utils.js';

const ProfileModal = (function () {
    let DOM = {};

    function cacheDOM() {
        DOM.profileModal = document.getElementById('tiktok-profile-modal');
        if (!DOM.profileModal) {
            console.error('Profile modal element not found in cacheDOM');
            return;
        }
        DOM.profileContent = DOM.profileModal.querySelector('.tiktok-profile-content');
        DOM.usernameHeader = DOM.profileModal.querySelector('.username-header');
        DOM.profileAvatar = DOM.profileModal.querySelector('.profile-avatar');
        DOM.followingCount = DOM.profileModal.querySelector('.following-count');
        DOM.followersCount = DOM.profileModal.querySelector('.followers-count');
        DOM.likesCount = DOM.profileModal.querySelector('.likes-count');
        DOM.fullName = DOM.profileModal.querySelector('.fullname');
        DOM.bio = DOM.profileModal.querySelector('.bio');
        DOM.videosGrid = DOM.profileModal.querySelector('#videos-grid');
        DOM.tabs = DOM.profileModal.querySelectorAll('.tab');
        DOM.galleries = DOM.profileModal.querySelectorAll('.video-gallery');
    }

    function bindEvents() {
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
    }

    function handleTabClick(event) {
        const clickedTab = event.currentTarget;

        // Ignore if the tab is already active
        if (clickedTab.classList.contains('active')) {
            return;
        }

        // Deactivate all tabs and galleries
        DOM.tabs.forEach(tab => tab.classList.remove('active'));
        DOM.galleries.forEach(gallery => gallery.classList.remove('active'));

        // Activate the clicked tab
        clickedTab.classList.add('active');

        // Activate the corresponding gallery
        const contentId = clickedTab.dataset.tabContent;
        const activeGallery = document.getElementById(contentId);
        if (activeGallery) {
            activeGallery.classList.add('active');
        }
    }

    function populateData(slideData) {
        if (!slideData || !slideData.author) {
            console.error('Invalid slideData provided to populate ProfileModal');
            return;
        }

        const author = slideData.author;

        DOM.usernameHeader.textContent = author.name;
        DOM.profileAvatar.src = author.avatar;
        DOM.fullName.textContent = author.name;
        DOM.bio.textContent = author.description;

        // Mockup data for stats as it's not in the slideData
        DOM.followingCount.textContent = '150';
        DOM.followersCount.textContent = '1.2M';
        DOM.likesCount.textContent = Utils.formatCount(slideData.initialLikes);

        // Populate video grid (mockup)
        DOM.videosGrid.innerHTML = ''; // Clear previous videos
        for (let i = 0; i < 9; i++) {
            const thumb = document.createElement('div');
            thumb.className = 'video-thumbnail';
            thumb.innerHTML = `
                <img src="https://picsum.photos/200/300?random=${i}" alt="video thumbnail">
                <div class="video-views">
                    <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    <span>${Utils.formatCount(Math.floor(Math.random() * 100000))}</span>
                </div>
            `;
            DOM.videosGrid.appendChild(thumb);
        }
    }

    function openProfileModal() {
        const swiper = State.get('swiper');
        if (!swiper) return;

        const activeSlideData = slidesData[swiper.realIndex];
        populateData(activeSlideData);

        DOM.profileModal.style.display = 'block';
        requestAnimationFrame(() => {
            DOM.profileModal.classList.add('visible');
        });
    }

    function closeProfileModal() {
        DOM.profileModal.classList.remove('visible');

        const onTransitionEnd = () => {
            DOM.profileModal.style.display = 'none';
            DOM.profileModal.removeEventListener('transitionend', onTransitionEnd);
        };
        DOM.profileModal.addEventListener('transitionend', onTransitionEnd);
    }

    function init() {
        // Defer caching until DOM is fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                cacheDOM();
                bindEvents();
            });
        } else {
            cacheDOM();
            bindEvents();
        }
    }

    return {
        init,
        openProfileModal,
        closeProfileModal,
    };
})();

export { ProfileModal };