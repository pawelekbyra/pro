// ============================================================================
// AUTH MANAGER - Centralne zarządzanie autoryzacją i kolejką requestów
// ============================================================================

import { State } from './state.js';
import { Utils } from './utils.js';

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
   */
  async ajax(action, data = {}) {
    if (State.get('isMock')) {
        console.log(`%c[MOCK] Intercepted AJAX call: ${action}`, 'color: #00aaff;');
        if (action === 'tt_profile_get') {
            return Promise.resolve({ success: true, data: State.get('currentUser') });
        }
        return Promise.resolve({ success: true, data: { message: 'Mocked success' } });
    }

    // Cała operacja (wraz z potencjalnym ponowieniem) jest opakowana w `requestFn`,
    // aby `safeRequest` mogło ją wykonać jako atomową transakcję.
    const requestFn = async () => {
      try {
        // Pierwsza próba wykonania żądania
        const body = new URLSearchParams({ action, nonce: ajax_object.nonce, ...data });
        const response = await fetch(ajax_object.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          credentials: 'same-origin',
          body
        });
        const json = await response.json();
        const validated = this.validateResponse(response, json);

        if (validated.data?.new_nonce) {
          ajax_object.nonce = validated.data.new_nonce;
        }
        return validated;

      } catch (error) {
        // Jeśli błąd to 403 (Forbidden), spróbuj odświeżyć nonce i ponów żądanie jeden raz.
        if (error.message.includes('403') && action !== 'tt_refresh_nonce') {
          console.warn('[AUTH] Otrzymano błąd 403. Prawdopodobnie wygasł nonce. Próba odświeżenia i ponowienia...');

          // Krok 1: Odśwież nonce (bezpośrednie wywołanie fetch, aby uniknąć deadlocka w kolejce)
          const refreshBody = new URLSearchParams({ action: 'tt_refresh_nonce' });
          const refreshResponse = await fetch(ajax_object.ajax_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            credentials: 'same-origin',
            body: refreshBody,
          });
          const refreshJson = await refreshResponse.json();
          const refreshValidated = this.validateResponse(refreshResponse, refreshJson);

          if (!refreshValidated.success || !refreshValidated.data?.nonce) {
            console.error('[AUTH] Nie udało się odświeżyć nonce. Oryginalny błąd zostanie rzucony.');
            throw error; // Rzuć oryginalny błąd, jeśli odświeżenie się nie powiodło
          }
          ajax_object.nonce = refreshValidated.data.nonce;
          console.log('[AUTH] Nonce został pomyślnie odświeżony. Ponawianie oryginalnego żądania...');

          // Krok 2: Ponów oryginalne żądanie z nowym nonce
          const retryBody = new URLSearchParams({ action, nonce: ajax_object.nonce, ...data });
          const retryResponse = await fetch(ajax_object.ajax_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            credentials: 'same-origin',
            body: retryBody,
          });
          const retryJson = await retryResponse.json();
          const retryValidated = this.validateResponse(retryResponse, retryJson);
          if (retryValidated.data?.new_nonce) {
            ajax_object.nonce = retryValidated.data.new_nonce;
          }
          return retryValidated;
        }

        // Dla wszystkich innych błędów, rzuć je dalej, aby mogły być obsłużone wyżej.
        throw error;
      }
    };

    // Zastępujemy `requestWithRetry` na rzecz `safeRequest`, ponieważ cała logika ponawiania
    // jest teraz zawarta w `requestFn`. `safeRequest` zapewnia, że operacja jest kolejkowana.
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

      State.emit('user:login', {
        userData,
        slidesData,
        requires_first_login_setup: !!requires_first_login_setup
      });

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
      State.set('isUserLoggedIn', false);
      State.set('currentUser', null);
      State.emit('user:logout');
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
    });

    return { success: true, userData: mockUserData };
  }
}

// Singleton instance
export const authManager = new AuthManager();
export { AuthManager };