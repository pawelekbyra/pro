import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

let dom = {};
let currentStep = 0;
const totalSteps = 4; // 0: options, 1: amount, 2: payment, 3: processing
let formData = {};
let previousStep = 0;

// Stripe variables
let stripe;
let elements;
let paymentElement;

// Helper to safely get translated string
function getTranslatedText(key, fallbackText) {
    const translation = Utils.getTranslation(key);
    if (typeof translation === 'object' && translation !== null && State.get('currentLang')) {
        return translation[State.get('currentLang')] || fallbackText;
    }
    return translation || fallbackText;
}

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
        currencySelect: document.getElementById('tippingCurrency'), // Updated selector
        termsCheckbox: document.getElementById('termsAccept'),
        termsStep: document.getElementById('terms-step'),
        paymentElementContainer: document.getElementById('payment-element'),
        paymentMessage: document.getElementById('payment-message'),
        step0Error: document.getElementById('tippingStep0Error'),
        step1Error: document.getElementById('tippingStep1Error'),
    };
}

function showLocalError(step, message) {
    hideLocalErrors();
    const errorContainer = dom[`step${step}Error`];
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.classList.add('show');
        errorContainer.style.display = 'block';
    }
}

function hideLocalErrors() {
    if (dom.step0Error) { dom.step0Error.style.display = 'none'; dom.step0Error.classList.remove('show'); }
    if (dom.step1Error) { dom.step1Error.style.display = 'none'; dom.step1Error.classList.remove('show'); }
}

function updateStepDisplay(isShowingTerms = false) {
    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', isShowingTerms ? step === 4 : step === currentStep);
    });

    const isTermsVisible = dom.termsStep?.classList.contains('active');
    dom.form.querySelector('.elegant-modal-footer').style.display = isTermsVisible ? 'none' : 'block';

    const isEmailStep = currentStep === 0;
    const isAmountStep = currentStep === 1;
    const isPaymentStep = currentStep === 2;
    const isProcessingStep = currentStep === 3;

    dom.prevBtn.style.display = (isAmountStep || isPaymentStep) ? 'flex' : 'none';
    dom.nextBtn.style.display = isEmailStep ? 'flex' : 'none';
    dom.submitBtn.style.display = (isAmountStep || isPaymentStep) ? 'flex' : 'none';
    dom.nextBtn.textContent = 'ENTER';
    dom.submitBtn.textContent = 'ENTER';

    if (isProcessingStep || isTermsVisible) {
        dom.prevBtn.style.display = 'none';
        dom.nextBtn.style.display = 'none';
        dom.submitBtn.style.display = 'none';
    }

    dom.progressBar.style.width = `${(currentStep / (totalSteps - 1)) * 100}%`;
}


async function handleNextStep() {
    hideLocalErrors();
    if (!validateStep(currentStep)) return;
    collectData(currentStep);
    if (currentStep === 0) {
        currentStep++;
        updateStepDisplay();
    }
}

async function handleTippingSubmit() {
    hideLocalErrors();
    if (!validateStep(1)) return;
    collectData(1);
    currentStep = 3;
    updateStepDisplay();

    try {
        await initializePaymentElement();
        currentStep = 2;
        updateStepDisplay();
    } catch (error) {
        console.error("Error initializing Payment Element:", error);
        UI.showToast(error.message || getTranslatedText('tippingErrorInit', 'Payment initialization error.'), true);
        currentStep = 1;
        updateStepDisplay();
    }
}

function handlePrevStep() {
    hideLocalErrors();
    if (currentStep > 0) {
        if (currentStep === 2 && paymentElement) {
            try { paymentElement.unmount(); } catch (e) { /* ignore */ }
        }
        currentStep--;
        updateStepDisplay();
    }
}

function validateStep(step) {
    if (step === 0) {
        if (dom.createAccountCheckbox.checked) {
            const email = dom.emailInput.value.trim();
            if (!email) {
                showLocalError(0, getTranslatedText('errorEmailRequired', 'Email is required.'));
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                showLocalError(0, getTranslatedText('errorInvalidEmail', 'Invalid email format.'));
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        const currency = dom.currencySelect.value.toLowerCase(); // Read from select
        const minAmount = (currency === 'pln') ? 5 : 1;

        if (isNaN(amount) || amount < minAmount) {
            const currencyDisplay = currency.toUpperCase();
            const message = (getTranslatedText('errorMinTipAmount', "Minimum tip amount is {minAmount} {currency}."))
                .replace('{minAmount}', minAmount.toFixed(2))
                .replace('{currency}', currencyDisplay);
            showLocalError(1, message);
            return false;
        }

        if (!dom.termsCheckbox.checked) {
            showLocalError(1, getTranslatedText('errorTermsRequired', 'Please accept the Terms to proceed.'));
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
        formData.currency = dom.currencySelect.value; // Read from select
    }
}

function initializePaymentElement() {
    return new Promise(async (resolve, reject) => {
        if (paymentElement) {
            try { paymentElement.unmount(); } catch (e) { /* ignore */ }
        }

        try {
            const clientSecret = await API.createStripePaymentIntent(formData.amount, formData.currency);
            const appearance = { theme: 'night', labels: 'floating', variables: { colorPrimary: '#ff0055', colorBackground: '#1c1c1e' } };
            elements = stripe.elements({ appearance, clientSecret });
            paymentElement = elements.create("payment", {
                layout: 'tabs',
                wallets: 'never',
                fields: { billingDetails: { email: formData.email ? 'never' : 'auto' } }
            });

            paymentElement.on('ready', () => {
                console.log('Stripe Payment Element is ready.');
                resolve();
            });

            paymentElement.on('error', (event) => {
                console.error('Stripe Payment Element error:', event.error);
                reject(new Error(event.error.message));
            });

            paymentElement.mount(dom.paymentElementContainer);

        } catch (error) {
            console.error("API Error during Payment Element initialization:", error);
            reject(error);
        }
    });
}

async function handleFormSubmit() {
    if (currentStep !== 2) return;
    dom.submitBtn.disabled = true;
    currentStep = 3;
    updateStepDisplay();

    const returnUrl = window.location.href.split('#')[0];
    const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl, receipt_email: formData.email || undefined },
        redirect: 'if_required'
    });

    if (error) {
        const errorMsg = error.message || getTranslatedText('tippingErrorUnexpected', "An unexpected payment error occurred.");
        UI.showToast(errorMsg, true);
        currentStep = 2;
        updateStepDisplay();
        dom.submitBtn.disabled = false;
        return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        try {
            await API.handleTipSuccess(paymentIntent.id);
            const successMsg = getTranslatedText('tippingSuccessMessage', "Payment successful. Thank you!").replace('{amount}', formData.amount.toFixed(2));
            UI.showToast(successMsg);
        } catch (apiError) {
            console.error("Error confirming tip on backend:", apiError);
            UI.showToast(apiError.message || getTranslatedText('tippingErrorServer', "Payment succeeded, but a server-side error occurred."), true);
        }
    }

    hideModal();
}

function resetModalState() {
    currentStep = 0;
    formData = {};
    if (dom.form) dom.form.reset();
    if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
    if (dom.emailContainer) dom.emailContainer.classList.remove('visible');
    if (dom.termsCheckbox) dom.termsCheckbox.checked = false;
    if (dom.paymentElementContainer) dom.paymentElementContainer.innerHTML = '';
    hideLocalErrors();
    updateStepDisplay();
}

function showModal() {
    cacheDOM();

    if (!stripe && window.Stripe) {
        const stripePk = (typeof window.TingTongData !== 'undefined' && window.TingTongData.stripePk) || null;
        if (!stripePk) {
            UI.showAlert(getTranslatedText('tippingErrorNoStripeKey', "Critical Error: Stripe public key is missing."), true);
            return;
        }
        stripe = window.Stripe(stripePk);
    } else if (!window.Stripe) {
        UI.showAlert(getTranslatedText('tippingErrorNoStripeLib', "Critical Error: Stripe.js library is not loaded."), true);
        return;
    }

    resetModalState();
    translateUI();

    if (dom.createAccountCheckbox) dom.createAccountCheckbox.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    const currentUser = State.get('currentUser');
    if (dom.emailInput) dom.emailInput.value = currentUser?.email || '';
    if (dom.amountInput) dom.amountInput.value = '';

    UI.openModal(dom.modal);
    updateStepDisplay();
}

function hideModal() {
    UI.closeModal(dom.modal);
    setTimeout(resetModalState, 300);
}

function init() {
    cacheDOM();
    if (!dom.modal) return;
    if (dom.closeBtn) dom.closeBtn.addEventListener('click', hideModal);
    if (dom.nextBtn) dom.nextBtn.addEventListener('click', handleNextStep);
    if (dom.submitBtn) dom.submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentStep === 1) await handleTippingSubmit();
        else if (currentStep === 2) await handleFormSubmit();
    });
    if (dom.prevBtn) dom.prevBtn.addEventListener('click', handlePrevStep);
    dom.modal.addEventListener('click', e => {
        if (e.target === dom.modal) hideModal();
        if (e.target.closest('[data-action="show-terms"]')) { e.preventDefault(); showTerms(); }
        if (e.target.closest('[data-action="hide-terms"]')) hideTerms();
    });
}

function translateUI() {
    if (!dom.modal) return;
    dom.modal.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const translation = Utils.getTranslation(key);
        if (translation) el.innerHTML = typeof translation === 'object' ? translation[State.get('currentLang')] : translation;
    });
    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        const translation = Utils.getTranslation(key);
        if (translation) el.placeholder = typeof translation === 'object' ? translation[State.get('currentLang')] : translation;
    });
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
};
