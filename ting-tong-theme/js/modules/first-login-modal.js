// ============================================================================
// MODUŁ: Modal Uzupełniania Profilu (First Login Modal) - FIXED
// ============================================================================
import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

let dom = {};

/**
 * Sprawdza czy profil użytkownika jest kompletny i pokazuje modal
 */
function checkProfileAndShowModal(userData) {
  if (!userData) {
    console.warn('No user data provided');
    return;
  }

  if (userData.is_profile_complete === false) {
    console.log('Profile incomplete, showing modal');
    showProfileCompletionModal(userData.email || 'user@example.com');
  } else {
    console.log('Profile complete');
  }
}

/**
 * Pokazuje modal
 */
function showProfileCompletionModal(userEmail) {
  if (!dom.modal) {
    console.error('Modal element not found');
    return;
  }

  if (dom.emailDisplay) {
    dom.emailDisplay.textContent = userEmail;
  }

  UI.openModal(dom.modal);

  // Scroll na górę
  if (dom.body) {
    dom.body.scrollTop = 0;
  }

  // Focus na pierwszym polu po opóźnieniu
  setTimeout(() => {
    dom.firstNameInput?.focus();
  }, 500);
}

/**
 * Ukrywa modal
 */
function hideModal() {
  if (!dom.modal) return;
  UI.closeModal(dom.modal);
}

/**
 * Inicjalizacja modułu
 */
function init() {
  // Cache DOM
  dom = {
    modal: document.getElementById('firstLoginModal'),
    form: document.getElementById('firstLoginForm'),
    body: document.querySelector('.first-login-body'),
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

  if (!dom.modal) {
    console.warn('First login modal not found in DOM');
    return;
  }

  setupEventListeners();
  setupPasswordStrength();
  setupKeyboardListener();
}

/**
 * Event listeners
 */
function setupEventListeners() {
  if (!dom.form) return;

  dom.form.addEventListener('submit', handleFormSubmit);

  // Toggle switch
  if (dom.emailConsentToggle) {
    dom.emailConsentToggle.addEventListener('click', () => {
      dom.emailConsentToggle.classList.toggle('active');
    });
  }

  // Language selector
  if (dom.languageSelector) {
    dom.languageSelector.addEventListener('click', (e) => {
      if (e.target.classList.contains('language-option-compact')) {
        const active = dom.languageSelector.querySelector('.active');
        if (active) active.classList.remove('active');
        e.target.classList.add('active');
      }
    });
  }
}

/**
 * Password strength indicator
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
 * Keyboard handler dla mobilnych urządzeń
 */
function setupKeyboardListener() {
  if (!dom.modal || !window.visualViewport) return;

  let initialHeight = window.visualViewport.height;
  let isKeyboardVisible = false;

  const handleViewportChange = () => {
    const currentHeight = window.visualViewport.height;
    const heightDiff = initialHeight - currentHeight;
    const newKeyboardState = heightDiff > 150;

    if (newKeyboardState !== isKeyboardVisible) {
      isKeyboardVisible = newKeyboardState;
      dom.modal.classList.toggle('keyboard-visible', isKeyboardVisible);

      // Scroll do aktywnego pola
      if (isKeyboardVisible) {
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement && dom.modal.contains(activeElement)) {
            const formGroup = activeElement.closest('.first-login-form-group');
            if (formGroup && dom.body) {
              // Scroll w body modalu
              const offsetTop = formGroup.offsetTop - 20;
              dom.body.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
          }
        }, 100);
      }
    }
  };

  window.visualViewport.addEventListener('resize', handleViewportChange);
  window.visualViewport.addEventListener('scroll', handleViewportChange);

  // Cleanup przy zamknięciu
  dom.modal.addEventListener('transitionend', function cleanupOnClose(e) {
    if (e.target === dom.modal && !dom.modal.classList.contains('visible')) {
      isKeyboardVisible = false;
      dom.modal.classList.remove('keyboard-visible');
      initialHeight = window.visualViewport.height;
    }
  });
}

/**
 * Obsługa wysłania formularza
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Walidacja
  if (!validateForm()) return;

  const originalText = dom.submitBtn.textContent;

  // Disable button
  dom.submitBtn.disabled = true;
  dom.submitBtn.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('savingButtonText') || 'Zapisywanie...'}`;

  try {
    const formData = getFormData();

    // FIXED: Dodaj explicit nonce do requestu
    const requestData = {
      ...formData,
      nonce: ajax_object.nonce
    };

    console.log('Submitting profile completion with data:', requestData);

    const result = await authManager.ajax('tt_complete_profile', requestData);

    console.log('Profile completion result:', result);

    if (result.success) {
      showSuccess(Utils.getTranslation('firstLoginSuccess') || 'Profil skonfigurowany!');

      // Aktualizuj dane użytkownika
      if (result.data?.userData) {
        State.set('currentUser', result.data.userData);
      }

      // Aktualizuj nonce jeśli zwrócony
      if (result.data?.new_nonce) {
        ajax_object.nonce = result.data.new_nonce;
      }

      // Zamknij modal po opóźnieniu
      setTimeout(() => {
        hideModal();
        UI.showToast(Utils.getTranslation('firstLoginWelcomeBack') || 'Witaj w Ting Tong! 🚀');
      }, 1500);

    } else {
      throw new Error(result.data?.message || 'Błąd aktualizacji profilu');
    }

  } catch (error) {
    console.error('Profile completion error:', error);

    let errorMessage = error.message || 'Wystąpił błąd';

    // Obsługa błędu 403
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      errorMessage = 'Błąd autoryzacji. Spróbuj się wylogować i zalogować ponownie.';
    }

    showError(errorMessage);

    // Re-enable button
    dom.submitBtn.disabled = false;
    dom.submitBtn.textContent = originalText;
  }
}

/**
 * Zbiera dane z formularza
 */
function getFormData() {
  const newPassword = dom.newPasswordInput.value.trim();
  const emailConsent = dom.emailConsentToggle?.classList.contains('active') || false;
  const emailLanguage = dom.languageSelector?.querySelector('.active')?.dataset.lang || 'pl';

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
 * Walidacja formularza
 */
function validateForm() {
  const firstName = dom.firstNameInput.value.trim();
  const lastName = dom.lastNameInput.value.trim();
  const newPassword = dom.newPasswordInput.value;
  const confirmPassword = dom.confirmPasswordInput.value;

  if (!firstName || !lastName) {
    showError(Utils.getTranslation('firstLoginErrorMissingNames') || 'Uzupełnij imię i nazwisko');
    return false;
  }

  // Walidacja hasła tylko jeśli zostało wprowadzone
  if (newPassword) {
    if (newPassword.length < 8) {
      showError(Utils.getTranslation('passwordLengthError') || 'Hasło musi mieć min. 8 znaków');
      return false;
    }
    if (newPassword !== confirmPassword) {
      showError(Utils.getTranslation('passwordsMismatchError') || 'Hasła muszą być identyczne');
      return false;
    }
  }

  return true;
}

/**
 * Pokaż błąd
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
 * Pokaż sukces
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

export const FirstLoginModal = {
  init,
  checkProfileAndShowModal,
};