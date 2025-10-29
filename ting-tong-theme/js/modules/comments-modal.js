import { UI } from './ui.js';
import { API, slidesData } from './api.js';
import { State } from './state.js';
import { Utils } from './utils.js';

const CommentsModal = {
  init() {
    // Use event delegation on the body to ensure the button is always clickable
    document.body.addEventListener('click', (e) => {
      const openButton = e.target.closest('[data-action="open-comments-modal"]');
      if (openButton) {
        this.open();
      }
    });
  },

  open() {
    const swiper = State.get('swiper');
    if (!swiper) return;
    const slideData = slidesData[swiper.realIndex];
    if (!slideData) return;
    const slideId = slideData.id;

    const commentsModal = UI.DOM.commentsModal;
    if (!commentsModal) return;

    const modalBody = commentsModal.querySelector(".modal-body");
    if (!modalBody) {
      console.error('Modal body not found');
      return;
    }

    UI.updateCommentFormVisibility();
    modalBody.innerHTML = '<div class="loading-spinner"></div>';
    UI.openModal(commentsModal);

    API.fetchComments(slideId)
      .then((response) => {
        if (!response || !response.success) {
          throw new Error(response?.data?.message || 'Failed to load comments');
        }
        const comments = response.data || [];
        const slideDataForUpdate = slidesData.find(s => s.id === slideId);
        if (slideDataForUpdate) {
            slideDataForUpdate.comments = comments;
        }
        const sortOrder = State.get("commentSortOrder");
        if (sortOrder === "popular") {
          comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else {
          comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        UI.renderComments(comments);
        setTimeout(() => {
          if (modalBody.scrollHeight) modalBody.scrollTop = modalBody.scrollHeight;
        }, 100);
      })
      .catch((error) => {
        console.error('Failed to load comments:', error);
        modalBody.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.6);"><p>${Utils.getTranslation('commentLoadError')}</p></div>`;
      });
  },

  close() {
    const commentsModal = UI.DOM.commentsModal;
    if (commentsModal) {
      UI.closeModal(commentsModal);
    }
  }
};

export { CommentsModal };
