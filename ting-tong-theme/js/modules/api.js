import { authManager } from './auth-manager.js';

if (typeof window.TingTongData === "undefined") {
  console.warn(
    "`TingTongData` is not defined. Using mock data for standalone development.",
  );
  window.TingTongData = {
    isLoggedIn: false,
    slides: [],
  };
}

export const slidesData = window.TingTongData.slides || [];

slidesData.forEach((s) => {
  s.likeId = String(s.likeId);
});

async function _request(action, data = {}) {
  try {
    // Użyj AuthManager zamiast bezpośredniego fetch
    return await authManager.ajax(action, data);
  } catch (error) {
    console.error(`API Client Error for action "${action}":`, error);
    return { success: false, data: { message: error.message } };
  }
}

export const API = {
  uploadCommentImage: async (file) => {
    try {
      // Walidacja pliku
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large (max 5MB)');
      }

      const formData = new FormData();
      formData.append('action', 'tt_upload_comment_image');
      formData.append('nonce', ajax_object.nonce);
      formData.append('image', file);

      const response = await fetch(ajax_object.ajax_url, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const json = await response.json();

      // Walidacja odpowiedzi
      if (!json || typeof json !== 'object') {
        throw new Error('Invalid response format');
      }

      if (json.new_nonce) {
        ajax_object.nonce = json.new_nonce;
      }

      // Sprawdź czy sukces i czy mamy URL
      if (json.success && !json.data?.url) {
        throw new Error('Missing image URL in response');
      }

      return json;
    } catch (error) {
      console.error('API Client Error for image upload:', error);
      return {
        success: false,
        data: { message: error.message || 'Upload failed' }
      };
    }
  },
  login: (data) => _request("tt_ajax_login", data),
  logout: () => _request("tt_ajax_logout"),
  toggleLike: (postId) => _request("toggle_like", { post_id: postId }),
  refreshNonce: async () => {
    const json = await _request("tt_refresh_nonce");
    if (json.success && json.nonce) ajax_object.nonce = json.nonce;
    else console.error("Failed to refresh nonce.", json);
  },
  fetchSlidesData: () => _request("tt_get_slides_data_ajax"),
  fetchComments: (slideId) => _request("tt_get_comments", { slide_id: slideId }),
  postComment: (slideId, text, parentId = null, imageUrl = null) =>
    _request("tt_post_comment", {
      slide_id: slideId,
      text,
      parent_id: parentId,
      image_url: imageUrl,
    }),
  editComment: (slideId, commentId, newText) =>
    _request("tt_edit_comment", {
      slide_id: slideId,
      comment_id: commentId,
      text: newText,
    }),
  deleteComment: (slideId, commentId) =>
    _request("tt_delete_comment", {
      slide_id: slideId,
      comment_id: commentId,
    }),
  toggleCommentLike: (slideId, commentId) =>
    _request("tt_toggle_comment_like", {
      slide_id: slideId,
      comment_id: commentId,
    }),
};