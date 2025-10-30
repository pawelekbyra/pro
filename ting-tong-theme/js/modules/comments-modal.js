import { UI } from './ui.js';
import { API, slidesData } from './api.js';
import { State } from './state.js';
import { Utils } from './utils.js';

let selectedCommentImage = null;

const CommentsModal = {
    modal: null,
    modalBody: null,
    sortTrigger: null,
    sortOptionsContainer: null,
    closeButton: null,
    commentForm: null,
    commentInput: null,
    imagePreviewContainer: null,
    loginPrompt: null,

    init() {
        this.modal = UI.DOM.commentsModal;
        if (!this.modal) {
            console.error('Comments modal element not found!');
            return;
        }

        this.modalBody = this.modal.querySelector('.comments-modal-body');
        this.sortTrigger = this.modal.querySelector('.sort-trigger');
        this.sortOptionsContainer = this.modal.querySelector('.sort-options');
        this.closeButton = this.modal.querySelector('.comments-modal-close-btn');
        this.commentForm = this.modal.querySelector('#comment-form');
        this.commentInput = this.modal.querySelector('#comment-input');
        this.imagePreviewContainer = this.modal.querySelector('.image-preview-container');
        this.loginPrompt = this.modal.querySelector('.login-to-comment-prompt');

        this.addEventListeners();
    },

    addEventListeners() {
        if (this.sortTrigger) {
            this.sortTrigger.addEventListener('click', () => this.toggleSortOptions());
        }
        if (this.sortOptionsContainer) {
            this.sortOptionsContainer.addEventListener('click', (e) => this.handleSortOptionClick(e));
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
        if (this.commentForm) {
            this.commentForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Delegacja zdarzeń dla akcji wewnątrz modala
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }

            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            const commentItem = actionTarget.closest('.comment-item');
            const commentId = commentItem ? commentItem.dataset.commentId : null;

            switch (action) {
                case 'toggle-emoji-picker':
                    UI.toggleEmojiPicker();
                    break;
                case 'attach-image':
                    this.handleImageAttachment();
                    break;
                case 'remove-comment-image':
                    this.removeCommentImage();
                    break;
                case 'toggle-comment-like':
                    if (commentId) this.toggleCommentLike(commentId, actionTarget);
                    break;
                case 'edit-comment':
                    if (commentId) this.editComment(commentId);
                    break;
                case 'delete-comment':
                    if (commentId) this.deleteComment(commentId);
                    break;
                case 'reply-to-comment':
                    // TODO: Implement reply functionality if needed
                    break;
            }
        });

        const fileInput = this.modal.querySelector('.comment-image-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }
    },

    open() {
        const swiper = State.get('swiper');
        if (!swiper) return;

        const slideData = slidesData[swiper.realIndex];
        if (!slideData) {
            console.error('No slide data found for comments modal.');
            return;
        }

        this.updateCommentFormVisibility();
        this.modalBody.innerHTML = '<div class="loading-spinner"></div>';
        this.modal.classList.add('visible'); // Directly control visibility

        this.loadComments(slideData.id);
    },

    close() {
        this.modal.classList.remove('visible');
    },

    loadComments(slideId) {
        API.fetchComments(slideId)
            .then(response => {
                if (!response || !response.success) {
                    throw new Error(response?.data?.message || 'Failed to load comments');
                }
                const comments = response.data || [];
                const slideData = slidesData.find(s => s.id === slideId);
                if(slideData) {
                    slideData.comments = comments;
                }
                this.renderSortedComments(comments);
                setTimeout(() => {
                    if (this.modalBody.scrollHeight) this.modalBody.scrollTop = this.modalBody.scrollHeight;
                }, 100);
            })
            .catch(error => {
                console.error('Failed to load comments:', error);
                this.modalBody.innerHTML = `<div class="comment-load-error"><p>${Utils.getTranslation('commentLoadError')}</p></div>`;
            });
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
        UI.updateTranslations(); // To update the trigger text
        if (dropdown) dropdown.classList.remove('open');

        const swiper = State.get('swiper');
        const slideData = slidesData[swiper.realIndex];
        if (slideData && Array.isArray(slideData.comments)) {
            this.renderSortedComments(slideData.comments);
        }
    },

    renderSortedComments(comments) {
        const sortOrder = State.get("commentSortOrder");
        let sortedComments = [...comments];

        if (sortOrder === "popular") {
            sortedComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else {
            sortedComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        UI.renderComments(sortedComments);
    },

    async handleFormSubmit(e) {
        e.preventDefault();
        if (!State.get('isUserLoggedIn')) {
            UI.showAlert(Utils.getTranslation('likeAlert'), true);
            return;
        }

        const text = this.commentInput.value.trim();
        if (!text && !selectedCommentImage) return;

        const swiper = State.get('swiper');
        const slideData = slidesData[swiper.realIndex];
        const slideId = slideData.id;

        const submitButton = this.commentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            let imageUrl = null;
            if (selectedCommentImage) {
                const uploadResponse = await API.uploadCommentImage(selectedCommentImage);
                if (uploadResponse.success) {
                    imageUrl = uploadResponse.data.url;
                } else {
                    throw new Error(uploadResponse.data.message || 'Image upload failed');
                }
            }

            const commentResponse = await API.postComment(slideId, text, null, imageUrl);
            if (commentResponse.success) {
                this.commentInput.value = '';
                this.removeCommentImage();
                this.loadComments(slideId);
                // Update comment count on the slide
                const commentCountEl = document.querySelector(`.swiper-slide-active .comment-count`);
                if(commentCountEl) commentCountEl.textContent = Utils.formatCount(commentResponse.data.new_comment_count);
            } else {
                throw new Error(commentResponse.data.message || 'Failed to post comment');
            }
        } catch (error) {
            UI.showAlert(error.message, true);
        } finally {
            submitButton.disabled = false;
        }
    },

    handleImageAttachment() {
        this.modal.querySelector('.comment-image-input').click();
    },

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            UI.showAlert('Proszę wybrać plik graficzny.', true);
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            UI.showAlert('Plik jest za duży (max 5MB).', true);
            return;
        }

        selectedCommentImage = file;
        this.showImagePreview(file);
    },

    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreviewContainer.innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image-btn" data-action="remove-comment-image">&times;</button>
                </div>
            `;
            this.imagePreviewContainer.classList.add('visible');
        };
        reader.readAsDataURL(file);
    },

    removeCommentImage() {
        selectedCommentImage = null;
        this.imagePreviewContainer.innerHTML = '';
        this.imagePreviewContainer.classList.remove('visible');
        const fileInput = this.modal.querySelector('.comment-image-input');
        if (fileInput) fileInput.value = '';
    },

    toggleCommentLike(commentId, button) {
        if (!State.get('isUserLoggedIn')) {
            UI.showAlert(Utils.getTranslation('likeAlert'), true);
            return;
        }
        API.toggleCommentLike(commentId).then(response => {
            if (response.success) {
                button.classList.toggle('active', response.data.isLiked);
                const countEl = button.nextElementSibling;
                if(countEl) countEl.textContent = Utils.formatCount(response.data.likes);
            }
        });
    },

    editComment(commentId) {
        const commentTextEl = document.querySelector(`.comment-item[data-comment-id="${commentId}"] .comment-text`);
        const currentText = commentTextEl.textContent;
        const newText = prompt("Edytuj komentarz:", currentText);

        if (newText !== null && newText.trim() !== '' && newText !== currentText) {
            API.editComment(commentId, newText).then(response => {
                if (response.success) {
                    commentTextEl.textContent = response.data.text;
                    UI.showAlert('Komentarz zaktualizowany.');
                } else {
                    UI.showAlert(response.data.message || 'Błąd edycji.', true);
                }
            });
        }
    },

    deleteComment(commentId) {
        if (confirm("Czy na pewno chcesz usunąć ten komentarz?")) {
            API.deleteComment(commentId).then(response => {
                if (response.success) {
                    document.querySelector(`.comment-item[data-comment-id="${commentId}"]`).remove();
                    const commentCountEl = document.querySelector(`.swiper-slide-active .comment-count`);
                    if(commentCountEl) commentCountEl.textContent = Utils.formatCount(response.data.new_count);
                    UI.showAlert('Komentarz usunięty.');
                } else {
                     UI.showAlert(response.data.message || 'Błąd usuwania.', true);
                }
            });
        }
    },

    updateCommentFormVisibility() {
        if (State.get("isUserLoggedIn")) {
            this.commentForm.style.display = 'flex';
            this.loginPrompt.style.display = 'none';
        } else {
            this.commentForm.style.display = 'none';
            this.loginPrompt.style.display = 'block';
        }
    },
};

export { CommentsModal };