// ============================================================================
// MODUŁ: First Login Modal - Wymuszenie konfiguracji konta
// ============================================================================
// Umieść w: ting-tong-theme/js/modules/first-login-modal.js

import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';

let selectedAvatarFile = null;

/**
 * Pokazuje modal pierwszego logowania
 * @param {string} userEmail - Email użytkownika
 */
function showFirstLoginModal(userEmail) {
  const modal = document.getElementById('firstLoginModal');
  if (!modal) return;

  // Ustaw email
  const emailEl = document.getElementById('firstLoginEmail');
  if (emailEl) emailEl.textContent = userEmail;

  // Pokaż modal za pomocą UI.openModal
  UI.openModal(modal);

  // Focus pierwszy input
  setTimeout(() => {
    document.getElementById('firstLoginFirstName')?.focus();
  }, 400);
}

/**
 * Ukrywa modal pierwszego logowania
 */
function hideFirstLoginModal() {
  const modal = document.getElementById('firstLoginModal');
  if (!modal) return;

  modal.classList.remove('visible');
  document.body.style.overflow = '';
}

/**
 * Inicjalizacja modalu
 */
function init() {
  setupEventListeners();
  setupPasswordStrength();
}

/**
 * Konfiguracja event listenerów
 */
function setupEventListeners() {
  // Avatar edit button
  const avatarEditBtn = document.getElementById('firstLoginAvatarEditBtn');
  const avatarFileInput = document.getElementById('firstLoginAvatarFileInput');

  if (avatarEditBtn && avatarFileInput) {
    avatarEditBtn.addEventListener('click', () => {
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', handleAvatarSelect);
  }

  // Form submit
  const form = document.getElementById('firstLoginForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

}

/**
 * Obsługa wyboru avatara
 */
function handleAvatarSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Walidacja
  if (!file.type.startsWith('image/')) {
    showError('Wybierz plik obrazu (JPG, PNG, GIF)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError('Obraz jest za duży. Maksymalny rozmiar: 5MB');
    return;
  }

  selectedAvatarFile = file;

  // Preview
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = document.getElementById('firstLoginAvatarImg');
    if (img) {
      img.src = event.target.result;
    }
  };
  reader.readAsDataURL(file);

  // Wyczyść input
  e.target.value = '';
}

/**
 * Konfiguracja wskaźnika siły hasła
 */
function setupPasswordStrength() {
  const newPasswordInput = document.getElementById('firstLoginNewPassword');
  const indicator = document.getElementById('passwordStrengthIndicator');
  const bar = document.getElementById('passwordStrengthBar');
  const text = document.getElementById('passwordStrengthText');

  if (!newPasswordInput || !indicator || !bar || !text) return;

  newPasswordInput.addEventListener('input', () => {
    const password = newPasswordInput.value;

    if (password.length === 0) {
      indicator.classList.remove('visible');
      return;
    }

    indicator.classList.add('visible');

    // Oblicz siłę hasła
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Klasyfikacja
    let level = 'weak';
    let levelText = Utils.getTranslation('passwordStrengthWeak');

    if (strength >= 4) {
      level = 'strong';
      levelText = Utils.getTranslation('passwordStrengthStrong');
    } else if (strength >= 2) {
      level = 'medium';
      levelText = Utils.getTranslation('passwordStrengthMedium');
    }

    // Aktualizuj UI
    bar.className = `password-strength-bar ${level}`;
    text.className = `password-strength-text ${level}`;
    text.textContent = levelText;
  });
}

/**
 * Obsługa wysłania formularza
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const button = document.getElementById('firstLoginSubmitBtn');
  const originalText = button.textContent;

  // Pobierz dane z formularza
  const firstName = document.getElementById('firstLoginFirstName').value.trim();
  const lastName = document.getElementById('firstLoginLastName').value.trim();
  const currentPassword = document.getElementById('firstLoginCurrentPassword').value;
  const newPassword = document.getElementById('firstLoginNewPassword').value;
  const confirmPassword = document.getElementById('firstLoginConfirmPassword').value;

  // Walidacja
  if (!firstName || !lastName) {
    showError(Utils.getTranslation('firstLoginErrorMissingNames'));
    return;
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    showError(Utils.getTranslation('firstLoginErrorMissingPasswords'));
    return;
  }

  if (newPassword.length < 8) {
    showError(Utils.getTranslation('passwordLengthError'));
    return;
  }

  if (newPassword !== confirmPassword) {
    showError(Utils.getTranslation('passwordsMismatchError'));
    return;
  }

  // Disable button
  button.disabled = true;
  button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('savingButtonText')}`;

  try {
    // 1. Upload avatara (jeśli wybrano)
    let avatarUrl = null;
    if (selectedAvatarFile) {
      UI.showToast(Utils.getTranslation('uploadingAvatar'));
      const avatarResult = await uploadAvatar(selectedAvatarFile);

      if (avatarResult.success) {
        avatarUrl = avatarResult.data.url;
      } else {
        throw new Error(avatarResult.data?.message || Utils.getTranslation('avatarUploadError'));
      }
    }

    // 2. Aktualizuj profil
    const profileResult = await updateProfile({
      first_name: firstName,
      last_name: lastName,
    });

    if (!profileResult.success) {
      throw new Error(profileResult.data?.message || Utils.getTranslation('profileUpdateError'));
    }

    // 3. Zmień hasło
    const passwordResult = await changePassword({
      current_password: currentPassword,
      new_password_1: newPassword,
      new_password_2: confirmPassword,
    });

    if (!passwordResult.success) {
      throw new Error(passwordResult.data?.message || Utils.getTranslation('passwordChangeFailedError'));
    }

    // 4. Oznacz, że użytkownik ukończył konfigurację
    await markFirstLoginComplete();

    // Sukces!
    showSuccess(Utils.getTranslation('firstLoginSuccess'));

    // Odśwież dane użytkownika w UI
    if (profileResult.data) {
      const userData = {
        ...profileResult.data,
        avatar: avatarUrl || profileResult.data.avatar,
      };

      // Aktualizuj panel konta jeśli istnieje moduł
      if (window.AccountPanel && window.AccountPanel.populateProfileForm) {
        window.AccountPanel.populateProfileForm(userData);
      }
    }

    // Zamknij modal po 1.5s
    setTimeout(() => {
      hideFirstLoginModal();
      UI.showToast(Utils.getTranslation('firstLoginWelcomeBack'));

      // Odśwież stronę aby pobrać nowe dane
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }, 1500);

  } catch (error) {
    showError(error.message);
    button.disabled = false;
    button.textContent = originalText;
  }
}

/**
 * Upload avatara
 */
async function uploadAvatar(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;

      try {
        const response = await fetch(ajax_object.ajax_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
          credentials: 'same-origin',
          body: new URLSearchParams({
            action: 'tt_avatar_upload',
            nonce: ajax_object.nonce,
            image: dataUrl,
          }),
        });

        const result = await response.json();
        if (result.new_nonce) ajax_object.nonce = result.new_nonce;
        resolve(result);
      } catch (error) {
        resolve({ success: false, data: { message: error.message } });
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Aktualizuj profil
 */
async function updateProfile(data) {
  try {
    const response = await fetch(ajax_object.ajax_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      credentials: 'same-origin',
      body: new URLSearchParams({
        action: 'tt_profile_update',
        nonce: ajax_object.nonce,
        ...data,
      }),
    });

    const result = await response.json();
    if (result.new_nonce) ajax_object.nonce = result.new_nonce;
    return result;
  } catch (error) {
    return { success: false, data: { message: error.message } };
  }
}

/**
 * Zmień hasło
 */
async function changePassword(data) {
  try {
    const response = await fetch(ajax_object.ajax_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      credentials: 'same-origin',
      body: new URLSearchParams({
        action: 'tt_password_change',
        nonce: ajax_object.nonce,
        ...data,
      }),
    });

    const result = await response.json();
    if (result.new_nonce) ajax_object.nonce = result.new_nonce;
    return result;
  } catch (error) {
    return { success: false, data: { message: error.message } };
  }
}

/**
 * Oznacz ukończenie pierwszego logowania
 */
async function markFirstLoginComplete() {
  try {
    const response = await fetch(ajax_object.ajax_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      credentials: 'same-origin',
      body: new URLSearchParams({
        action: 'tt_mark_first_login_complete',
        nonce: ajax_object.nonce,
      }),
    });

    const result = await response.json();
    if (result.new_nonce) ajax_object.nonce = result.new_nonce;
    return result;
  } catch (error) {
    return { success: false, data: { message: error.message } };
  }
}

/**
 * Pokaż komunikat błędu
 */
function showError(message) {
  const errorEl = document.getElementById('firstLoginError');
  const successEl = document.getElementById('firstLoginSuccess');

  if (successEl) {
    successEl.classList.remove('show');
    successEl.style.display = 'none';
  }

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    requestAnimationFrame(() => errorEl.classList.add('show'));

    setTimeout(() => {
      errorEl.classList.remove('show');
      setTimeout(() => (errorEl.style.display = 'none'), 300);
    }, 5000);
  }
}

/**
 * Pokaż komunikat sukcesu
 */
function showSuccess(message) {
  const successEl = document.getElementById('firstLoginSuccess');
  const errorEl = document.getElementById('firstLoginError');

  if (errorEl) {
    errorEl.classList.remove('show');
    errorEl.style.display = 'none';
  }

  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = 'block';
    requestAnimationFrame(() => successEl.classList.add('show'));
  }
}

/**
 * Sprawdź czy użytkownik wymaga konfiguracji pierwszego logowania
 * @param {object} loginResponse - Odpowiedź z endpointa logowania
 * @returns {boolean}
 */
function shouldShowFirstLoginModal(loginResponse) {
  return true;
}

// Export
export const FirstLoginModal = {
  init,
  showFirstLoginModal,
  hideFirstLoginModal,
  shouldShowFirstLoginModal,
}