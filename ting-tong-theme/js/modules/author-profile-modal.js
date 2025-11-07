const AuthorProfileModal = (() => {
    let modal,
        closeButton,
        authorAvatar,
        authorUsername,
        authorDisplayName,
        authorBio,
        followersCount,
        followingCount,
        likesCount;

    const cacheDOM = () => {
        modal = document.getElementById('author-profile-modal');
        closeButton = modal.querySelector('[data-action="close-author-profile-modal"]');
        authorAvatar = modal.querySelector('.author-avatar');
        authorUsername = modal.querySelector('.author-username');
        authorDisplayName = modal.querySelector('.author-display-name');
        authorBio = modal.querySelector('.author-bio');
        followersCount = modal.querySelector('#author-followers-count');
        followingCount = modal.querySelector('#author-following-count');
        likesCount = modal.querySelector('#author-likes-count');
    };

    const bindEvents = () => {
        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    };

    const openModal = (authorData) => {
        if (!modal) return;

        // Populate modal with author data
        authorAvatar.src = authorData.avatar;
        authorUsername.textContent = authorData.name;
        authorDisplayName.textContent = authorData.name;
        authorBio.textContent = authorData.bio || 'No bio available.';
        followersCount.textContent = authorData.followers || 0;
        followingCount.textContent = authorData.following || 0;
        likesCount.textContent = authorData.likes || 0;

        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = () => {
        if (!modal) return;

        modal.classList.add('is-hiding');
        modal.setAttribute('aria-hidden', 'true');

        modal.addEventListener('transitionend', () => {
            modal.classList.remove('visible');
            modal.classList.remove('is-hiding');
        }, { once: true });
    };

    const init = () => {
        cacheDOM();
        bindEvents();
    };

    return {
        init,
        openModal,
        closeModal
    };
})();

export default AuthorProfileModal;
