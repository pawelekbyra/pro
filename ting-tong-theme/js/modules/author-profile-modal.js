import { Utils } from './utils.js';
import { UI } from './ui.js';

const AuthorProfileModal = (() => {
    let dom = {};
    let currentAuthorData = null;

    function cacheDOM() {
        dom.modal = document.getElementById('author-profile-modal');
        if (!dom.modal) return;

        dom.content = dom.modal.querySelector('.author-profile-content');
        dom.closeBtn = dom.modal.querySelector('[data-action="close-author-profile"]');
        dom.usernameHeader = dom.modal.querySelector('.username-header');
        dom.avatar = dom.modal.querySelector('.profile-avatar');
        dom.followingCount = dom.modal.querySelector('.following-count');
        dom.followersCount = dom.modal.querySelector('.followers-count');
        dom.likesCount = dom.modal.querySelector('.likes-count');
        dom.fullname = dom.modal.querySelector('.fullname');
        dom.bio = dom.modal.querySelector('.bio');
        dom.followBtn = dom.modal.querySelector('.follow-btn');
        dom.instagramBtn = dom.modal.querySelector('.social-btn.instagram');
        dom.youtubeBtn = dom.modal.querySelector('.social-btn.youtube');
        dom.tabs = dom.modal.querySelectorAll('.tab');
        dom.galleries = dom.modal.querySelectorAll('.video-gallery');
    }

    function populate(authorData) {
        if (!dom.modal || !authorData) return;
        currentAuthorData = authorData;

        dom.usernameHeader.textContent = `@${authorData.name.replace(/\s+/g, '').toLowerCase()}`;
        dom.avatar.src = authorData.avatar;
        dom.fullname.textContent = authorData.name;
        dom.bio.textContent = authorData.bio || '';

        // Mock data for stats as it's not in slideData
        dom.followersCount.textContent = Utils.formatCount(authorData.followers || 0);
        dom.followingCount.textContent = Utils.formatCount(authorData.following || 0);
        dom.likesCount.textContent = Utils.formatCount(authorData.likes || 0);

        if (authorData.instagram) {
            dom.instagramBtn.href = authorData.instagram;
            dom.instagramBtn.style.display = 'flex';
        } else {
            dom.instagramBtn.style.display = 'none';
        }

        if (authorData.youtube) {
            dom.youtubeBtn.href = authorData.youtube;
            dom.youtubeBtn.style.display = 'flex';
        } else {
            dom.youtubeBtn.style.display = 'none';
        }

        // Mock video grid for now
        const videoGrid = dom.modal.querySelector('#videos-grid');
        videoGrid.innerHTML = ''; // Clear previous
        for (let i = 0; i < (authorData.videos_count || 0); i++) {
            const thumb = document.createElement('div');
            thumb.className = 'video-thumbnail';
            thumb.innerHTML = `<img src="${authorData.avatar}" alt="Video thumbnail"><div class="video-views"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>${Utils.formatCount(Math.floor(Math.random() * 100000))}</div>`;
            videoGrid.appendChild(thumb);
        }
    }

    function open(authorData) {
        if (!dom.modal) return;

        populate(authorData);

        dom.modal.classList.add('visible');
        dom.modal.setAttribute('aria-hidden', 'false');
    }

    function close() {
        if (!dom.modal) return;

        dom.modal.classList.add('is-hiding');
        dom.modal.setAttribute('aria-hidden', 'true');

        dom.content.addEventListener('animationend', () => {
            dom.modal.classList.remove('visible', 'is-hiding');
        }, { once: true });
    }

    function handleTabClick(e) {
        const clickedTab = e.currentTarget;
        const tabContentId = clickedTab.dataset.tabContent;

        dom.tabs.forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        dom.galleries.forEach(gallery => {
            gallery.classList.toggle('active', gallery.id === tabContentId);
        });
    }

    function bindEvents() {
        if (!dom.modal) return;
        dom.closeBtn.addEventListener('click', close);
        dom.tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
    }

    function init() {
        cacheDOM();
        bindEvents();
    }

    return {
        init,
        open,
        close
    };
})();

export { AuthorProfileModal };
