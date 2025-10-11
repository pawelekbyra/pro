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
            icon: '🌍',
            titleKey: 'firstLoginStep1Title',
            descriptionKey: 'firstLoginStep1Desc',
            renderFields: () => `
                <div class="preference-row">
                    <label class="preference-label">${Utils.getTranslation('emailLanguageLabel')}</label>
                    <div class="language-selector-compact first-login-lang-selector">
                        <div class="language-option-compact active" data-lang="pl">Polski</div>
                        <div class="language-option-compact" data-lang="en">English</div>
                    </div>
                </div>
                 <div class="preference-row first-login-consent-row" data-action="toggle-consent">
                    <label for="fl_email_consent" class="preference-label">${Utils.getTranslation('firstLoginConsentLabel')}</label>
                    <div class="toggle-switch active" id="fl_email_consent"><div class="toggle-slider"></div></div>
                </div>
            `,
            validate: () => true, // Zawsze można przejść dalej
            collectData: () => {
                formData.email_language = dom.stepFields.querySelector('.language-option-compact.active').dataset.lang;
                formData.email_consent = dom.stepFields.querySelector('#fl_email_consent').classList.contains('active');
            }
        },
        2: {
            icon: '🎭',
            titleKey: 'firstLoginStep2Title',
            descriptionKey: 'firstLoginStep2Desc',
            renderFields: () => `
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_firstname">${Utils.getTranslation('firstNameLabel')}</label>
                    <input type="text" id="fl_firstname" class="first-login-form-input" required autocomplete="given-name" placeholder="${Utils.getTranslation('firstNamePlaceholder')}">
                </div>
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_lastname">${Utils.getTranslation('lastNameLabel')}</label>
                    <input type="text" id="fl_lastname" class="first-login-form-input" required autocomplete="family-name" placeholder="${Utils.getTranslation('lastNamePlaceholder')}">
                </div>
            `,
            validate: () => {
                hideError();
                const firstName = dom.stepFields.querySelector('#fl_firstname').value.trim();
                const lastName = dom.stepFields.querySelector('#fl_lastname').value.trim();
                if (!firstName || !lastName) {
                    showError(Utils.getTranslation('errorMissingNames'));
                    return false;
                }
                return true;
            },
            collectData: () => {
                formData.first_name = dom.stepFields.querySelector('#fl_firstname').value.trim();
                formData.last_name = dom.stepFields.querySelector('#fl_lastname').value.trim();
            }
        },
        3: {
            icon: '🔑',
            titleKey: 'firstLoginStep3Title',
            descriptionKey: 'firstLoginStep3Desc',
            renderFields: () => `
                <div class="first-login-email-display">
                    <div class="first-login-email-label">${Utils.getTranslation('loginEmailLabel')}</div>
                    <div class="first-login-email-value">${State.get('currentUser')?.user_email || ''}</div>
                </div>
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_new_password">${Utils.getTranslation('newPasswordLabel')}</label>
                    <input type="password" id="fl_new_password" class="first-login-form-input" required autocomplete="new-password" minlength="8" placeholder="••••••••">
                </div>
                <div class="first-login-form-group">
                    <label class="first-login-form-label" for="fl_confirm_password">${Utils.getTranslation('confirmPasswordLabel')}</label>
                    <input type="password" id="fl_confirm_password" class="first-login-form-input" required autocomplete="new-password" minlength="8" placeholder="••••••••">
                </div>
            `,
            validate: () => {
                hideError();
                const password = dom.stepFields.querySelector('#fl_new_password').value;
                const confirmPassword = dom.stepFields.querySelector('#fl_confirm_password').value;

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
        const toggleRow = e.target.closest('[data-action="toggle-consent"]');
        if (toggleRow) {
            toggleRow.querySelector('.toggle-switch').classList.toggle('active');
        }

        const langOption = e.target.closest('.language-option-compact');
        if (langOption) {
            dom.stepFields.querySelector('.language-option-compact.active')?.classList.remove('active');
            langOption.classList.add('active');
        }
    });

    // Umożliwienie walidacji w czasie rzeczywistym
    dom.stepFields?.addEventListener('input', () => {
        updateButtonStates();
    });
}

function showProfileCompletionModal() {
    if (!dom.modal) return;
    resetModal();
    renderStep(currentStep);
    UI.openModal(dom.modal);
    document.dispatchEvent(new CustomEvent('tt:pause-video'));
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
    document.dispatchEvent(new CustomEvent('tt:play-video'));
}

function resetModal() {
    currentStep = 1;
    formData = {};
    dom.form?.reset();
    hideError();
}

function updateButtonStates() {
    const isStepValid = stepDefinitions[currentStep].validate();
    if (currentStep < totalSteps) {
        dom.nextBtn.disabled = !isStepValid;
    } else {
        dom.submitBtn.disabled = !isStepValid;
    }
}

function renderStep(stepNumber) {
    const step = stepDefinitions[stepNumber];
    if (!step) return;

    const elementsToAnimate = [dom.stepIcon, dom.stepDescription, dom.stepFields, dom.title];

    // Uruchom animację wyjścia
    elementsToAnimate.forEach(el => el.classList.add('is-exiting'));

    // Poczekaj na zakończenie animacji wyjścia
    setTimeout(() => {
        // Aktualizacja treści
        dom.title.innerHTML = Utils.getTranslation(step.titleKey);
        dom.stepIcon.innerHTML = step.icon;
        dom.stepDescription.innerHTML = Utils.getTranslation(step.descriptionKey);
        dom.stepFields.innerHTML = step.renderFields();

        // Aktualizacja przycisków
        dom.prevBtn.textContent = Utils.getTranslation('firstLoginPrev');
        dom.nextBtn.textContent = Utils.getTranslation('firstLoginNext');
        dom.submitBtn.textContent = Utils.getTranslation('firstLoginSubmit');

        // Usuń klasę wyjścia i dodaj klasę wejścia (jeśli używasz)
        elementsToAnimate.forEach(el => {
            el.classList.remove('is-exiting');
        });

        // Aktualizacja UI
        dom.progressBar.style.width = `${(stepNumber / totalSteps) * 100}%`;
        dom.prevBtn.style.display = stepNumber > 1 ? 'inline-flex' : 'none';
        dom.nextBtn.style.display = stepNumber < totalSteps ? 'inline-flex' : 'none';
        dom.submitBtn.style.display = stepNumber === totalSteps ? 'inline-flex' : 'none';

        // Ustaw stan przycisków po renderowaniu
        updateButtonStates();

        // Ustaw fokus na pierwszym polu formularza w kroku
        const firstInput = dom.stepFields.querySelector('input, select, button');
        firstInput?.focus();

    }, 300); // Czas musi pasować do czasu trwania animacji CSS
}

function handleNextStep() {
    const step = stepDefinitions[currentStep];
    if (step.validate()) {
        hideError();
        step.collectData();
        if (currentStep < totalSteps) {
            currentStep++;
            renderStep(currentStep);
        }
    } else {
        // Opcjonalnie: potrząśnij przyciskiem, żeby pokazać, że coś jest nie tak
        dom.nextBtn.classList.add('shake');
        setTimeout(() => dom.nextBtn.classList.remove('shake'), 500);
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