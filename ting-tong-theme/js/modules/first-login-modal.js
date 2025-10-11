// ============================================================================
// MODUŁ: Modal Uzupełniania Profilu (First Login Modal) - Wersja 3-etapowa
// ============================================================================
import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

let dom = {};
const state = {
  currentStep: 1,
  formData: {},
};

/**
 * Sprawdza, czy profil użytkownika jest kompletny i w razie potrzeby pokazuje modal.
 */
function checkProfileAndShowModal(userData) {
  if (!userData) {
    console.warn('FirstLoginModal: Brak danych użytkownika.');
    return;
  }
  if (userData.is_profile_complete === false) {
    console.log('FirstLoginModal: Profil niekompletny, pokazuję modal.');
    showProfileCompletionModal(userData.email);
  } else {
    console.log('FirstLoginModal: Profil kompletny.');
  }
}

/**
 * Pokazuje i resetuje modal do stanu początkowego.
 */
function showProfileCompletionModal(userEmail) {
  if (!dom.modal) {
    console.error('FirstLoginModal: Element modalu nie został znaleziony w DOM.');
    return;
  }

  // Reset stanu
  state.currentStep = 1;
  state.formData = {};

  dom.form.reset();
  if (dom.emailDisplay) {
    dom.emailDisplay.textContent = userEmail || 'user@example.com';
  }

  // Przejdź do pierwszego kroku i zaktualizuj UI
  goToStep(1);

  // Wyczyść komunikaty o błędach/sukcesie
  showError(null);

  UI.openModal(dom.modal);
}

/**
 * Ukrywa modal.
 */
function hideModal() {
  if (!dom.modal) return;
  UI.closeModal(dom.modal);
}

/**
 * Główna funkcja nawigacyjna.
 * @param {number} stepNumber - Numer kroku, do którego chcemy przejść.
 */
function goToStep(stepNumber) {
    state.currentStep = stepNumber;

    // Przesuń kontener kroku
    const offset = (stepNumber - 1) * -100;
    dom.stepsContainer.style.transform = `translateX(${offset}%)`;

    // Zaktualizuj pasek postępu
    dom.progressSteps.forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            stepEl.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            stepEl.classList.add('active');
        }
    });

    // Zaktualizuj widoczność przycisków
    dom.prevBtn.style.display = stepNumber > 1 ? 'inline-flex' : 'none';
    dom.nextBtn.style.display = stepNumber < 3 ? 'inline-flex' : 'none';
    dom.submitBtn.style.display = stepNumber === 3 ? 'inline-flex' : 'none';

    // Wyczyść błędy przy zmianie kroku
    showError(null);
}


/**
 * Waliduje dane dla bieżącego kroku.
 * @returns {boolean} - True, jeśli walidacja przeszła pomyślnie.
 */
function validateStep() {
    showError(null); // Ukryj poprzednie błędy
    const { currentStep } = state;

    if (currentStep === 1) {
        const firstName = dom.firstNameInput.value.trim();
        const lastName = dom.lastNameInput.value.trim();
        if (!firstName || !lastName) {
            showError(Utils.getTranslation('firstLoginErrorMissingNames') || 'Uzupełnij imię i nazwisko');
            return false;
        }
        state.formData.first_name = firstName;
        state.formData.last_name = lastName;
    }

    if (currentStep === 2) {
        const newPassword = dom.newPasswordInput.value;
        const confirmPassword = dom.confirmPasswordInput.value;

        if (!newPassword || newPassword.length < 8) {
            showError(Utils.getTranslation('passwordLengthError') || 'Hasło musi mieć min. 8 znaków');
            return false;
        }
        if (newPassword !== confirmPassword) {
            showError(Utils.getTranslation('passwordsMismatchError') || 'Hasła muszą być identyczne');
            return false;
        }
        state.formData.new_password = newPassword;
    }

    return true;
}

/**
 * Inicjalizacja modułu, cache'owanie DOM i ustawienie event listenerów.
 */
function init() {
  dom = {
    modal: document.getElementById('firstLoginModal'),
    form: document.getElementById('firstLoginForm'),
    stepsContainer: document.querySelector('.first-login-steps-container'),
    progressSteps: document.querySelectorAll('.first-login-progress-bar .progress-step'),

    // Przyciski
    prevBtn: document.querySelector('.prev-step-btn'),
    nextBtn: document.querySelector('.next-step-btn'),
    submitBtn: document.getElementById('firstLoginSubmitBtn'),

    // Pola formularza
    emailDisplay: document.getElementById('firstLoginEmail'),
    firstNameInput: document.getElementById('firstLoginFirstName'),
    lastNameInput: document.getElementById('firstLoginLastName'),
    newPasswordInput: document.getElementById('firstLoginNewPassword'),
    confirmPasswordInput: document.getElementById('firstLoginConfirmPassword'),

    // Komunikaty i wskaźniki
    errorEl: document.getElementById('firstLoginError'),
    passwordStrength: {
      indicator: document.getElementById('passwordStrengthIndicator'),
      bar: document.getElementById('passwordStrengthBar'),
      text: document.getElementById('passwordStrengthText'),
    }
  };

  if (!dom.modal || !dom.stepsContainer) {
    console.warn('FirstLoginModal: Brak kluczowych elementów modalu w DOM.');
    return;
  }

  setupEventListeners();
  setupPasswordStrength();
}

/**
 * Konfiguracja wszystkich event listenerów dla modalu.
 */
function setupEventListeners() {
    if (!dom.form) return;

    dom.form.addEventListener('submit', handleFormSubmit);

    dom.nextBtn.addEventListener('click', () => {
        if (validateStep()) {
            goToStep(state.currentStep + 1);
        }
    });

    dom.prevBtn.addEventListener('click', () => {
        goToStep(state.currentStep - 1);
    });

    // Delegacja obsługi kliknięć dla dynamicznych elementów kroku 3
    dom.form.addEventListener('click', (e) => {
        const consentToggle = e.target.closest('#firstLoginEmailConsent');
        if (consentToggle) {
            consentToggle.classList.toggle('active');
        }

        const langOption = e.target.closest('.language-option-compact');
        if (langOption) {
            const langSelector = langOption.closest('.language-selector-compact');
            langSelector.querySelector('.active')?.classList.remove('active');
            langOption.classList.add('active');
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
      indicator.style.opacity = '0';
      return;
    }
    indicator.style.opacity = '1';

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
 * Obsługa wysłania całego formularza na ostatnim kroku.
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Zbierz dane z ostatniego kroku
  const emailConsentToggle = dom.form.querySelector('#firstLoginEmailConsent');
  const languageSelector = dom.form.querySelector('.language-selector-compact');

  state.formData.email_consent = emailConsentToggle?.classList.contains('active') ?? false;
  state.formData.email_language = languageSelector?.querySelector('.active')?.dataset.lang || 'pl';

  const originalText = dom.submitBtn.textContent;
  dom.submitBtn.disabled = true;
  dom.submitBtn.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('savingButtonText') || 'Zapisywanie...'}`;
  showError(null);

  try {
    const requestData = { ...state.formData, nonce: ajax_object.nonce };
    console.log('Wysyłanie danych ukończenia profilu:', requestData);

    const result = await authManager.ajax('tt_complete_profile', requestData);

    if (result.success) {
      UI.showToast(Utils.getTranslation('firstLoginSuccess') || 'Profil pomyślnie skonfigurowany!');

      if (result.data?.userData) {
        State.set('currentUser', result.data.userData);
        State.set('isUserLoggedIn', true);
      }
      if (result.data?.new_nonce) {
        ajax_object.nonce = result.data.new_nonce;
      }

      setTimeout(() => {
        hideModal();
        UI.updateUIForLoginState();
        UI.showToast(Utils.getTranslation('firstLoginWelcomeBack') || 'Witaj w Ting Tong! 🚀');
      }, 1500);

    } else {
      throw new Error(result.data?.message || 'Nieznany błąd aktualizacji profilu');
    }

  } catch (error) {
    console.error('Błąd ukończenia profilu:', error);
    showError(error.message || 'Wystąpił nieoczekiwany błąd.');
  } finally {
    dom.submitBtn.disabled = false;
    dom.submitBtn.textContent = originalText;
  }
}

/**
 * Pokazuje lub ukrywa komunikat o błędzie.
 * @param {string|null} message - Wiadomość do wyświetlenia lub null, aby ukryć.
 */
function showError(message) {
  if (!dom.errorEl) return;
  if (message) {
    dom.errorEl.textContent = message;
    dom.errorEl.classList.add('show');
  } else {
    dom.errorEl.classList.remove('show');
  }
}

export const FirstLoginModal = {
  init,
  checkProfileAndShowModal,
};