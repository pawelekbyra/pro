import { UI } from './ui.js';
import { slidesData } from './api.js';
import { State } from './state.js';
import { Utils } from './utils.js'; // Dodany import dla Utils

const ProfileModal = {
  // Cache DOM element modala raz na zawsze
  modal: null,

  init() {
    this.modal = document.getElementById('tiktok-profile-modal');
    if (!this.modal) return;

    // Obsługa kliknięcia przycisku wstecz (jest to back-btn w HTML)
    const backBtn = this.modal.querySelector('.profile-header .back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });
    }

    // Obsługa tła jest już w openModal, ale dodajmy tu kliknięcie w body modala
    this.modal.addEventListener('click', (e) => {
        // W HTML jest div .profile-content, więc kliknięcie w tło modala to target === this.modal
        if (e.target === this.modal && this.modal.classList.contains('visible')) {
            this.close();
        }
    });

    // Event listener for tab switching
    this.modal.querySelectorAll('.tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => this.handleTabSwitch(e.currentTarget));
    });
  },

  handleTabSwitch(tabElement) {
    const targetId = tabElement.dataset.tabContent;
    this.modal.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');
    this.modal.querySelectorAll('main .video-gallery').forEach(gallery => {
        gallery.classList.remove('active');
    });
    this.modal.querySelector(`#${targetId}`)?.classList.add('active');
  },

  open(authorData) {
    if (!this.modal || !authorData) return;

    // Mockowe/tymczasowe statystyki (ponieważ tt_get_slides_data() ich nie zwraca)
    const stats = {
        followers: Math.floor(Math.random() * 1000) + 100,
        following: Math.floor(Math.random() * 50) + 10,
        likes: Math.floor(Math.random() * 5000) + 500,
    };

    // Populate modal with author data
    this.modal.querySelector('.username-header').textContent = authorData.name;
    this.modal.querySelector('.profile-avatar').src = authorData.avatar;
    this.modal.querySelector('.fullname').textContent = authorData.name;
    this.modal.querySelector('.bio').textContent = authorData.description || 'No bio available.';

    // Ustawienie statystyk
    this.modal.querySelector('.following-count').textContent = Utils.formatCount(stats.following);
    this.modal.querySelector('.followers-count').textContent = Utils.formatCount(stats.followers);
    this.modal.querySelector('.likes-count').textContent = Utils.formatCount(stats.likes);

    // Użyj UI.openModal z klasą animacji slide-in-right
    UI.openModal(this.modal, {
        animationClass: 'slide-in-right',
        isPersistent: false, // Umożliwia zamknięcie przez kliknięcie tła
    });

    // Aktywuj domyślny tab
    this.handleTabSwitch(this.modal.querySelector('.tabs .tab[data-tab-content="videos-grid"]'));
  },

  close() {
    if (!this.modal) return;

    // Użyj UI.closeModal z klasą animacji slide-out-right
    UI.closeModal(this.modal, {
        animationClass: 'slide-out-right'
    });
  }
};

export { ProfileModal };
