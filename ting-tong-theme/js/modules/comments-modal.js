import { Config } from './config.js';
import { State } from './state.js';
import { Utils } from './utils.js';
import { API } from './api.js';
import { UI as ui } from './ui.js'

let selectedCommentImage = null;
const DOM = {
    commentsModal: document.getElementById("comments-modal-container"),
};
function initEmojiPicker() {
    const emojiPicker = document.querySelector('.emoji-picker');
    if (!emojiPicker || emojiPicker.children.length > 0) return;

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
    emojiPicker.appendChild(fragment);
}

function insertEmoji(emoji) {
    const input = document.querySelector('#comment-input');
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();

    hideEmojiPicker();
}

// Dodaj zmienną dla debounce na początku pliku (przed funkcją)
let emojiPickerTimeout = null;
let emojiPickerClickListener = null;

function toggleEmojiPicker() {
    const picker = document.querySelector('.emoji-picker');
    if (!picker) {
        console.warn('Emoji picker element not found');
        return;
    }

    // Debounce - zapobiegaj podwójnym kliknięciom
    if (emojiPickerTimeout) {
        return;
    }

    const isVisible = picker.classList.contains('visible');

    if (isVisible) {
        hideEmojiPicker();
    } else {
        picker.classList.add('visible');

        // Usuń stary listener jeśli istnieje
        if (emojiPickerClickListener) {
            document.removeEventListener('click', emojiPickerClickListener);
            emojiPickerClickListener = null;
        }

        // Dodaj nowy listener po micro-delay
        setTimeout(() => {
            emojiPickerClickListener = (e) => closeEmojiPickerOnClickOutside(e);
            document.addEventListener('click', emojiPickerClickListener, { once: true });
        }, 10);
    }

    // Debounce timer
    emojiPickerTimeout = setTimeout(() => {
        emojiPickerTimeout = null;
    }, 300);
}

function hideEmojiPicker() {
    const picker = document.querySelector('.emoji-picker');
    if (picker) {
        picker.classList.remove('visible');
    }

    // Usuń pending listener
    if (emojiPickerClickListener) {
        document.removeEventListener('click', emojiPickerClickListener);
        emojiPickerClickListener = null;
    }
}

function closeEmojiPickerOnClickOutside(e) {
    const picker = document.querySelector('.emoji-picker');
    const emojiBtn = document.querySelector('.emoji-btn');

    // Walidacja elementów
    if (!picker || !emojiBtn) {
        return;
    }

    // Sprawdź czy kliknięcie było poza pickerem i przyciskiem
    if (!picker.contains(e.target) && !emojiBtn.contains(e.target)) {
        hideEmojiPicker();
    }
}

function handleImageAttachment() {
    const fileInput = document.querySelector('.comment-image-input');

    if (!fileInput) {
        console.error('Comment image input not found');
        ui.showAlert(
            Utils.getTranslation('imageInputError') || 'Nie można załączyć obrazu',
            true
        );
        return;
    }

    // Sprawdź czy użytkownik jest zalogowany
    if (!State.get('isUserLoggedIn')) {
        ui.showAlert(Utils.getTranslation('likeAlert') || 'Zaloguj się, aby dodać obraz', true);
        return;
    }

    fileInput.click();
}

function handleImageSelect(e) {
    const file = e.target.files[0];

    if (!file) {
        return;
    }

    // Walidacja typu
    if (!file.type.startsWith('image/')) {
        ui.showAlert(
            Utils.getTranslation('fileSelectImageError') || 'Wybierz plik obrazu (JPG, PNG, GIF)',
            true
        );
        e.target.value = '';
        return;
    }

    // Walidacja rozmiaru
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        ui.showAlert(
            Utils.getTranslation('fileTooLargeError') || 'Obraz jest za duży. Maksymalny rozmiar: 5MB',
            true
        );
        e.target.value = '';
        return;
    }

    // Sprawdź czy można odczytać plik
    const reader = new FileReader();

    reader.onerror = () => {
        console.error('Failed to read file');
        ui.showAlert(
            Utils.getTranslation('fileReadError') || 'Nie można odczytać pliku',
            true
        );
        e.target.value = '';
    };

    reader.onload = () => {
        // Plik jest OK - zapisz go
        selectedCommentImage = file;
        showImagePreview(file);
    };

    // Rozpocznij odczyt (tylko dla walidacji)
    reader.readAsDataURL(file);

    // Wyczyść input żeby można było wybrać ten sam plik ponownie
    e.target.value = '';
}

function showImagePreview(file) {
    const container = document.querySelector('.image-preview-container');
    if (!container) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        container.innerHTML = `
      <div class="image-preview">
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image-btn" data-action="remove-comment-image">&times;</button>
      </div>
    `;
        container.classList.add('visible');
    };
    reader.readAsDataURL(file);
}

function removeCommentImage() {
    selectedCommentImage = null;
    const container = document.querySelector('.image-preview-container');
    if (container) {
        container.classList.remove('visible');
        container.innerHTML = '';
    }
}
function updateCommentFormVisibility() {
    const isLoggedIn = State.get("isUserLoggedIn");
    const form = document.getElementById("comment-form");
    const prompt = document.querySelector(".login-to-comment-prompt");

    if (form && prompt) {
        if (isLoggedIn) {
            form.style.display = "flex";
            prompt.style.display = "none";
        } else {
            form.style.display = "none";
            prompt.style.display = "block";
        }
    }
}
function focusCommentInput() {
    const input = document.querySelector('#comment-input');
    if (input) {
        setTimeout(() => {
            input.focus();

            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function scrollToComment(commentId) {
    const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentEl) {
        commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        commentEl.style.background = 'rgba(255, 0, 85, 0.1)';
        setTimeout(() => {
            commentEl.style.background = '';
        }, 1000);
    }
}

function openImageLightbox(imageUrl) {
    const lightbox = document.querySelector('.image-lightbox');
    if (!lightbox) return;

    const img = lightbox.querySelector('img');
    img.src = imageUrl;
    lightbox.classList.add('visible');

    document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
    const lightbox = document.querySelector('.image-lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('visible');
    document.body.style.overflow = '';
}
function renderComments(comments) {
    const modalBody = DOM.commentsModal.querySelector(".modal-body");
    if (!modalBody) return;

    modalBody.innerHTML = "";

    if (!comments || comments.length === 0) {
        modalBody.innerHTML =
            '<p class="no-comments-message" data-translate-key="noComments">Brak komentarzy. Bądź pierwszy!</p>';
        return;
    }

    const commentList = document.createElement("div");
    commentList.className = "comments-list";

    const repliesMap = new Map();
    comments.forEach((comment) => {
        if (comment.parentId) {
            if (!repliesMap.has(comment.parentId)) {
                repliesMap.set(comment.parentId, []);
            }
            repliesMap.get(comment.parentId).push(comment);
        }
    });

    const createCommentElement = (comment) => {
        const commentEl = document.createElement("div");
        commentEl.className = "comment-item";
        commentEl.dataset.commentId = comment.id;

        const avatarWrapper = document.createElement("div");
        avatarWrapper.className = "comment-avatar-wrapper";
        const avatarImg = document.createElement("img");
        avatarImg.src = comment.avatar;
        avatarImg.alt = "Avatar";
        avatarImg.className = "comment-avatar";
        avatarImg.loading = "lazy";
        avatarWrapper.appendChild(avatarImg);

        const main = document.createElement("div");
        main.className = "comment-main";

        const body = document.createElement("div");
        body.className = "comment-body";
        const userSpan = document.createElement("span");
        userSpan.className = "comment-user";
        userSpan.textContent = comment.user;
        const textP = document.createElement("p");
        textP.className = "comment-text";
        textP.textContent = comment.text;
        body.appendChild(userSpan);
        body.appendChild(textP);

        // DODAJ: Obsługa obrazu w komentarzu
        if (comment.image_url) {
            const imageDiv = document.createElement("div");
            imageDiv.className = "comment-image";
            imageDiv.innerHTML = `<img src="${comment.image_url}" alt="Comment image"
loading="lazy">`;
            imageDiv.addEventListener('click', () => openImageLightbox(comment.image_url));
            body.appendChild(imageDiv);
        }

        const footer = document.createElement("div");
        footer.className = "comment-footer";
        const timestampSpan = document.createElement("span");
        timestampSpan.className = "comment-timestamp";
        timestampSpan.textContent = new Date(comment.timestamp).toLocaleString();
        const replyBtn = document.createElement("button");
        replyBtn.className = "comment-action-btn comment-reply-btn";
        replyBtn.dataset.action = "reply-to-comment";
        replyBtn.textContent = Utils.getTranslation("commentReplyAction");

        const actionsWrapper = document.createElement("div");
        actionsWrapper.className = "comment-actions-wrapper";
        actionsWrapper.appendChild(replyBtn);

        if (comment.canEdit) {
            const editBtn = document.createElement("button");
            editBtn.className = "comment-action-btn comment-edit-btn";
            editBtn.dataset.action = "edit-comment";
            editBtn.textContent = Utils.getTranslation("commentEditAction");

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "comment-action-btn comment-delete-btn";
            deleteBtn.dataset.action = "delete-comment";
            deleteBtn.textContent = Utils.getTranslation("commentDeleteAction");

            actionsWrapper.appendChild(editBtn);
            actionsWrapper.appendChild(deleteBtn);
        }

        const likesDiv = document.createElement("div");
        likesDiv.className = "comment-likes";
        const likeBtn = document.createElement("button");
        likeBtn.className = `comment-like-btn ${comment.isLiked ? "active" : ""}`;
        likeBtn.dataset.action = "toggle-comment-like";
        likeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        const likeCountSpan = document.createElement("span");
        likeCountSpan.className = "comment-like-count";
        likeCountSpan.textContent = Utils.formatCount(comment.likes);
        likesDiv.appendChild(likeBtn);
        likesDiv.appendChild(likeCountSpan);

        footer.appendChild(timestampSpan);
        footer.appendChild(actionsWrapper);
        footer.appendChild(likesDiv);

        main.appendChild(body);
        main.appendChild(footer);

        commentEl.appendChild(avatarWrapper);
        commentEl.appendChild(main);

        return commentEl;
    };

    const topLevelComments = comments.filter((c) => !c.parentId);

    topLevelComments.forEach((comment) => {
        const threadWrapper = document.createElement("div");
        threadWrapper.className = "comment-thread";

        const parentEl = createCommentElement(comment);
        threadWrapper.appendChild(parentEl);

        const commentReplies = repliesMap.get(comment.id);
        if (commentReplies && commentReplies.length > 0) {
            const repliesContainer = document.createElement("div");
            repliesContainer.className = "comment-replies";

            commentReplies.forEach((reply) => {
                const replyEl = createCommentElement(reply);
                repliesContainer.appendChild(replyEl);
            });

            const toggleBtn = document.createElement("button");
            toggleBtn.className = "toggle-replies-btn";
            const updateToggleText = () => {
                const isVisible = repliesContainer.classList.contains("visible");
                const key = isVisible ? "toggleRepliesHide" : "toggleRepliesShow";
                const text = Utils.getTranslation(key).replace(
                    "{count}",
                    commentReplies.length,
                );
                toggleBtn.innerHTML = `<span class="arrow"></span> ${text}`;
            };

            toggleBtn.addEventListener("click", () => {
                repliesContainer.classList.toggle("visible");
                toggleBtn.classList.toggle("expanded");
                updateToggleText();
            });

            updateToggleText();

            parentEl.querySelector(".comment-main").appendChild(toggleBtn);
            threadWrapper.appendChild(repliesContainer);
        }
        commentList.appendChild(threadWrapper);
    });

    modalBody.appendChild(commentList);
}
export const CommentsModal = {
    init() {
        initEmojiPicker();

        // Setup file input handler
        const fileInput = document.querySelector('.comment-image-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleImageSelect);
        }

        // Setup lightbox close
        const lightboxClose = document.querySelector('.image-lightbox-close');
        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeImageLightbox);
        }

        const lightbox = document.querySelector('.image-lightbox');
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    closeImageLightbox();
                }
            });
        }
    },
    renderComments,
    updateCommentFormVisibility,
    focusCommentInput,
    scrollToComment,
    openImageLightbox,
    closeImageLightbox,
    toggleEmojiPicker,
    hideEmojiPicker,
    handleImageAttachment,
    removeCommentImage,
    selectedCommentImage: () => selectedCommentImage
};