import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

let dom = {};
let currentStep = 1;
const totalSteps = 3;
let formData = {};

function cacheDOM() {
  dom = {
    modal: document.getElementById('firstLoginModal'),
    form: document.getElementById('firstLoginForm'),
    stepsContainer: document.querySelector('.first-login-steps-container'),
    steps: document.querySelectorAll('.first-login-step'),
    progressSteps: document.querySelectorAll('.progress-step'),

    // Step 1
    emailDisplay: document.getElementById('firstLoginEmail'),

    // Step 2
    firstNameInput: document.getElementById('firstLoginFirstName'),
    lastNameInput: document.getElementById('firstLoginLastName'),
    newPasswordInput: document.getElementById('firstLoginNewPassword'),
    confirmPasswordInput: document.getElementById('firstLoginConfirmPassword'),

    // Step 3
    emailConsentToggle: document.getElementById('firstLoginEmailConsent'),
    languageSelector: document.querySelector('.language-selector-compact'),

    // Footer & Messages
    prevBtn: document.getElementById('firstLoginPrevBtn'),
    nextBtn: document.getElementById('firstLoginNextBtn'),
    submitBtn: document.getElementById('firstLoginSubmitBtn'),
    errorEl: document.getElementById('firstLoginError'),
  };
}

function setupEventListeners() {
  if (!dom.modal) return;

  dom.nextBtn?.addEventListener('click', handleNextStep);
  dom.prevBtn?.addEventListener('click', handlePrevStep);
  dom.form?.addEventListener('submit', handleFormSubmit);

  dom.emailConsentToggle?.addEventListener('click', () => {
    dom.emailConsentToggle.classList.toggle('active');
  });

  dom.languageSelector?.addEventListener('click', (e) => {
    if (e.target.classList.contains('language-option-compact')) {
      dom.languageSelector.querySelector('.active')?.classList.remove('active');
      e.target.classList.add('active');
    }
  });
}

function checkProfileAndShowModal(userData) {
  if (!userData || userData.is_profile_complete) {
    return;
  }
  showProfileCompletionModal(userData.email);
}

function showProfileCompletionModal(userEmail) {
  if (!dom.modal) return;

  resetModal();
  dom.emailDisplay.textContent = userEmail;
  UI.openModal(dom.modal);
}

function hideModal() {
  if (!dom.modal) return;
  UI.closeModal(dom.modal);
}

function resetModal() {
  currentStep = 1;
  formData = {};
  dom.form?.reset();
  dom.emailConsentToggle?.classList.add('active');
  dom.languageSelector?.querySelector('.active')?.classList.remove('active');
  dom.languageSelector?.querySelector('[data-lang="pl"]')?.classList.add('active');
  updateStepUI();
  hideError();
}

function updateStepUI() {
  // Przesuń kontener kroków
  if (dom.stepsContainer) {
      dom.stepsContainer.style.transform = `translateX(-${(currentStep - 1) * 100}%)`;
  }

  // Zaktualizuj wskaźnik postępu
  dom.progressSteps?.forEach(step => {
    const stepNumber = parseInt(step.dataset.step, 10);
    if (stepNumber <= currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  // Pokaż/ukryj przyciski
  dom.prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
  dom.nextBtn.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
  dom.submitBtn.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
}

function handleNextStep() {
  if (!validateStep(currentStep)) {
    return;
  }
  collectStepData(currentStep);
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepUI();
  }
}

function handlePrevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepUI();
  }
}

function validateStep(step) {
  hideError();
  if (step === 2) {
    const { firstNameInput, lastNameInput, newPasswordInput, confirmPasswordInput } = dom;
    if (!firstNameInput.value.trim() || !lastNameInput.value.trim()) {
      showError('Imię i nazwisko są wymagane.');
      return false;
    }
    if (newPasswordInput.value.length < 8) {
      showError('Hasło musi mieć co najmniej 8 znaków.');
      return false;
    }
    if (newPasswordInput.value !== confirmPasswordInput.value) {
      showError('Hasła muszą być identyczne.');
      return false;
    }
  }
  return true;
}

function collectStepData(step) {
    if (step === 2) {
        formData.first_name = dom.firstNameInput.value.trim();
        formData.last_name = dom.lastNameInput.value.trim();
        formData.new_password = dom.newPasswordInput.value;
    } else if (step === 3) {
        formData.email_consent = dom.emailConsentToggle.classList.contains('active');
        formData.email_language = dom.languageSelector.querySelector('.active').dataset.lang;
    }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateStep(totalSteps)) return;
  collectStepData(totalSteps);

  const originalText = dom.submitBtn.textContent;
  dom.submitBtn.disabled = true;
  dom.submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

  try {
    const result = await authManager.ajax('tt_complete_profile', formData);

    if (result.success) {
      State.set('currentUser', result.data.userData);
      State.set('isUserLoggedIn', true);
      if (result.data?.new_nonce) {
        ajax_object.nonce = result.data.new_nonce;
      }

      UI.showToast('Profil zaktualizowany! Witaj w aplikacji.', 'success');
      setTimeout(() => {
        hideModal();
        UI.updateUIForLoginState();
      }, 1500);

    } else {
      throw new Error(result.data?.message || 'Wystąpił nieznany błąd.');
    }
  } catch (error) {
    showError(error.message);
    dom.submitBtn.disabled = false;
    dom.submitBtn.textContent = originalText;
  }
}

function showError(message) {
  if (!dom.errorEl) return;
  dom.errorEl.textContent = message;
  dom.errorEl.style.display = 'block';
}

function hideError() {
  if (!dom.errorEl) return;
  dom.errorEl.style.display = 'none';
  dom.errorEl.textContent = '';
}

function init() {
  cacheDOM();
  if (dom.modal) {
    setupEventListeners();
  }
}

export const FirstLoginModal = {
  init,
  checkProfileAndShowModal,
};