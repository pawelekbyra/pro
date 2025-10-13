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
        title: document.getElementById('flTitle'),
        progressBar: document.getElementById('flProgressBar'),
        steps: document.querySelectorAll('.fl-step'),
        prevBtn: document.getElementById('flPrevBtn'),
        nextBtn: document.getElementById('flNextBtn'),
        submitBtn: document.getElementById('flSubmitBtn'),
        consentCheckbox: document.getElementById('flEmailConsent'),
        langOptionsContainer: document.getElementById('flLanguageOptions'),
        langOptions: document.querySelectorAll('.fl-language-option'),
        firstNameInput: document.getElementById('flFirstName'),
        lastNameInput: document.getElementById('flLastName'),
        passwordInput: document.getElementById('flPassword'),
        confirmPasswordInput: document.getElementById('flConfirmPassword'),
        emailDisplay: document.querySelector('.fl-email-display'),
    };
}

function updateStepDisplay() {
    if (!dom.modal) return;

    dom.steps.forEach((stepEl, i) => {
        if (i === currentStep) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });

    dom.prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
    dom.nextBtn.style.display = currentStep === totalSteps - 1 ? 'none' : 'inline-flex';
    dom.submitBtn.style.display = currentStep === totalSteps - 1 ? 'inline-flex' : 'none';

    if (dom.progressBar) {
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
    if (step === 1) { // Krok Imię/Nazwisko
        if (!dom.firstNameInput.value.trim() || !dom.lastNameInput.value.trim()) {
            UI.showAlert(Utils.getTranslation('errorMissingNames'), true); // POPRAWIONO KLUCZ
            return false;
        }
    }
    if (step === 2) { // Krok Hasło
        if (dom.passwordInput.value.length < 8) {
            UI.showAlert(Utils.getTranslation('errorMinPasswordLength'), true);
            return false;
        }
        if (dom.passwordInput.value !== dom.confirmPasswordInput.value) {
            UI.showAlert(Utils.getTranslation('errorPasswordsMismatch'), true); // POPRAWIONO KLUCZ
            return false;
        }
    }
    return true;
}

function collectData(step) {
    if (step === 0) {
        formData.email_consent = dom.consentCheckbox.checked;
        const activeLang = dom.langOptionsContainer.querySelector('.fl-language-option.active');
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

    const submitBtn = dom.submitBtn;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

    try {
        const result = await authManager.ajax('tt_complete_profile', formData, true);
        if (result.success) {
            const updatedUser = { ...State.get('currentUser'), ...result.data.userData, is_profile_complete: true };
            State.set('currentUser', updatedUser);
            document.dispatchEvent(new CustomEvent('user:profile_completed', { detail: { user: updatedUser } }));
            UI.showToast(Utils.getTranslation('profileUpdateSuccess'));
            hideModal();
            // Reset form state for next time
            currentStep = 0;
            formData = {};
            updateStepDisplay();
            dom.form.reset();

        } else {
            // FIX: Złap błąd z komunikatu serwera i wyświetl
            throw new Error(result.data?.message || Utils.getTranslation('profileUpdateFailedError'));
        }
    } catch (error) {
        UI.showAlert(error.message || Utils.getTranslation('genericError'), true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

function setupEventListeners() {
    if (!dom.modal || !dom.form) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form.addEventListener('submit', handleFormSubmit);

    dom.consentCheckbox?.addEventListener('change', e => {
        dom.langOptionsContainer.classList.toggle('visible', e.target.checked);
    });

    dom.langOptions?.forEach(opt => {
        opt.addEventListener('click', () => {
            dom.langOptions.forEach(o => o.classList.remove('active'));
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

    // FIX 2: Ustawienie domyślnego stanu: zgoda zaznaczona, język polski
    dom.consentCheckbox.checked = true;
    dom.langOptionsContainer.classList.add('visible'); // Pokaż opcje językowe
    dom.langOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.lang === 'pl') opt.classList.add('active'); // Domyślnie PL
    });

    const userEmail = State.get('currentUser')?.email || '';
    if (dom.emailDisplay) dom.emailDisplay.textContent = userEmail;

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