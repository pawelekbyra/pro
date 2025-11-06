import { UI } from './ui.js';
import { slidesData } from './api.js';
import { State } from './state.js';

const ProfileModal = {
  init() {
    // Event listeners for the modal's internal elements can be added here
    // For example, for the back button, tabs, etc.
    const modal = document.getElementById('tiktok-profile-modal');
    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="close-profile-modal"]')) {
                this.close();
            }
        });
    }
  },

  open(authorData) {
    const modal = document.getElementById('tiktok-profile-modal');
    if (!modal || !authorData) return;

    // Populate modal with author data
    modal.querySelector('.username-header').textContent = authorData.name;
    modal.querySelector('.profile-avatar').src = authorData.avatar;
    modal.querySelector('.fullname').textContent = authorData.name;
    modal.querySelector('.bio').textContent = authorData.bio || '';

    // You can populate stats and other fields similarly if data is available
    // modal.querySelector('.followers-count').textContent = authorData.followers;

    modal.classList.add('visible');
  },

  close() {
    const modal = document.getElementById('tiktok-profile-modal');
    if (!modal) return;
    modal.classList.add('is-hiding');
    setTimeout(() => {
        modal.classList.remove('visible', 'is-hiding');
    }, 400); // Match animation duration
  }
};

export { ProfileModal };
