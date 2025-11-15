// ============================================================================
// AUTH MANAGER - Centralne zarządzanie autoryzacją i kolejką requestów
// ============================================================================

import { State } from './state.js';
import { Utils } from './utils.js';
import { PWA } from './pwa.js';

class AuthManager {
  constructor() {
    this.isProcessing = false;
    this.requestQueue = [];
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Waliduje odpowiedź z API
   */
  validateResponse(response, json) {
    if (!response || !response.ok) {
      throw new Error(`HTTP Error: ${response?.status || 'Unknown'}`);
    }

    if (!json || typeof json !== 'object') {
      throw new Error('Invalid JSON response');
    }

    if (typeof json.success !== 'boolean') {
      throw new Error('Missing success flag in response');
    }

    if (!json.success && !json.data?.message) {
      json.data = json.data || {};
      json.data.message = 'Unknown error occurred';
    }

    return json;
  }

  /**
   * Bezpieczne wykonanie requestu AJAX z kolejkowaniem
   */
  async safeRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Przetwarza kolejkę requestów (jeden na raz)
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { requestFn, resolve, reject } = this.requestQueue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), 50);
      }
    }
  }

  /**
   * Wykonaj request z retry logic
   */
  async requestWithRetry(requestFn, attempt = 1) {
    try {
      return await this.safeRequest(requestFn);
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.warn(`Request failed (attempt ${attempt}/${this.maxRetries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return this.requestWithRetry(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Wykonaj AJAX request z pełną walidacją i automatycznym odświeżaniem nonce.
   * @param {string} action - Nazwa akcji AJAX.
   * @param {object} data - Dane do wysłania.
   * @param {boolean} sendAsJSON - Jeśli true, wyślij dane jako application/json.
   */
  async ajax(action, data = {}, sendAsJson = false, { _bypassQueue = false, retries = 1 } = {}) {
    if (State.get('isMock')) {
        console.log(`%c[MOCK] Intercepted AJAX call: ${action}`, 'color: #00aaff;');
        if (action === 'tt_profile_get') {
            return Promise.resolve({ success: true, data: State.get('currentUser') });
        }
        return Promise.resolve({ success: true, data: { message: 'Mocked success' } });
    }

    const performFetch = async (currentNonce) => {
        const url = ajax_object.ajax_url;
        const headers = { 'Credentials': 'same-origin' };
        let body;

        // UWAGA: Logika została uproszczona, aby zawsze używać POST i przekazywać
        // akcję w ciele, co jest bardziej standardowe dla `admin-ajax.php`.
        if (sendAsJson) {
            headers['Content-Type'] = 'application/json; charset=UTF-8';
            // Nonce jest wysyłany w nagłówku, co jest dobrą praktyką dla API REST-podobnych.
            headers['X-WP-Nonce'] = currentNonce;
            // W ciele JSON wysyłamy tylko dane właściwe, akcja jest w URL
            body = JSON.stringify(data);
            // Akcja musi być w URL, aby WordPress wiedział, który hook `wp_ajax_` wywołać
            const queryParams = new URLSearchParams({ action });
            const requestUrl = `${url}?${queryParams.toString()}`;

            const response = await fetch(requestUrl, { method: 'POST', headers, body });
            const json = await response.json();
            return this.validateResponse(response, json);

        } else {
            headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            const bodyData = new URLSearchParams({ action, nonce: currentNonce, ...data });
            body = bodyData.toString();

            const response = await fetch(url, { method: 'POST', headers, body });
            const json = await response.json();
            return this.validateResponse(response, json);
        }
    };

    const requestFn = async () => {
      try {
        const validated = await performFetch(ajax_object.nonce);
        // Proactive nonce update
        if (validated.data?.new_nonce) {
          ajax_object.nonce = validated.data.new_nonce;
        }
        return validated;
      } catch (error) {
        if (retries > 0 && (error.message.includes('403') || error.message.includes('400')) && action !== 'tt_refresh_nonce') {
          console.warn(`[AUTH] Nonce error detected (${error.message}). Refreshing...`);

          const refreshResponse = await this.ajax('tt_refresh_nonce', {}, false, { _bypassQueue: true, retries: 0 });

          if (!refreshResponse.success || !refreshResponse.data?.nonce) {
            console.error('[AUTH] Failed to refresh nonce. Throwing original error.');
            throw error;
          }

          ajax_object.nonce = refreshResponse.data.nonce;
          console.log('[AUTH] Nonce refreshed. Retrying original request...');

          // Retry the original request with the new nonce
          return await performFetch(ajax_object.nonce);
        }
        throw error;
      }
    };

    // Jeśli flaga jest ustawiona, wykonaj żądanie bezpośrednio, omijając kolejkę.
    if (_bypassQueue) {
      return requestFn();
    }

    // W przeciwnym razie, użyj bezpiecznej kolejki.
    return this.safeRequest(requestFn);
  }

  /**
   * Zaloguj użytkownika
   */
  async login(username, password) {
    const result = await this.ajax('tt_ajax_login', {
      log: username,
      pwd: password
    });

    if (result.success) {
      if (!result.data) {
        throw new Error('Missing response data');
      }

      const {
        userData,
        slidesData,
        new_nonce,
        requires_first_login_setup
      } = result.data;

      if (!userData || !userData.user_id) {
        throw new Error('Invalid user data in response');
      }

      State.set('isUserLoggedIn', true);
      State.set('currentUser', userData);

      // Zawsze emituj zdarzenie, przekazując flagę `requires_first_login_setup`
      State.emit('user:login', {
        userData,
        slidesData,
        requires_first_login_setup: !!requires_first_login_setup
      });

      PWA.runStandaloneCheck();

      return {
        success: true,
        userData,
        slidesData,
        requires_first_login_setup: !!requires_first_login_setup
      };
    }

    throw new Error(result.data?.message || 'Login failed');
  }

  /**
   * Wyloguj użytkownika
   */
  async logout() {
    const result = await this.ajax('tt_ajax_logout');

    if (result.success) {
      if (result.data?.new_nonce) {
        ajax_object.nonce = result.data.new_nonce;
      }
      State.set('isUserLoggedIn', false);
      State.set('currentUser', null);
      State.emit('user:logout');
      PWA.runStandaloneCheck();
      return { success: true };
    }

    throw new Error(result.data?.message || 'Logout failed');
  }

  /**
   * Odśwież nonce
   */
  async refreshNonce() {
    const result = await this.ajax('tt_refresh_nonce');

    if (result.success && result.data?.nonce) {
      ajax_object.nonce = result.data.nonce;
      return result.data.nonce;
    }

    throw new Error('Failed to refresh nonce');
  }

  /**
   * Pobierz dane użytkownika z serwera
   */
  async getUserProfile() {
    const result = await this.ajax('tt_profile_get');

    if (result.success) {
      if (result.data) {
        State.set('currentUser', result.data);
      }
      return result.data;
    }

    throw new Error(result.data?.message || 'Failed to load profile');
  }

  /**
   * Sprawdź czy użytkownik jest zalogowany (po stronie serwera)
   */
  async checkLoginStatus() {
    try {
      const profile = await this.getUserProfile();
      State.set('isUserLoggedIn', !!profile?.user_id);
      return !!profile?.user_id;
    } catch (error) {
      State.set('isUserLoggedIn', false);
      return false;
    }
  }

  /**
   * Mockup logowania do celów testowych
   * @param {object} options - Opcje logowania
   * @param {string} [options.email='test@example.com'] - Email użytkownika
   * @param {boolean} [options.is_profile_complete=true] - Czy profil jest kompletny
   */
  mockLogin(options = {}) {
    const {
      email = 'test@example.com',
      is_profile_complete = true,
    } = options;

    State.set('isMock', true);
    console.log(`%c[MOCK] Logowanie jako ${email}, profil kompletny: ${is_profile_complete}`, 'color: #ff0055; font-weight: bold;');

    const mockUserData = {
      user_id: 123,
      username: 'testuser',
      email: email,
      display_name: 'Test User',
      first_name: is_profile_complete ? 'Test' : '',
      last_name: is_profile_complete ? 'User' : '',
      avatar: 'https://i.pravatar.cc/100?u=test',
      email_consent: true,
      email_language: 'pl',
      is_profile_complete: is_profile_complete,
    };

    const mockSlidesData = [
      {
        id: "slide-001",
        likeId: "1",
        user: "Test User",
        description: "To jest testowy slajd publiczny.",
        mp4Url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        avatar: "https://i.pravatar.cc/100?u=bunny",
        access: "public",
        initialLikes: 10,
        isLiked: false,
        initialComments: 2,
      },
      {
        id: "slide-002",
        likeId: "2",
        user: "Secret Agent",
        description: "To jest slajd typu 'secret'. Widoczny tylko dla zalogowanych.",
        mp4Url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        avatar: "https://i.pravatar.cc/100?u=agent",
        access: "secret",
        initialLikes: 42,
        isLiked: false,
        initialComments: 5,
      },
      {
        id: "slide-003",
        likeId: "3",
        user: "PWA Exclusive",
        description: "To jest slajd 'pwa-secret'. Dostępny tylko w aplikacji PWA.",
        mp4Url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        avatar: "https://i.pravatar.cc/100?u=pwa",
        access: "pwa-secret",
        initialLikes: 101,
        isLiked: false,
        initialComments: 8,
      }
    ];

    State.set('isUserLoggedIn', true);
    State.set('currentUser', mockUserData);

    State.emit('user:login', {
      userData: mockUserData,
      slidesData: mockSlidesData,
      requires_first_login_setup: !is_profile_complete, // DODANO FLAGĘ SETUPU
    });

    return { success: true, userData: mockUserData };
  }
}

// Singleton instance
export const authManager = new AuthManager();
export { AuthManager };