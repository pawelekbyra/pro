import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

let dom = {};
let currentStep = 0;
const totalSteps = 3;
let formData = {};

function cacheDOM() {
    dom = {
        modal: document.getElementById('firstLoginModal'),
        form: document.getElementById('firstLoginForm'),
        title: document.getElementById('first-login-title'),
        progressBar: document.getElementById('firstLoginProgressBar'),
        steps: document.querySelectorAll('.first-login-step'),
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

function setupEventListeners() {
    if (!dom.modal) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form?.addEventListener('submit', handleFormSubmit);

    dom.consentToggle?.addEventListener('click', () => {
        const isActive = dom.consentToggle.classList.toggle('active');
        dom.langOptions.style.display = isActive ? 'flex' : 'none';
    });

    dom.langOptions?.querySelectorAll('.language-option-compact').forEach(opt => {
        opt.addEventListener('click', () => {
            dom.langOptions.querySelectorAll('.language-option-compact').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
}

function updateStepDisplay() {
    dom.steps.forEach((step, index) => {
        step.style.display = index === currentStep ? 'block' : 'none';
    });

    dom.prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
    dom.nextBtn.style.display = currentStep === totalSteps - 1 ? 'none' : 'inline-flex';
    dom.submitBtn.style.display = currentStep === totalSteps - 1 ? 'inline-flex' : 'none';

    if(dom.progressBar) {
        dom.progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
    }
}

function translateUI() {
    if(!dom.modal) return;

    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const translation = Utils.getTranslation(key);
        if(translation) {
            el.innerHTML = translation;
        }
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        const translation = Utils.getTranslation(key);
        if(translation) {
            el.placeholder = translation;
        }
    });
}

function showProfileCompletionModal() {
    if (!dom.modal) return;
    resetModal();
    translateUI();

    const userEmail = State.get('currentUser')?.email || '';
    if (dom.loginEmailDisplay) {
        dom.loginEmailDisplay.textContent = userEmail;
    }

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
    currentStep = 0;
    formData = {};
    dom.form?.reset();
    hideError();

    const currentUser = State.get('currentUser') || {};
    if (dom.firstName) dom.firstName.value = currentUser.first_name || '';
    if (dom.lastName) dom.lastName.value = currentUser.last_name || '';

    if (dom.consentToggle && dom.langOptions) {
        const initialConsent = true;
        dom.consentToggle.classList.add('active');
        dom.langOptions.style.display = 'flex';
        const lang = State.get('currentLang') || 'pl';
        dom.langOptions.querySelectorAll('.language-option-compact').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });
    }
    updateStepDisplay();
}

function validateStep(stepNumber) {
    hideError();
    switch (stepNumber) {
        case 0: // Step 1
            return true;
        case 1: // Step 2
            if (!dom.firstName.value.trim() || !dom.lastName.value.trim()) {
                showError(Utils.getTranslation('errorMissingNames'));
                return false;
            }
            return true;
        case 2: // Step 3
            const password = dom.newPassword.value;
            const confirmPassword = dom.confirmPassword.value;
            if (!password) {
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
        case 0:
            formData.email_consent = dom.consentToggle.classList.contains('active');
            formData.email_language = dom.langOptions.querySelector('.language-option-compact.active')?.dataset.lang || 'pl';
            break;
        case 1:
            formData.first_name = dom.firstName.value.trim();
            formData.last_name = dom.lastName.value.trim();
            break;
        case 2:
            formData.new_password = dom.newPassword.value;
            break;
    }
}

function handleNextStep() {
    if (validateStep(currentStep)) {
        collectData(currentStep);
        if (currentStep < totalSteps - 1) {
            currentStep++;
            updateStepDisplay();
        }
    }
}

function handlePrevStep() {
    hideError();
    if (currentStep > 0) {
        currentStep--;
        updateStepDisplay();
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
        const result = await authManager.ajax('tt_complete_profile', formData, true);
        if (result.success) {
            const updatedUser = { ...State.get('currentUser'), ...result.data.userData, is_profile_complete: true };
            State.set('currentUser', updatedUser);
            document.dispatchEvent(new CustomEvent('user:profile_completed', { detail: { user: updatedUser } }));
            UI.showToast(Utils.getTranslation('profileUpdateSuccess') || 'Profil zaktualizowany!', 'success');
            setTimeout(() => {
                hideModal();
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