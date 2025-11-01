import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';

let dom = {};
let currentStep = 0;
const totalSteps = 4; // 0: options, 1: amount, 2: payment, 3: processing
let formData = {
    payment_method: 'blik', // Default payment method
    currency: 'PLN' // Default currency
};
let previousStep = 0; // Remembers the previous step before showing terms

function cacheDOM() {
    dom = {
        modal: document.getElementById('tippingModal'),
        closeBtn: document.querySelector('#tippingModal [data-action="close-modal"]'),
        form: document.getElementById('tippingForm'),
        title: document.getElementById('tippingTitle'),
        progressBar: document.getElementById('tippingProgressBar'),
        steps: document.querySelectorAll('#tippingModal .elegant-modal-step'),
        prevBtn: document.getElementById('tippingPrevBtn'),
        nextBtn: document.getElementById('tippingNextBtn'),
        submitBtn: document.getElementById('tippingSubmitBtn'),
        createAccountCheckbox: document.getElementById('tippingCreateAccount'),
        emailContainer: document.getElementById('tippingEmailContainer'),
        emailInput: document.getElementById('tippingEmail'),
        amountInput: document.getElementById('tippingAmount'),
        termsStep: document.getElementById('terms-step'),
        paymentMethodsContainer: document.querySelector('.payment-methods-container'),
        currencySelector: document.querySelector('.currency-selector'),
        selectedCurrency: document.querySelector('.selected-currency'),
        currencyList: document.querySelector('.currency-list'),
    };
}

function updateStepDisplay(isShowingTerms = false) {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) return;

    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        const isActive = isShowingTerms ?
            stepEl.id === 'terms-step' :
            step === currentStep && stepEl.id !== 'terms-step';
        stepEl.classList.toggle('active', isActive);
    });

    const footer = dom.form.querySelector('.elegant-modal-footer');
    if (footer) {
        footer.style.display = isShowingTerms ? 'none' : 'block';
    }

    const isProcessingStep = currentStep === 3;
    const isPaymentStep = currentStep === 2;

    if (dom.prevBtn) dom.prevBtn.style.display = (currentStep > 0 && !isProcessingStep) ? 'flex' : 'none';
    if (dom.nextBtn) dom.nextBtn.style.display = (currentStep < 2) ? 'flex' : 'none';
    if (dom.submitBtn) dom.submitBtn.style.display = isPaymentStep ? 'flex' : 'none';
    if (footer && isProcessingStep) footer.style.display = 'none';

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
    if (step === 0 && dom.createAccountCheckbox.checked) {
        const email = dom.emailInput.value.trim();
        if (email === '') {
            UI.showAlert(Utils.getTranslation('errorEmailRequired') || 'Adres e-mail jest wymagany.', true);
            return false;
        }
        if (!Utils.isValidEmail(email)) {
            UI.showAlert(Utils.getTranslation('errorInvalidEmail') || 'Proszę podać poprawny adres e-mail.', true);
            return false;
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        if (isNaN(amount) || amount < 1) {
            UI.showAlert(Utils.getTranslation('errorMinTipAmount'), true);
            return false;
        }
    } else if (step === 2) {
        if (!document.getElementById('termsAccept').checked) {
            UI.showAlert('Proszę zaakceptować regulamin.', true);
            return false;
        }
    }
    return true;
}

function showTerms() {
    previousStep = currentStep;
    updateStepDisplay(true);
}

function hideTerms() {
    currentStep = previousStep;
    updateStepDisplay(false);
}

function collectData(step) {
    if (step === 0) {
        formData.create_account = dom.createAccountCheckbox.checked;
        formData.email = dom.emailInput.value.trim();
    } else if (step === 1) {
        formData.amount = parseFloat(dom.amountInput.value);
    }
    // Payment method and currency are collected via dedicated event listeners
}

function setupListeners() {
    if (!dom.modal) return;

    dom.paymentMethodsContainer?.addEventListener('click', (e) => {
        const button = e.target.closest('.payment-method-btn');
        if (button) {
            dom.paymentMethodsContainer.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            formData.payment_method = button.dataset.method;
        }
    });

    dom.currencySelector?.addEventListener('click', () => {
        if(dom.currencyList) dom.currencyList.style.display = dom.currencyList.style.display === 'block' ? 'none' : 'block';
    });

    dom.currencyList?.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const newCurrency = e.target.dataset.currency;
            dom.selectedCurrency.textContent = newCurrency;
            formData.currency = newCurrency;
            dom.currencyList.style.display = 'none';
        }
    });

    dom.modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="show-terms"]')) {
            e.preventDefault();
            showTerms();
        }
        if (e.target.closest('[data-action="hide-terms"]')) {
            hideTerms();
        }
    });
}

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;

    collectData(currentStep);
    currentStep++; // Move to processing step
    updateStepDisplay();

    console.log('Processing payment with data:', formData);

    setTimeout(() => {
        UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', `${formData.amount.toFixed(2)} ${formData.currency}`));
        hideModal();

        setTimeout(() => {
            // Reset to initial state
            currentStep = 0;
            formData = { payment_method: 'blik', currency: 'PLN' };
            if(dom.form) dom.form.reset();

            const defaultMethod = dom.paymentMethodsContainer?.querySelector('[data-method="blik"]');
            if (defaultMethod) {
                 dom.paymentMethodsContainer.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('active'));
                 defaultMethod.classList.add('active');
            }
            if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
            if (dom.emailContainer) dom.emailContainer.classList.remove('visible');
            if(dom.selectedCurrency) dom.selectedCurrency.textContent = 'PLN';
            updateStepDisplay();
        }, 500);
    }, 2500);
}

function translateUI() {
    if (!dom.modal) return;
    const currentLang = State.get('currentLang') || 'pl';
    dom.modal.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        let translation = Utils.getTranslation(key);
        if (typeof translation === 'object' && translation !== null) {
            translation = translation[currentLang] || translation['pl'] || '';
        }
        if (translation) el.innerHTML = translation;
    });
    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        let translation = Utils.getTranslation(key);
        if (typeof translation === 'object' && translation !== null) {
            translation = translation[currentLang] || translation['pl'] || '';
        }
        if (translation) el.placeholder = translation;
    });
}

function showModal() {
    cacheDOM();
    if (!dom.modal) return;

    translateUI();
    currentStep = 0;

    const currentUser = State.get('currentUser');
    dom.emailInput.value = (currentUser && currentUser.email) ? currentUser.email : '';
    dom.amountInput.value = '';

    if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
    if (document.getElementById('termsAccept')) document.getElementById('termsAccept').checked = false;
    if (dom.emailContainer) dom.emailContainer.classList.remove('visible');

    // Reset to defaults
    formData = { payment_method: 'blik', currency: 'PLN' };
    if(dom.selectedCurrency) dom.selectedCurrency.textContent = 'PLN';
    const defaultMethod = dom.paymentMethodsContainer?.querySelector('[data-method="blik"]');
    if (defaultMethod) {
        dom.paymentMethodsContainer.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('active'));
        defaultMethod.classList.add('active');
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
    if (!dom.modal) return;

    if (dom.closeBtn) dom.closeBtn.addEventListener('click', hideModal);
    if (dom.form) dom.form.addEventListener('submit', handleFormSubmit);
    dom.createAccountCheckbox?.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) hideModal();
    });

    setupListeners();
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
    handleNextStep,
    handlePrevStep,
};
