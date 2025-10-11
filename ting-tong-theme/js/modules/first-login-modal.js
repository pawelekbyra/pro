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

        consentCheckbox: document.getElementById('emailConsent'),
        langOptions: document.getElementById('languageOptions'),
        firstNameInput: document.querySelector('.first-login-step[data-step="2"] #firstName'),
        lastNameInput: document.querySelector('.first-login-step[data-step="2"] #lastName'),
        passwordInput: document.querySelector('.first-login-step[data-step="3"] #password'),
        confirmPasswordInput: document.querySelector('.first-login-step[data-step="3"] #confirmPassword'),
        emailDisplay: document.querySelector('.login-email-display'),
    };
}

function updateStepDisplay() {
    if (!dom.modal) return;
    dom.steps.forEach((s, i) => s.style.display = i === currentStep ? 'block' : 'none');
    dom.prevBtn.style.display = currentStep === 0 ? 'none' : 'block';
    dom.nextBtn.style.display = currentStep === totalSteps - 1 ? 'none' : 'block';
    dom.submitBtn.style.display = currentStep === totalSteps - 1 ? 'block' : 'none';
    if(dom.progressBar) {
        dom.progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
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
    if (currentStep > 0) {
        currentStep--;
        updateStepDisplay();
    }
}

function validateStep(step) {
    // Prosta walidacja, można rozbudować
    if (step === 1) {
        if (!dom.firstNameInput.value.trim() || !dom.lastNameInput.value.trim()) {
            UI.showAlert('Imię i nazwisko są wymagane.', true);
            return false;
        }
    }
    if (step === 2) {
        if (dom.passwordInput.value.length < 8) {
            UI.showAlert('Hasło musi mieć co najmniej 8 znaków.', true);
            return false;
        }
        if (dom.passwordInput.value !== dom.confirmPasswordInput.value) {
            UI.showAlert('Hasła nie są takie same.', true);
            return false;
        }
    }
    return true;
}

function collectData(step) {
    if (step === 0) {
        formData.email_consent = dom.consentCheckbox.checked;
        const activeLang = dom.langOptions.querySelector('.language-option-compact.active');
        formData.email_language = activeLang ? activeLang.dataset.lang : 'pl';
    } else if (step === 1) {
        formData.first_name = dom.firstNameInput.value.trim();
        formData.last_name = dom.lastNameInput.value.trim();
    } else if (step === 2) {
        formData.new_password = dom.passwordInput.value;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    collectData(currentStep);

    UI.showToast('Zapisywanie danych...');

    try {
        const result = await authManager.ajax('tt_complete_profile', formData, true);
        if (result.success) {
            const updatedUser = { ...State.get('currentUser'), ...result.data.userData, is_profile_complete: true };
            State.set('currentUser', updatedUser);
            document.dispatchEvent(new CustomEvent('user:profile_completed', { detail: { user: updatedUser } }));
            UI.showToast('Profil zaktualizowany! 🎉', 'success');
            hideModal();
            setTimeout(() => location.reload(), 500);
        } else {
            throw new Error(result.data?.message || 'Wystąpił błąd.');
        }
    } catch (error) {
        UI.showAlert(error.message, true);
    }
}

function setupEventListeners() {
    if (!dom.modal) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form?.addEventListener('submit', handleFormSubmit);

    dom.consentCheckbox?.addEventListener('change', e => {
        dom.langOptions.style.display = e.target.checked ? 'flex' : 'none';
    });

    dom.langOptions?.querySelectorAll('.language-option-compact').forEach(opt => {
        opt.addEventListener('click', () => {
            dom.langOptions.querySelectorAll('.language-option-compact').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
}

function translateUI() {
    if(!dom.modal) return;

    dom.modal.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const translation = Utils.getTranslation(key);
        if(translation) el.innerHTML = translation;
    });

    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        const translation = Utils.getTranslation(key);
        if(translation) el.placeholder = translation;
    });
}

function showProfileCompletionModal() {
    if (!dom.modal) return;
    translateUI();
    const userEmail = State.get('currentUser')?.email || '';
    if (dom.emailDisplay) {
        dom.emailDisplay.textContent = userEmail;
    }
    UI.openModal(dom.modal);
    updateStepDisplay();
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
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