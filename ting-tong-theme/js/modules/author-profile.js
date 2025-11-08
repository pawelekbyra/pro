import { Utils } from './utils.js';

const AuthorProfile = (() => {
    let modal = null;
    let content = null;
    let tabs = null;
    let videoGalleries = null;

    function cacheDOM() {
        modal = document.getElementById('author-profile-modal');
        if (!modal) return;
        content = modal.querySelector('.profile-content');
        tabs = modal.querySelectorAll('.tab');
        videoGalleries = modal.querySelectorAll('.video-gallery');
    }

    function open(authorData) {
        if (!modal) return;
        populate(authorData);
        modal.classList.add('visible');
    }

    function close() {
        if (!modal) return;
        modal.classList.add('is-hiding');

        const onTransitionEnd = () => {
            modal.classList.remove('visible', 'is-hiding');
            content.removeEventListener('transitionend', onTransitionEnd);
        };
        content.addEventListener('transitionend', onTransitionEnd);
    }

    function populate(authorData) {
        if (!authorData) return;

        modal.querySelector('.username-header').textContent = authorData.name;
        modal.querySelector('.profile-avatar').src = authorData.avatar;
        modal.querySelector('.fullname').textContent = authorData.name;

        if (authorData.stats) {
            modal.querySelector('.following-count').textContent = authorData.stats.following;
            modal.querySelector('.followers-count').textContent = authorData.stats.followers;
            modal.querySelector('.likes-count').textContent = authorData.stats.likes;
        }

        modal.querySelector('.bio').textContent = authorData.bio || 'Brak bio.';

        renderVideoGrid(authorData.videos);
    }

    function renderVideoGrid(videos) {
        const grid = document.getElementById('videos-grid');
        if (!grid || !videos) return;

        grid.innerHTML = ''; // Clear previous videos
        videos.forEach(video => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'video-thumbnail';
            thumbnail.innerHTML = `
                <img src="${video.thumbnail}" alt="Video thumbnail">
                <div class="video-views">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    <span>${video.views}</span>
                </div>
            `;
            grid.appendChild(thumbnail);
        });
    }

    function handleTabClick(e) {
        const clickedTab = e.currentTarget;
        const tabContentId = clickedTab.dataset.tabContent;

        tabs.forEach(tab => tab.classList.remove('active'));
        videoGalleries.forEach(gallery => gallery.classList.remove('active'));

        clickedTab.classList.add('active');
        const activeGallery = document.getElementById(tabContentId);
        if (activeGallery) {
            activeGallery.classList.add('active');
        }
    }

    function init() {
        cacheDOM();
        if (!modal) return;

        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="close-author-modal"]')) {
                close();
            }
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
    }

    return {
        init,
        open,
        close
    };
})();

export { AuthorProfile };
