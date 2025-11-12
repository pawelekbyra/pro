import { Config } from './config.js';
import { State } from './state.js';
import { Utils } from './utils.js';
import { API, slidesData } from './api.js';

let selectedCommentImage = null;
const DOM = {};
let currentSort = 'newest';

function sortAndRerenderComments() {
    const swiper = State.get('swiper');
    if (!swiper) return;
    const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;
    const slideData = slidesData.find(s => s.id === slideId);

    if (slideData && slideData.comments) {
        const sortedComments = [...slideData.comments].sort((a, b) => {
            if (currentSort === 'popular') {
                return b.likes - a.likes;
            }
            // Default to newest
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        renderComments(sortedComments);
    }
}


function cacheDOM() {
    DOM.commentsModal = document.getElementById("comments-modal-container");
    if (!DOM.commentsModal) {
        console.error("Comments modal container not found in cacheDOM!");
        return;
    }
    DOM.modalBody = DOM.commentsModal.querySelector(".modal-body");
    DOM.emojiPicker = DOM.commentsModal.querySelector('.emoji-picker');
    DOM.commentInput = DOM.commentsModal.querySelector('#comment-input');
    DOM.fileInput = DOM.commentsModal.querySelector('.comment-image-input');
    DOM.imagePreviewContainer = DOM.commentsModal.querySelector('.image-preview-container');
    DOM.form = DOM.commentsModal.querySelector('#comment-form');
    DOM.prompt = DOM.commentsModal.querySelector('.login-to-comment-prompt');
    DOM.lightbox = document.querySelector('.image-lightbox');
    DOM.lightboxClose = document.querySelector('.image-lightbox-close');
}

async function handleCommentAction(e) {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    const commentItem = actionTarget.closest('.comment-item');
    if (!commentItem) return;

    const commentId = commentItem.dataset.commentId;
    const swiper = State.get('swiper');
    const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;

    switch (action) {
        case 'toggle-comment-like':
            // Basic optimistic update
            actionTarget.classList.toggle('active');
            try {
                const result = await API.toggleCommentLike(slideId, commentId);
                if (!result.success) {
                    actionTarget.classList.toggle('active'); // Revert on failure
                    alert(result.data?.message || 'Failed to toggle like.');
                }
            } catch (error) {
                actionTarget.classList.toggle('active'); // Revert optimistic update
                if (error.message && error.message.includes('403')) {
                    alert(Utils.getTranslation('mustBeLoggedIn'));
                } else {
                    alert(Utils.getTranslation('unknownError'));
                }
            }
            // Full re-render would be better, but this is a quick fix
            const countEl = commentItem.querySelector('.comment-like-count');
            if (countEl && result.data?.likes !== undefined) {
                countEl.textContent = Utils.formatCount(result.data.likes);
            }
            break;
        case 'edit-comment':
             const currentText = commentItem.querySelector('.comment-text').textContent;
             const newText = prompt("Edit your comment:", currentText);
             if (newText && newText.trim() !== currentText) {
                try {
                    const result = await API.editComment(slideId, commentId, newText.trim());
                    if (result.success) {
                        commentItem.querySelector('.comment-text').textContent = newText.trim();
                    } else {
                        alert(result.data?.message || 'Failed to edit comment.');
                    }
                } catch (error) {
                    if (error.message && error.message.includes('403')) {
                        alert(Utils.getTranslation('mustBeLoggedIn'));
                    } else {
                        alert(Utils.getTranslation('unknownError'));
                    }
                }
             }
            break;
        case 'delete-comment':
             if (confirm("Are you sure you want to delete this comment?")) {
                try {
                    const result = await API.deleteComment(slideId, commentId);
                    if (result.success) {
                        commentItem.remove();
                    } else {
                        alert(result.data?.message || 'Failed to delete comment.');
                    }
                } catch (error) {
                    if (error.message && error.message.includes('403')) {
                        alert(Utils.getTranslation('mustBeLoggedIn'));
                    } else {
                        alert(Utils.getTranslation('unknownError'));
                    }
                }
             }
            break;
    }
}


async function handleFormSubmit(e) {
    e.preventDefault();
    const text = DOM.commentInput.value.trim();
    if (!text && !selectedCommentImage) return;

    const swiper = State.get('swiper');
    if (!swiper) return;

    const slideId = swiper.slides[swiper.activeIndex].dataset.slideId;
    const button = DOM.form.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
        let imageUrl = null;
        if (selectedCommentImage) {
            const uploadResult = await API.uploadCommentImage(selectedCommentImage);
            if (uploadResult.success) {
                imageUrl = uploadResult.data.url;
            } else {
                throw new Error(uploadResult.data.message || 'Image upload failed');
            }
        }

        const postResult = await API.postComment(slideId, text, null, imageUrl);
        if (postResult.success && postResult.data) {
            DOM.commentInput.value = '';
            removeCommentImage();

            // Optimistic update: add the new comment to the UI immediately
            const slideData = slidesData.find(s => s.id === slideId);
            if (slideData) {
                if (!slideData.comments) {
                    slideData.comments = [];
                }
                slideData.comments.push(postResult.data);
                slideData.initialComments = slideData.comments.length;

                // Re-render with the new comment
                sortAndRerenderComments();

                // Update the comment count on the slide
                const countElement = document.querySelector(`.swiper-slide-active .comment-count`);
                if (countElement) {
                    countElement.textContent = Utils.formatCount(slideData.initialComments);
                }
            }
        } else {
            throw new Error(postResult.data?.message || 'Failed to post comment');
        }

    } catch (error) {
        console.error("Comment post error:", error);
        if (error.message && error.message.includes('403')) {
            alert(Utils.getTranslation('mustBeLoggedInToComment'));
        } else {
            alert(error.message || Utils.getTranslation('unknownError'));
        }
    } finally {
        button.disabled = false;
    }
}


function initEmojiPicker() {
    if (!DOM.emojiPicker || DOM.emojiPicker.children.length > 0) return;
    const fragment = document.createDocumentFragment();
    Config.EMOJI_LIST.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-item';
        btn.textContent = emoji;
        btn.setAttribute('aria-label', `Insert ${emoji}`);
        btn.addEventListener('click', () => insertEmoji(emoji));
        fragment.appendChild(btn);
    });
    DOM.emojiPicker.appendChild(fragment);
}

function insertEmoji(emoji) {
    if (!DOM.commentInput) return;
    const { selectionStart, selectionEnd, value } = DOM.commentInput;
    DOM.commentInput.value = value.substring(0, selectionStart) + emoji + value.substring(selectionEnd);
    DOM.commentInput.selectionStart = DOM.commentInput.selectionEnd = selectionStart + emoji.length;
    DOM.commentInput.focus();
    hideEmojiPicker();
}

function toggleEmojiPicker() {
    if (!DOM.emojiPicker) return;
    DOM.emojiPicker.classList.toggle('visible');
}

function hideEmojiPicker() {
    if (!DOM.emojiPicker) return;
    DOM.emojiPicker.classList.remove('visible');
}

function handleImageAttachment() {
    if (!DOM.fileInput) return;
    if (!State.get('isUserLoggedIn')) {
        console.warn("User not logged in, cannot attach image.");
        return;
    }
    DOM.fileInput.click();
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        console.warn("Invalid file type");
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
        console.warn("File is too large");
        return;
    }

    selectedCommentImage = file;
    showImagePreview(file);
    e.target.value = '';
}

function showImagePreview(file) {
    if (!DOM.imagePreviewContainer) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        DOM.imagePreviewContainer.innerHTML = `
      <div class="image-preview">
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image-btn" data-action="remove-comment-image">&times;</button>
      </div>
    `;
        DOM.imagePreviewContainer.classList.add('visible');
    };
    reader.readAsDataURL(file);
}

function removeCommentImage() {
    selectedCommentImage = null;
    if (DOM.imagePreviewContainer) {
        DOM.imagePreviewContainer.classList.remove('visible');
        DOM.imagePreviewContainer.innerHTML = '';
    }
}

function openImageLightbox(imageUrl) {
    if (!DOM.lightbox) return;
    DOM.lightbox.querySelector('img').src = imageUrl;
    DOM.lightbox.classList.add('visible');
}

function closeImageLightbox() {
    if (!DOM.lightbox) return;
    DOM.lightbox.classList.remove('visible');
}

function renderComments(comments) {
    if (!DOM.modalBody) {
        console.error("Cannot render comments: modal body is not cached.");
        return;
    }

    DOM.modalBody.innerHTML = `<div class="loading-spinner"></div>`;

    if (!comments || comments.length === 0) {
        DOM.modalBody.innerHTML = `<p class="no-comments-message" data-translate-key="noComments">${Utils.getTranslation('noComments')}</p>`;
        return;
    }

    const commentList = document.createElement("div");
    commentList.className = "comments-list";

    const commentTemplate = document.getElementById('comment-template');

    if (!commentTemplate) {
        console.error("Comment template not found!");
        DOM.modalBody.innerHTML = `<p class="no-comments-message">Error: Comment template is missing.</p>`;
        return;
    }

    comments.forEach(comment => {
        const templateClone = commentTemplate.content.cloneNode(true);
        const commentItem = templateClone.querySelector('.comment-item');

        commentItem.dataset.commentId = comment.id;

        templateClone.querySelector('.comment-user').textContent = comment.user;
        templateClone.querySelector('.comment-avatar img').src = comment.avatar;
        templateClone.querySelector('.comment-text').textContent = comment.text;
        templateClone.querySelector('.comment-timestamp').textContent = Utils.formatTimeAgo(comment.timestamp);
        templateClone.querySelector('.comment-like-count').textContent = Utils.formatCount(comment.likes);

        const likeBtn = templateClone.querySelector('.comment-like-btn');
        if (comment.isLiked) {
            likeBtn.classList.add('active');
        }

        const commentImageAttachment = templateClone.querySelector('.comment-image-attachment');
        if (comment.image_url) {
            commentImageAttachment.style.display = 'block';
            templateClone.querySelector('.comment-image').src = comment.image_url;
            templateClone.querySelector('.comment-image').addEventListener('click', () => openImageLightbox(comment.image_url));
        }

        if (comment.canEdit) {
             templateClone.querySelector('.comment-options').style.display = 'block';
        }

        commentList.appendChild(templateClone);
    });

    DOM.modalBody.appendChild(commentList);
}

function updateCommentFormVisibility() {
    const isLoggedIn = State.get("isUserLoggedIn");
    if (DOM.form && DOM.prompt) {
        DOM.form.style.display = isLoggedIn ? "flex" : "none";
        DOM.prompt.style.display = isLoggedIn ? "none" : "block";
    }
}

export const CommentsModal = {
    init() {
        cacheDOM();

        if (!DOM.commentsModal) {
            console.error("CommentsModal.init() failed: Modal container not found.");
            return;
        }

        initEmojiPicker();

        if (DOM.fileInput) {
            DOM.fileInput.addEventListener('change', handleImageSelect);
        }

        if (DOM.lightboxClose) {
            DOM.lightboxClose.addEventListener('click', closeImageLightbox);
        }

        if (DOM.lightbox) {
            DOM.lightbox.addEventListener('click', (e) => {
                if (e.target === DOM.lightbox) {
                    closeImageLightbox();
                }
            });
        }

        if (DOM.form) {
            DOM.form.addEventListener('submit', handleFormSubmit);
        }

        if (DOM.modalBody) {
            DOM.modalBody.addEventListener('click', handleCommentAction);
        }

        const sortDropdown = DOM.commentsModal.querySelector('.sort-dropdown');
        if (sortDropdown) {
            const trigger = sortDropdown.querySelector('.sort-trigger');
            const options = sortDropdown.querySelectorAll('.sort-option');

            trigger.addEventListener('click', () => sortDropdown.classList.toggle('open'));

            options.forEach(option => {
                option.addEventListener('click', () => {
                    const newSort = option.dataset.sort;
                    if (newSort !== currentSort) {
                        currentSort = newSort;
                        sortAndRerenderComments();

                        // Update UI
                        sortDropdown.querySelector('.current-sort').textContent = option.textContent;
                        options.forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                    }
                    sortDropdown.classList.remove('open');
                });
            });

            document.addEventListener('click', (e) => {
                if (!sortDropdown.contains(e.target)) {
                    sortDropdown.classList.remove('open');
                }
            });
        }

        console.log("CommentsModal initialized successfully.");
    },
    renderComments,
    updateCommentFormVisibility,
    toggleEmojiPicker,
    hideEmojiPicker,
    handleImageAttachment,
    removeCommentImage,
    selectedCommentImage: () => selectedCommentImage
};