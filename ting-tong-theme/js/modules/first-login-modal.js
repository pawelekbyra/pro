// File: ting-tong-theme/js/modules/first-login-modal.js

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
    title: document.getElementById('first-login-title'),
    progressBar: document.getElementById('firstLoginProgressBar'),
    stepContainer: document.getElementById('firstLoginBody'),
    steps: document.querySelectorAll('.first-login-step'), // Static steps
    prevBtn: document.getElementById('firstLoginPrevBtn'),
    nextBtn: document.getElementById('firstLoginNextBtn'),
    submitBtn: document.getElementById('firstLoginSubmitBtn'),
    errorEl: document.getElementById('firstLoginError'),
    // Step specific elements
    consentToggle: document.getElementById('fl_email_consent'),
    langOptions: document.getElementById('languageOptions'),
    firstName: document.getElementById('fl_firstname'),
    lastName: document.getElementById('fl_lastname'),
    newPassword: document.getElementById('fl_new_password'),
    confirmPassword: document.getElementById('fl_confirm_password'),
    loginEmailDisplay: document.getElementById('fl_login_email'),
  };
}

// Function to attach event listeners to static elements
function setupEventListeners() {
    if (!dom.modal) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form?.addEventListener('submit', handleFormSubmit);

    // Step 1 Listeners (Consent Toggle)
    dom.consentToggle?.addEventListener('click', (e) => {
        dom.consentToggle.classList.toggle('active');
        // Toggle language options visibility
        if (dom.consentToggle.classList.contains('active')) {
            dom.langOptions.style.display = 'flex';
        } else {
            dom.langOptions.style.display = 'none';
        }
    });

    // Step 1 Listeners (Language Selector)
    dom.langOptions?.querySelectorAll('.language-option-compact').forEach(opt => {
        opt.addEventListener('click', () => {
            dom.langOptions.querySelectorAll('.language-option-compact').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
}

function showProfileCompletionModal() {
    if (!dom.modal) return;
    resetModal();

    // Set initial title and email
    dom.title.textContent = Utils.getTranslation('firstLoginTitle');
    const userEmail = State.get('currentUser')?.email || '';
    if (dom.loginEmailDisplay) {
        dom.loginEmailDisplay.textContent = userEmail;
    }

    renderStep(currentStep);
    UI.openModal(dom.modal, {
        onOpen: () => document.dispatchEvent(new CustomEvent('tt:pause-video')),
        onClose: () => document.dispatchEvent(new CustomEvent('tt:play-video'))
    });
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function resetModal() {
    currentStep = 1;
    formData = {};
    dom.form?.reset();
    hideError();

    // Reset step states in DOM
    dom.steps.forEach((step, index) => {
        step.style.display = index === 0 ? 'block' : 'none';
    });

    // Set initial values from State (if available, e.g. after mock login)
    const currentUser = State.get('currentUser') || {};
    if (dom.firstName) dom.firstName.value = currentUser.first_name || '';
    if (dom.lastName) dom.lastName.value = currentUser.last_name || '';


    // Reset Step 1 toggle/language
    if (dom.consentToggle && dom.langOptions) {
        const initialConsent = currentUser.email_consent === true || true; // Default to active for clean starting state

        dom.consentToggle.classList.toggle('active', initialConsent);
        dom.langOptions.style.display = initialConsent ? 'flex' : 'none';

        const lang = currentUser.email_language || 'pl';
        dom.langOptions.querySelectorAll('.language-option-compact').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });
    }
}

function renderStep(stepNumber, direction = 'next') {
    if (dom.steps.length === 0) return;

    const oldStepIndex = stepNumber === 1 && direction === 'prev' ? 0 : direction === 'prev' ? stepNumber : stepNumber - 2;
    const newStepIndex = stepNumber - 1;

    // Validation/Boundary check
    if (newStepIndex < 0 || newStepIndex >= dom.steps.length) return;

    // Animate out old step if applicable
    if (oldStepIndex >= 0 && oldStepIndex < dom.steps.length) {
        dom.steps[oldStepIndex].style.display = 'none';
    }

    // Animate in new step
    const newStep = dom.steps[newStepIndex];
    newStep.style.display = 'block';
    newStep.classList.remove('is-exiting');
    void newStep.offsetWidth; // Trigger reflow

    // Update UI elements
    dom.progressBar.style.width = `${(stepNumber / totalSteps) * 100}%`;
    dom.prevBtn.style.display = stepNumber > 1 ? 'inline-flex' : 'none';
    dom.nextBtn.style.display = stepNumber < totalSteps ? 'inline-flex' : 'none';
    dom.submitBtn.style.display = stepNumber === totalSteps ? 'inline-flex' : 'none';

    // Update button translations (they are hardcoded but for consistency)
    dom.prevBtn.textContent = Utils.getTranslation('firstLoginPrev');
    dom.nextBtn.textContent = Utils.getTranslation('firstLoginNext');
    dom.submitBtn.textContent = Utils.getTranslation('firstLoginSubmit');

    // Step 3 (Password) specific logic
    if (stepNumber === 3) {
        // Scroll password fields into view (especially for mobile keyboard)
        setTimeout(() => dom.newPassword.focus(), 300);
    }
}


function validateStep(stepNumber) {
    hideError();
    switch (stepNumber) {
        case 1:
            return true;
        case 2:
            const firstName = dom.firstName.value.trim();
            const lastName = dom.lastName.value.trim();
            if (!firstName || !lastName) {
                showError(Utils.getTranslation('errorMissingNames'));
                return false;
            }
            return true;
        case 3:
            const password = dom.newPassword.value;
            const confirmPassword = dom.confirmPassword.value;
            if (!password || !confirmPassword) {
                showError(Utils.getTranslation('errorPasswordRequired'));
                return false;
            }
            if (password.length < 8) {
                showError(Utils.getTranslation('errorMinPasswordLength'));
                return false;
            }
            if (password !== confirmPassword) {
                showError(Utils.getTranslation('errorPasswordsMismatch'));
                return false;
            }
            return true;
        default:
            return true;
    }
}

function collectData(stepNumber) {
    switch (stepNumber) {
        case 1:
            formData.email_consent = dom.consentToggle.classList.contains('active');
            formData.email_language = dom.langOptions.querySelector('.language-option-compact.active')?.dataset.lang || 'pl';
            break;
        case 2:
            formData.first_name = dom.firstName.value.trim();
            formData.last_name = dom.lastName.value.trim();
            break;
        case 3:
            formData.new_password = dom.newPassword.value;
            break;
    }
}

function handleNextStep() {
    if (validateStep(currentStep)) {
        collectData(currentStep);
        if (currentStep < totalSteps) {
            currentStep++;
            renderStep(currentStep, 'next');
        }
    }
}

function handlePrevStep() {
    hideError();
    if (currentStep > 1) {
        currentStep--;
        renderStep(currentStep, 'prev');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateStep(currentStep)) {
        return;
    }

    collectData(currentStep);

    const originalText = dom.submitBtn.innerHTML;
    dom.submitBtn.disabled = true;
    dom.submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

    try {
        // Send ALL collected data to the backend
        const result = await authManager.ajax('tt_complete_profile', formData, true);

        if (result.success) {
            // Zaktualizuj dane użytkownika w stanie globalnym
            const updatedUser = { ...State.get('currentUser'), ...result.data.userData, is_profile_complete: true };
            State.set('currentUser', updatedUser);

            // Trigger video play/stop
            document.dispatchEvent(new CustomEvent('user:profile_completed', { detail: { user: updatedUser } }));

            UI.showToast(Utils.getTranslation('profileUpdateSuccess') || 'Profil zaktualizowany!', 'success');

            setTimeout(() => {
                hideModal();
                // To ensure clean login state, trigger reload after a short delay
                setTimeout(() => location.reload(), 500);
            }, 500);

        } else {
            throw new Error(result.data?.message || Utils.getTranslation('profileUpdateFailedError'));
        }
    } catch (error) {
        showError(error.message);
        dom.submitBtn.disabled = false;
        dom.submitBtn.innerHTML = originalText;
    }
}

function showError(message) {
    if (!dom.errorEl) return;
    dom.errorEl.textContent = message;
    dom.errorEl.style.display = 'block';
    setTimeout(() => hideError(), 4000);
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
        // Default to active for clean starting state. ResetModal handles the initial UX.
        // if (dom.consentToggle) dom.consentToggle.classList.add('active');
    }
}

export const FirstLoginModal = {
    init,
    showProfileCompletionModal,
    checkProfileAndShowModal: (userData) => {
        if (userData && !userData.is_profile_complete) {
            showProfileCompletionModal();
        }
    }
};