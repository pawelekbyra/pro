import { authManager } from './auth-manager.js';

export let slidesData = [];

async function _request(action, data = {}, sendAsJson = false) {
  try {
    // Użyj AuthManager zamiast bezpośredniego fetch, przekazując flagę sendAsJson
    return await authManager.ajax(action, data, sendAsJson);
  } catch (error) {
    console.error(`API Client Error for action "${action}":`, error);
    return { success: false, data: { message: error.message } };
  }
}

export const API = {
  init: () => {
    if (typeof window.TingTongData !== "undefined" && window.TingTongData.slides) {
      // Wyczyść tablicę i wstaw nowe dane.
      slidesData.length = 0;
      const newSlides = window.TingTongData.slides || [];
      newSlides.forEach((s) => {
        s.likeId = String(s.likeId);
        slidesData.push(s);
      });
    } else {
      console.warn(
        "`TingTongData` is not defined or has no slides. Using mock data for standalone development.",
      );
    }
  },

  // === NOWE METODY STRIPE (NAPRAWIONY EKSPORT) ===

  /**
   * Tworzy Payment Intent na serwerze i zwraca client_secret.
   * Wyrzuca błąd w przypadku niepowodzenia.
   */
  createStripePaymentIntent: async (amount, currency, countryCodeHint) => { // DODANO HINT
    const result = await _request("tt_create_payment_intent", {
      amount,
      currency,
      country_code_hint: countryCodeHint, // PRZEKAZANIE HINTU
    });

    if (result.success && result.data?.clientSecret) {
        return result.data.clientSecret;
    }

    throw new Error(result.data?.message || 'Failed to create Payment Intent.');
  },

  /**
   * AJAX: Zapisuje Lokalizację (locale) w profilu WP użytkownika.
   */
  updateLocale: (locale) => _request("tt_update_locale", { locale }), // DODANO NOWĄ METODĘ

  /**
   * Wywołuje weryfikację płatności po stronie serwera po udanej transakcji.
   */
  handleTipSuccess: async (paymentIntentId) => {
    return _request("tt_handle_tip_success", { payment_intent_id: paymentIntentId });
  },

  // === ISTNIEJĄCE METODY ===

  getSSOToken: () => _request("tt_generate_sso_token"),

  /*
  uploadCommentImage: async (file) => {
    try {
      // ... (pozostała logika bez zmian)
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

      if (!json || typeof json !== 'object') {
        throw new Error('Invalid response format');
      }

      if (json.new_nonce) {
        ajax_object.nonce = json.new_nonce;
      }

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
  */

  login: (data) => _request("tt_ajax_login", data),
  logout: () => _request("tt_ajax_logout"),
  toggleLike: (postId) => _request("toggle_like", { post_id: postId }),
  refreshNonce: async () => {
    const json = await _request("tt_refresh_nonce");
    if (json.success && json.nonce) ajax_object.nonce = json.nonce;
    else console.error("Failed to refresh nonce.", json);
  },
  fetchSlidesData: () => _request("tt_get_slides_data_ajax"),
  getNewCrowdfundingStats: () => _request("tt_get_crowdfunding_stats"),
  saveSettings: (data) => _request("tt_save_settings", data),
  uploadAvatar: (data) => _request("tt_avatar_upload", data),
  updateProfile: (data) => _request("tt_profile_update", data),
  changePassword: (data) => _request("tt_password_change", data),
  deleteAccount: (data) => _request("tt_account_delete", data),
  loadUserProfile: () => _request("tt_profile_get"),

  /**
  * Pobiera podpisany token SSO dla FastComments (dla zalogowanych lub gości).
  */
  getFastCommentsSSOToken: async () => {
    // Używamy opcji `retries: 0` dla tokenów SSO, aby uniknąć pętli
    const result = await _request("tt_fastcomments_sso_token");

    if (result.success && result.data?.ssoToken) {
      return result.data;
    }

    // Zwróć null lub rzuć błąd w zależności od potrzeb logiki klienta
    return null;
  },

  // Nowa metoda do czyszczenia tokena z pamięci (dla bezpieczeństwa)
  clearFastCommentsSSOToken: async () => {
    // W obecnym, bezstanowym modelu to jest No-op, ale zachowaj dla API
    return Promise.resolve(true);
  },

  /**
   * Zapisuje subskrypcję Web Push na serwerze.
   * @param {PushSubscription} subscription Obiekt subskrypcji z przeglądarki.
   */
  savePushSubscription: (subscription) => {
    // Używamy _request z opcją `sendAsJson = true`
    return _request("tt_save_push_subscription", subscription, true);
  },
};
