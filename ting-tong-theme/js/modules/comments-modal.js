import { UI } from './ui.js';
import { API, slidesData } from './api.js';
import { State } from './state.js';
import { Utils } from './utils.js';

const CommentsModal = {
    modal: null,
    modalBody: null,
    sortTrigger: null,
    sortOptionsContainer: null,
    closeButton: null,

    init() {
        // Zamiast ręcznie szukać, używamy UI.DOM. To jest kluczowa poprawka.
        this.modal = UI.DOM.commentsModal;
        if (!this.modal) {
            console.error('Comments modal element not found in UI.DOM cache!');
            return;
        }

        this.modalBody = this.modal.querySelector('.modal-body');
        this.sortTrigger = this.modal.querySelector('.sort-trigger');
        this.sortOptionsContainer = this.modal.querySelector('.sort-options');
        this.closeButton = this.modal.querySelector('.modal-close-btn[data-action="close-modal"]');

        if (this.sortTrigger) {
            this.sortTrigger.addEventListener('click', () => this.toggleSortOptions());
        }
        if (this.sortOptionsContainer) {
            this.sortOptionsContainer.addEventListener('click', (e) => this.handleSortOptionClick(e));
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }

        // Clicking overlay to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    },

    open() {
        console.log('[CommentsModal] open() called');
        const swiper = State.get('swiper');
        if (!swiper) {
            console.log('[CommentsModal] Swiper not found, aborting.');
            return;
        };

        const slideData = slidesData[swiper.realIndex];
        if (!slideData) {
            console.error('No slide data found for comments modal.');
            return;
        }
        const slideId = slideData.id;

        UI.updateCommentFormVisibility();
        this.modalBody.innerHTML = '<div class="loading-spinner"></div>';
        UI.openModal(this.modal);

        API.fetchComments(slideId)
            .then((response) => {
                if (!response || !response.success) {
                    throw new Error(response?.data?.message || 'Failed to load comments');
                }
                const comments = response.data || [];

                slideData.comments = comments;

                this.renderSortedComments(slideData.comments);

                setTimeout(() => {
                    if (this.modalBody.scrollHeight) this.modalBody.scrollTop = this.modalBody.scrollHeight;
                }, 100);
            })
            .catch((error) => {
                console.error('Failed to load comments:', error);
                this.modalBody.innerHTML = `<div class="comment-load-error"><p>${Utils.getTranslation('commentLoadError')}</p></div>`;
            });
    },

    close() {
        UI.closeModal(this.modal);
    },

    toggleSortOptions() {
        this.sortTrigger.parentElement.classList.toggle('open');
    },

    handleSortOptionClick(e) {
        const sortOption = e.target.closest('.sort-option');
        if (!sortOption) return;

        const dropdown = sortOption.closest('.sort-dropdown');
        const newSortOrder = sortOption.dataset.sort;

        if (State.get("commentSortOrder") === newSortOrder) {
            if (dropdown) dropdown.classList.remove('open');
            return;
        }

        State.set("commentSortOrder", newSortOrder);
        if (dropdown) {
            dropdown.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
        }
        sortOption.classList.add('active');
        UI.updateTranslations();
        if (dropdown) dropdown.classList.remove('open');

        const swiper = State.get('swiper');
        if (!swiper) return;
        const slideData = slidesData[swiper.realIndex];

        if (!slideData || !Array.isArray(slideData.comments)) {
            console.error("No local comments to sort for slide");
            UI.showAlert(Utils.getTranslation("commentSortError"), true);
            return;
        }

        this.renderSortedComments(slideData.comments);
    },

    renderSortedComments(comments) {
        const sortOrder = State.get("commentSortOrder");
        let sortedComments = [...comments];

        if (sortOrder === "popular") {
            sortedComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else {
            sortedComments.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
                return dateB - dateA;
            });
        }

        UI.renderComments(sortedComments);
    }
};

export { CommentsModal };
