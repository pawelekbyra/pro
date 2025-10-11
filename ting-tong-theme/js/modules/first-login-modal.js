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
            icon: '🌐',
            titleKey: 'firstLoginStep1Title',
            descriptionKey: 'firstLoginStep1Desc',
            renderFields: () => `
                <div class="language-selector-compact first-login-lang-selector">
                    <div class="language-option-compact active" data-lang="pl">Polski</div>
                    <div class="language-option-compact" data-lang="en">English</div>
                </div>
            `,
            validate: () => true,
            collectData: () => {
                formData.email_language = dom.stepFields.querySelector('.language-option-compact.active').dataset.lang;
            }
        },
        2: {
            icon: '🔔',
            titleKey: 'firstLoginStep2Title',
            descriptionKey: 'firstLoginStep2Desc',
            renderFields: () => `
                <div class="preference-row first-login-consent-row">
                    <div class="toggle-switch active" id="fl_email_consent"><div class="toggle-slider"></div></div>
                    <label for="fl_email_consent" class="preference-label">${Utils.getTranslation('firstLoginConsentLabel')}</label>
                </div>
            `,
            validate: () => true,
            collectData: () => {
                formData.email_consent = dom.stepFields.querySelector('#fl_email_consent').classList.contains('active');
            }
        },
        3: {
            icon: '👤',
            titleKey: 'firstLoginStep3Title',
            descriptionKey: 'firstLoginStep3Desc',
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
                hideError();
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
        }
    };
}

function setupEventListeners() {
    if (!dom.modal) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form?.addEventListener('submit', handleFormSubmit);

    // Delegacja zdarzeń dla dynamicznie tworzonych pól
    dom.stepFields?.addEventListener('click', (e) => {
        const toggle = e.target.closest('.toggle-switch');
        if (toggle) {
            toggle.classList.toggle('active');
        }

        const langOption = e.target.closest('.language-option-compact');
        if (langOption) {
            dom.stepFields.querySelector('.language-option-compact.active')?.classList.remove('active');
            langOption.classList.add('active');
        }
    });
}


function showProfileCompletionModal() {
    if (!dom.modal) return;
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
    formData = {};
    dom.form?.reset();
    hideError();
}

function renderStep(stepNumber) {
    const step = stepDefinitions[stepNumber];
    if (!step) return;

    // Animacja wyjścia dla starych treści
    const elementsToAnimate = [dom.stepIcon, dom.stepDescription, dom.stepFields];
    elementsToAnimate.forEach(el => el.classList.add('is-exiting'));

    setTimeout(() => {
        // Aktualizacja treści
        dom.title.textContent = Utils.getTranslation(step.titleKey);
        dom.stepIcon.innerHTML = step.icon;
        dom.stepDescription.innerHTML = Utils.getTranslation(step.descriptionKey);
        dom.stepFields.innerHTML = step.renderFields();

        // Aktualizacja przycisków
        dom.prevBtn.textContent = Utils.getTranslation('firstLoginPrev');
        dom.nextBtn.textContent = Utils.getTranslation('firstLoginNext');
        dom.submitBtn.textContent = Utils.getTranslation('firstLoginSubmit');

        // Animacja wejścia dla nowych treści
        elementsToAnimate.forEach(el => {
            el.classList.remove('is-exiting');
            void el.offsetWidth; // Trigger reflow
        });

        // Aktualizacja UI
        dom.progressBar.style.width = `${(stepNumber / totalSteps) * 100}%`;
        dom.prevBtn.style.display = stepNumber > 1 ? 'inline-flex' : 'none';
        dom.nextBtn.style.display = stepNumber < totalSteps ? 'inline-flex' : 'none';
        dom.submitBtn.style.display = stepNumber === totalSteps ? 'inline-flex' : 'none';
    }, 250);
}

function handleNextStep() {
    hideError();
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
    hideError();
    if (currentStep > 1) {
        currentStep--;
        renderStep(currentStep);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    hideError();
    const step = stepDefinitions[currentStep];
    if (step.validate()) {
        step.collectData();

        const originalText = dom.submitBtn.innerHTML;
        dom.submitBtn.disabled = true;
        dom.submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

        try {
            // Używamy teraz `authManager.ajax` który wysyła dane jako JSON
            const result = await authManager.ajax('tt_complete_profile', formData, true); // `true` dla wysłania jako JSON

            if (result.success) {
                State.set('currentUser', result.data.userData);
                // Flaga `is_profile_complete` w `State` zostanie zaktualizowana
                State.get('currentUser').is_profile_complete = true;

                UI.showToast(result.data.message || 'Profil zaktualizowany!', 'success');
                setTimeout(() => {
                    hideModal();
                    // Nie ma potrzeby ręcznej aktualizacji UI, bo stan się zmienił
                    // i odpowiednie eventy powinny to obsłużyć.
                }, 1500);
            } else {
                throw new Error(result.data?.message || 'Wystąpił nieznany błąd.');
            }
        } catch (error) {
            showError(error.message);
        } finally {
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
    showProfileCompletionModal,
};