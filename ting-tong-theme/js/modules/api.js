import { authManager } from './auth-manager.js';

export let slidesData = [];

async function _request(action, data = {}) {
  // UWAGA: Usunięto blok try/catch. Teraz `authManager.ajax` będzie rzucał błędy,
  // a obowiązkiem funkcji wywołującej (np. w tipping-modal.js) jest ich obsługa.
  // To jest poprawny wzorzec, który zapobiega "połykaniu" błędów.
  return await authManager.ajax(action, data);
}

export const API = {
  init: () => {
    if (typeof window.TingTongData !== "undefined" && window.TingTongData.slides) {
      slidesData.length = 0;
      const newSlides = window.TingTongData.slides || [];
      newSlides.forEach((s) => {
        s.likeId = String(s.likeId);
        slidesData.push(s);
      });
    }
  },

  createStripePaymentIntent: async (amount, currency) => {
    const result = await _request("tt_create_payment_intent", {
      amount,
      currency,
    });

    if (result.success && result.data?.clientSecret) {
        return result.data.clientSecret;
    }

    // Jeśli _request zwróci obiekt błędu (co nie powinno się już zdarzyć, ale dla bezpieczeństwa),
    // lub jeśli odpowiedź sukcesu nie ma clientSecret, rzuć błąd.
    throw new Error(result.data?.message || 'Failed to create Payment Intent.');
  },

  handleTipSuccess: async (paymentIntentId) => {
    return _request("tt_handle_tip_success", { payment_intent_id: paymentIntentId });
  },

  uploadCommentImage: async (file) => {
    try {
      if (!file || !(file instanceof File)) throw new Error('Invalid file');
      if (!file.type.startsWith('image/')) throw new Error('File must be an image');
      if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)');

      const formData = new FormData();
      formData.append('action', 'tt_upload_comment_image');
      formData.append('nonce', ajax_object.nonce);
      formData.append('image', file);

      const response = await fetch(ajax_object.ajax_url, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const json = await response.json();
      if (!json || typeof json !== 'object') throw new Error('Invalid response format');
      if (json.new_nonce) ajax_object.nonce = json.new_nonce;
      if (json.success && !json.data?.url) throw new Error('Missing image URL in response');
      return json;
    } catch (error) {
      console.error('API Client Error for image upload:', error);
      // Rzuć błąd dalej, aby UI mogło go obsłużyć
      throw error;
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
