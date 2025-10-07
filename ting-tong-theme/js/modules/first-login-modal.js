// ============================================================================
// MODUŁ: Modal Uzupełniania Profilu (wcześniej First Login Modal)
// ============================================================================
import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
// ✅ PATCH: Import authManager, bo API.post jest nieprawidłowe w tym kontekście
import { authManager } from './auth-manager.js';

let dom = {};

/**
 * Sprawdza, czy profil użytkownika jest kompletny i ewentualnie pokazuje modal.
 * @param {object} userData - Obiekt danych użytkownika z odpowiedzi logowania.
 */
function checkProfileAndShowModal(userData) {
  if (userData && userData.is_profile_complete === false) {
    console.log('Profile incomplete, showing completion modal.');
    showProfileCompletionModal(userData.email);
  } else {
    console.log('Profile complete, proceeding.');
  }
}

/**
 * Pokazuje modal uzupełniania profilu.
 * @param {string} userEmail - Email użytkownika do wyświetlenia.
 */
function showProfileCompletionModal(userEmail) {
  if (!dom.modal) return;

  if (dom.emailDisplay) dom.emailDisplay.textContent = userEmail;

  UI.openModal(dom.modal);

  setTimeout(() => {
    dom.firstNameInput?.focus();
  }, 400);
}

/**
 * Ukrywa modal.
 */
function hideModal() {
  if (!dom.modal) return;
  UI.closeModal(dom.modal);
}

/**
 * Inicjalizacja modułu.
 */
function init() {
  // Cache DOM elements
  dom = {
    modal: document.getElementById('firstLoginModal'),
    form: document.getElementById('firstLoginForm'),
    emailDisplay: document.getElementById('firstLoginEmail'),
    firstNameInput: document.getElementById('firstLoginFirstName'),
    lastNameInput: document.getElementById('firstLoginLastName'),
    newPasswordInput: document.getElementById('firstLoginNewPassword'),
    confirmPasswordInput: document.getElementById('firstLoginConfirmPassword'),
    emailConsentToggle: document.getElementById('firstLoginEmailConsent'),
    languageSelector: document.querySelector('.language-selector-compact'),
    submitBtn: document.getElementById('firstLoginSubmitBtn'),
    errorEl: document.getElementById('firstLoginError'),
    successEl: document.getElementById('firstLoginSuccess'),
    passwordStrength: {
      indicator: document.getElementById('passwordStrengthIndicator'),
      bar: document.getElementById('passwordStrengthBar'),
      text: document.getElementById('passwordStrengthText'),
    }
  };

  if (!dom.modal) return; // Jeśli modalu nie ma, nie rób nic więcej

  setupEventListeners();
  setupPasswordStrength();
}

/**
 * Konfiguracja event listenerów.
 */
function setupEventListeners() {
  dom.form.addEventListener('submit', handleFormSubmit);

  // Toggle switch
  dom.emailConsentToggle.addEventListener('click', () => {
    dom.emailConsentToggle.classList.toggle('active');
  });

  // Language selector
  dom.languageSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('language-option-compact')) {
      dom.languageSelector.querySelector('.active').classList.remove('active');
      e.target.classList.add('active');
    }
  });
}

/**
 * Konfiguracja wskaźnika siły hasła.
 */
function setupPasswordStrength() {
  const { newPasswordInput, passwordStrength } = dom;
  if (!newPasswordInput || !passwordStrength.indicator) return;

  newPasswordInput.addEventListener('input', () => {
    const password = newPasswordInput.value;
    const { indicator, bar, text } = passwordStrength;

    if (password.length === 0) {
      indicator.classList.remove('visible');
      return;
    }

    indicator.classList.add('visible');

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    let level = 'weak';
    let levelText = Utils.getTranslation('passwordStrengthWeak');

    if (strength >= 4) {
      level = 'strong';
      levelText = Utils.getTranslation('passwordStrengthStrong');
    } else if (strength >= 2) {
      level = 'medium';
      levelText = Utils.getTranslation('passwordStrengthMedium');
    }

    bar.className = `password-strength-bar ${level}`;
    text.className = `password-strength-text ${level}`;
    text.textContent = levelText;
  });
}

/**
 * Obsługa wysłania formularza.
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const originalText = dom.submitBtn.textContent;

  // Walidacja
  if (!validateForm()) return;

  // Disable button
  dom.submitBtn.disabled = true;
  dom.submitBtn.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('savingButtonText') || 'Zapisywanie...'}`;

  try {
    const formData = getFormData();
    // ✅ FIX: Używamy authManager.ajax zamiast API.post
    const result = await authManager.ajax('tt_complete_profile', formData);

    if (result.success) {
      showSuccess('Profil skonfigurowany! Witaj ponownie! 🎉');

      // Zaktualizuj dane użytkownika w State
      if (result.data?.userData) {
        State.set('currentUser', result.data.userData);
      }

      setTimeout(() => {
        hideModal();
        UI.showToast('Witaj w Ting Tong! 🚀');
      }, 1500);

    } else {
      throw new Error(result.data?.message || 'Błąd aktualizacji profilu');
    }

  } catch (error) {
    console.error('First Login Form submit error:', error);
    showError(error.message || 'Wystąpił błąd. Spróbuj ponownie.');

    // Re-enable button
    dom.submitBtn.disabled = false;
    dom.submitBtn.textContent = originalText;
  }
}

/**
 * Zbiera dane z formularza.
 * @returns {object}
 */
function getFormData() {
  const newPassword = dom.newPasswordInput.value;
  const emailConsent = dom.emailConsentToggle.classList.contains('active');
  const emailLanguage = dom.languageSelector.querySelector('.active').dataset.lang;

  const data = {
    first_name: dom.firstNameInput.value.trim(),
    last_name: dom.lastNameInput.value.trim(),
    email_consent: emailConsent,
    email_language: emailLanguage,
  };

  // Dodaj hasło tylko jeśli zostało wprowadzone
  if (newPassword) {
    data.new_password = newPassword;
  }

  return data;
}

/**
 * Waliduje formularz.
 * @returns {boolean}
 */
function validateForm() {
  const firstName = dom.firstNameInput.value.trim();
  const lastName = dom.lastNameInput.value.trim();
  const newPassword = dom.newPasswordInput.value;
  const confirmPassword = dom.confirmPasswordInput.value;

  if (!firstName || !lastName) {
    showError(Utils.getTranslation('firstLoginErrorMissingNames'));
    return false;
  }

  // Walidacja hasła tylko jeśli zostało wprowadzone
  if (newPassword) {
    if (newPassword.length < 8) {
      showError(Utils.getTranslation('passwordLengthError'));
      return false;
    }
    if (newPassword !== confirmPassword) {
      showError(Utils.getTranslation('passwordsMismatchError'));
      return false;
    }
  }

  return true;
}


/**
 * Pokaż komunikat błędu.
 */
function showError(message) {
  if (dom.successEl) {
    dom.successEl.classList.remove('show');
    dom.successEl.style.display = 'none';
  }
  if (dom.errorEl) {
    dom.errorEl.textContent = message;
    dom.errorEl.style.display = 'block';
    requestAnimationFrame(() => dom.errorEl.classList.add('show'));

    setTimeout(() => {
      dom.errorEl.classList.remove('show');
      setTimeout(() => (dom.errorEl.style.display = 'none'), 300);
    }, 5000);
  }
}

/**
 * Pokaż komunikat sukcesu.
 */
function showSuccess(message) {
  if (dom.errorEl) {
    dom.errorEl.classList.remove('show');
    dom.errorEl.style.display = 'none';
  }
  if (dom.successEl) {
    dom.successEl.textContent = message;
    dom.successEl.style.display = 'block';
    requestAnimationFrame(() => dom.successEl.classList.add('show'));
  }
}

// Export
export const FirstLoginModal = {
  init,
  checkProfileAndShowModal,
};