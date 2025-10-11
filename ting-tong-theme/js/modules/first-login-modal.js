// ============================================================================
// MODUŁ: Modal Uzupełniania Profilu (First Login Modal) - Wersja 3-etapowa (v2)
// ============================================================================
import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

// Minimalny cache DOM, aby uniknąć błędów inicjalizacji
let dom = {
  modal: null,
  form: null,
};

const state = {
  currentStep: 1,
  formData: {},
};

function checkProfileAndShowModal(userData) {
  if (!dom.modal) {
    console.warn('FirstLoginModal: Modal nie został zainicjowany.');
    return;
  }
  if (!userData) {
    console.warn('FirstLoginModal: Brak danych użytkownika.');
    return;
  }
  if (userData.is_profile_complete === false) {
    showProfileCompletionModal(userData.email);
  }
}

function showProfileCompletionModal(userEmail) {
  state.currentStep = 1;
  state.formData = {};

  dom.form.reset();
  const emailDisplay = dom.form.querySelector('#firstLoginEmail');
  if (emailDisplay) {
    emailDisplay.textContent = userEmail || 'user@example.com';
  }

  goToStep(1);
  showError(null);
  UI.openModal(dom.modal);
}

function hideModal() {
  if (dom.modal) UI.closeModal(dom.modal);
}

function goToStep(stepNumber) {
  state.currentStep = stepNumber;

  const stepsContainer = dom.form.querySelector('.first-login-steps-container');
  const progressSteps = dom.form.querySelectorAll('.first-login-progress-bar .progress-step');
  const prevBtn = dom.form.querySelector('.prev-step-btn');
  const nextBtn = dom.form.querySelector('.next-step-btn');
  const submitBtn = dom.form.querySelector('#firstLoginSubmitBtn');

  if (!stepsContainer || !progressSteps.length || !prevBtn || !nextBtn || !submitBtn) {
    console.error("FirstLoginModal: Brak kluczowych elementów nawigacji w kroku.");
    return;
  }

  const offset = (stepNumber - 1) * -100;
  stepsContainer.style.transform = `translateX(${offset}%)`;

  progressSteps.forEach((stepEl, index) => {
    stepEl.classList.remove('active', 'completed');
    if (index + 1 < stepNumber) stepEl.classList.add('completed');
    else if (index + 1 === stepNumber) stepEl.classList.add('active');
  });

  prevBtn.style.display = stepNumber > 1 ? 'inline-flex' : 'none';
  nextBtn.style.display = stepNumber < 3 ? 'inline-flex' : 'none';
  submitBtn.style.display = stepNumber === 3 ? 'inline-flex' : 'none';

  showError(null);
}

function validateStep() {
  showError(null);
  const { currentStep } = state;

  if (currentStep === 1) {
    const firstName = dom.form.querySelector('#firstLoginFirstName').value.trim();
    const lastName = dom.form.querySelector('#firstLoginLastName').value.trim();
    if (!firstName || !lastName) {
      showError(Utils.getTranslation('firstLoginErrorMissingNames') || 'Uzupełnij imię i nazwisko');
      return false;
    }
    state.formData.first_name = firstName;
    state.formData.last_name = lastName;
  }

  if (currentStep === 2) {
    const newPassword = dom.form.querySelector('#firstLoginNewPassword').value;
    const confirmPassword = dom.form.querySelector('#firstLoginConfirmPassword').value;
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

async function handleFormSubmit(e) {
  e.preventDefault();

  const emailConsentToggle = dom.form.querySelector('#firstLoginEmailConsent');
  const languageSelector = dom.form.querySelector('.language-selector-compact');
  const submitBtn = dom.form.querySelector('#firstLoginSubmitBtn');

  state.formData.email_consent = emailConsentToggle?.classList.contains('active') ?? false;
  state.formData.email_language = languageSelector?.querySelector('.active')?.dataset.lang || 'pl';

  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('savingButtonText') || 'Zapisywanie...'}`;
  showError(null);

  try {
    const requestData = { ...state.formData, nonce: ajax_object.nonce };
    const result = await authManager.ajax('tt_complete_profile', requestData);

    if (result.success) {
      UI.showToast(Utils.getTranslation('firstLoginSuccess') || 'Profil pomyślnie skonfigurowany!');
      if (result.data?.userData) {
        State.set('currentUser', result.data.userData);
        State.set('isUserLoggedIn', true);
      }
      if (result.data?.new_nonce) ajax_object.nonce = result.data.new_nonce;

      setTimeout(() => {
        hideModal();
        UI.updateUIForLoginState();
        UI.showToast(Utils.getTranslation('firstLoginWelcomeBack') || 'Witaj w Ting Tong! 🚀');
      }, 1500);
    } else {
      throw new Error(result.data?.message || 'Nieznany błąd aktualizacji profilu');
    }
  } catch (error) {
    showError(error.message || 'Wystąpił nieoczekiwany błąd.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function mainClickHandler(e) {
    const nextBtn = e.target.closest('.next-step-btn');
    const prevBtn = e.target.closest('.prev-step-btn');
    const consentToggle = e.target.closest('#firstLoginEmailConsent');
    const langOption = e.target.closest('.language-option-compact');

    if (nextBtn) {
        if (validateStep()) {
            goToStep(state.currentStep + 1);
        }
    } else if (prevBtn) {
        goToStep(state.currentStep - 1);
    } else if (consentToggle) {
        consentToggle.classList.toggle('active');
    } else if (langOption) {
        const langSelector = langOption.closest('.language-selector-compact');
        langSelector.querySelector('.active')?.classList.remove('active');
        langOption.classList.add('active');
    }
}

function setupPasswordStrengthIndicator() {
    const newPasswordInput = dom.form.querySelector('#firstLoginNewPassword');
    const indicator = dom.form.querySelector('#passwordStrengthIndicator');
    const bar = dom.form.querySelector('#passwordStrengthBar');
    const text = dom.form.querySelector('#passwordStrengthText');

    if (!newPasswordInput || !indicator || !bar || !text) return;

    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
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

function showError(message) {
  const errorEl = dom.form.querySelector('#firstLoginError');
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  } else {
    errorEl.classList.remove('show');
  }
}

function init() {
  dom.modal = document.getElementById('firstLoginModal');
  dom.form = document.getElementById('firstLoginForm');

  if (!dom.modal || !dom.form) {
    console.warn('FirstLoginModal: Brak głównych elementów modalu w DOM. Moduł nie zostanie zainicjowany.');
    return;
  }

  dom.form.addEventListener('submit', handleFormSubmit);
  dom.form.addEventListener('click', mainClickHandler);
  setupPasswordStrengthIndicator();
}

export const FirstLoginModal = {
  init,
  checkProfileAndShowModal,
};