import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

let dom = {};
let currentStep = 1;
const totalSteps = 3;
let formData = {};
let stepDefinitions = {};

function cacheDOM() {
  dom = {
    modal: document.getElementById('firstLoginModal'),
    form: document.getElementById('firstLoginForm'),
    title: document.getElementById('first-login-title'),
    progressBar: document.getElementById('firstLoginProgressBar'),
    stepIcon: document.getElementById('firstLoginStepIcon'),
    stepDescription: document.getElementById('firstLoginStepDescription'),
    stepFields: document.getElementById('firstLoginStepFields'),
    prevBtn: document.getElementById('firstLoginPrevBtn'),
    nextBtn: document.getElementById('firstLoginNextBtn'),
    submitBtn: document.getElementById('firstLoginSubmitBtn'),
    errorEl: document.getElementById('firstLoginError'),
  };
}

function initializeStepDefinitions() {
    stepDefinitions = {
        1: {
            titleKey: 'firstLoginStep1Title',
            icon: '👋',
            descriptionKey: 'firstLoginStep1Description',
            renderFields: (email) => `
                <div class="first-login-email-display">
                    <div class="first-login-email-label">${Utils.getTranslation('firstLoginEmailLabel')}</div>
                    <div class="first-login-email-value">${email}</div>
                    <p class="step-description-small">${Utils.getTranslation('firstLoginEmailHint')}</p>
                </div>
            `,
            validate: () => true,
        },
        2: {
            titleKey: 'firstLoginStep2Title',
            icon: '👤',
            descriptionKey: 'firstLoginStep2Description',
            renderFields: () => `
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_firstname">${Utils.getTranslation('firstNameLabel')}</label>
                    <input type="text" id="fl_firstname" class="first-login-form-input" required autocomplete="given-name">
                </div>
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_lastname">${Utils.getTranslation('lastNameLabel')}</label>
                    <input type="text" id="fl_lastname" class="first-login-form-input" required autocomplete="family-name">
                </div>
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_new_password">${Utils.getTranslation('newPasswordLabel')}</label>
                    <input type="password" id="fl_new_password" class="first-login-form-input" required autocomplete="new-password" minlength="8">
                </div>
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_confirm_password">${Utils.getTranslation('confirmPasswordLabel')}</label>
                    <input type="password" id="fl_confirm_password" class="first-login-form-input" required autocomplete="new-password" minlength="8">
                </div>
            `,
            validate: () => {
                const firstName = dom.stepFields.querySelector('#fl_firstname').value.trim();
                const lastName = dom.stepFields.querySelector('#fl_lastname').value.trim();
                const password = dom.stepFields.querySelector('#fl_new_password').value;
                const confirmPassword = dom.stepFields.querySelector('#fl_confirm_password').value;

                if (!firstName || !lastName) {
                    showError(Utils.getTranslation('errorMissingNames'));
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
            },
            collectData: () => {
                formData.first_name = dom.stepFields.querySelector('#fl_firstname').value.trim();
                formData.last_name = dom.stepFields.querySelector('#fl_lastname').value.trim();
                formData.new_password = dom.stepFields.querySelector('#fl_new_password').value;
            }
        },
        3: {
            titleKey: 'firstLoginStep3Title',
            icon: '⚙️',
            descriptionKey: 'firstLoginStep3Description',
            renderFields: () => `
                <div class="preference-row">
                    <span class="preference-label">${Utils.getTranslation('emailConsentLabel')}</span>
                    <div class="toggle-switch active" id="fl_email_consent"><div class="toggle-slider"></div></div>
                </div>
                <div class="preference-row">
                    <span class="preference-label">${Utils.getTranslation('emailLanguageLabel')}</span>
                    <div class="language-selector-compact">
                        <div class="language-option-compact active" data-lang="pl">PL</div>
                        <div class="language-option-compact" data-lang="en">EN</div>
                    </div>
                </div>
            `,
            validate: () => true,
            collectData: () => {
                formData.email_consent = dom.stepFields.querySelector('#fl_email_consent').classList.contains('active');
                formData.email_language = dom.stepFields.querySelector('.language-option-compact.active').dataset.lang;
            }
        }
    };
}

function setupEventListeners() {
    if (!dom.modal) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form?.addEventListener('submit', handleFormSubmit);
    dom.stepFields?.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-switch')) {
            e.target.closest('.toggle-switch').classList.toggle('active');
        }
        if (e.target.classList.contains('language-option-compact')) {
            dom.stepFields.querySelector('.language-option-compact.active')?.classList.remove('active');
            e.target.classList.add('active');
        }
    });
}

function checkProfileAndShowModal(userData) {
    if (!userData || userData.is_profile_complete) return;
    showProfileCompletionModal(userData.email);
}

function showProfileCompletionModal(userEmail) {
    if (!dom.modal) return;
    formData.email = userEmail;
    resetModal();
    renderStep(currentStep);
    UI.openModal(dom.modal);
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function resetModal() {
    currentStep = 1;
    formData = { email: formData.email }; // Zachowaj email
    dom.form?.reset();
    hideError();
}

function renderStep(stepNumber) {
    const step = stepDefinitions[stepNumber];
    if (!step) return;

    // Animate out old content
    const elementsToAnimate = [dom.stepIcon, dom.stepDescription, dom.stepFields];
    elementsToAnimate.forEach(el => el.classList.add('is-exiting'));

    setTimeout(() => {
        // Update content
        dom.title.textContent = Utils.getTranslation(step.titleKey);
        dom.stepIcon.innerHTML = step.icon;
        dom.stepDescription.innerHTML = Utils.getTranslation(step.descriptionKey);
        dom.stepFields.innerHTML = step.renderFields(formData.email);

        // Animate in new content
        elementsToAnimate.forEach(el => {
            el.classList.remove('is-exiting');
            // Trigger reflow to restart animation
            void el.offsetWidth;
        });

        // Update UI elements
        dom.progressBar.style.width = `${(stepNumber / totalSteps) * 100}%`;
        dom.prevBtn.style.display = stepNumber > 1 ? 'block' : 'none';
        dom.nextBtn.style.display = stepNumber < totalSteps ? 'block' : 'none';
        dom.submitBtn.style.display = stepNumber === totalSteps ? 'block' : 'none';
    }, 250); // Wait for fade out animation
}

function handleNextStep() {
    const step = stepDefinitions[currentStep];
    if (step.validate()) {
        step.collectData();
        if (currentStep < totalSteps) {
            currentStep++;
            renderStep(currentStep);
        }
    }
}

function handlePrevStep() {
    if (currentStep > 1) {
        currentStep--;
        renderStep(currentStep);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const step = stepDefinitions[currentStep];
    if (step.validate()) {
        step.collectData();

        const originalText = dom.submitBtn.innerHTML;
        dom.submitBtn.disabled = true;
        dom.submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

        try {
            const result = await authManager.ajax('tt_complete_profile', formData);
            if (result.success) {
                State.set('currentUser', result.data.userData);
                State.set('isUserLoggedIn', true);
                if (result.data?.new_nonce) ajax_object.nonce = result.data.new_nonce;
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
            dom.submitBtn.innerHTML = originalText;
        }
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
        initializeStepDefinitions();
        setupEventListeners();
    }
}

export const FirstLoginModal = {
    init,
    checkProfileAndShowModal,
};