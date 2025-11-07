import { UI } from './ui.js';
import { slidesData } from './api.js';
import { State } from './state.js';

const ProfileModal = {
  init() {
    const modal = document.getElementById('tiktok-profile-modal');
    if(modal) {
        modal.addEventListener('click', (e) => {
            // Zamknięcie po kliknięciu tła (jeśli modal jest w pełni widoczny)
            if (e.target === modal && modal.classList.contains('visible')) {
                this.close();
            }
            // Zamknięcie po kliknięciu przycisku "wstecz"
            if (e.target.closest('.back-btn')) {
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

    UI.openModal(modal, { animationClass: 'slide-in-right' });
  },

  close() {
    const modal = document.getElementById('tiktok-profile-modal');
    if (!modal) return;

    UI.closeModal(modal, { animationClass: 'slide-out-right' });
  }
};

export { ProfileModal };
