import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

function getTranslatedText(key, fallback) {
    const translation = Utils.getTranslation(key);
    if (typeof translation === 'object' && translation !== null) {
        return translation[State.get('currentLang')] || fallback;
    }
    return translation || fallback;
}

let dom = {};
let currentStep = 0;
const totalSteps = 4;
let formData = {};
let previousStep = 0;

let stripe;
let elements;
let paymentElement;

let eventControllers = [];

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
        currencySelect: document.getElementById('tippingCurrency'),
        termsCheckbox: document.getElementById('termsAccept'),
        termsStep: document.getElementById('terms-step'),
        paymentElementContainer: document.getElementById('payment-element'),
        paymentMessage: document.getElementById('payment-message'),
        step0Error: document.getElementById('tippingStep0Error'),
        step1Error: document.getElementById('tippingStep1Error'),
    };
}

function addManagedEventListener(element, type, listener) {
    if (!element) return;
    element.addEventListener(type, listener);
    eventControllers.push({ element, type, listener });
}

function removeAllManagedEventListeners() {
    eventControllers.forEach(({ element, type, listener }) => {
        element.removeEventListener(type, listener);
    });
    eventControllers = [];
}

function showLocalError(step, message) {
    hideLocalErrors();
    const errorContainer = dom[`step${step}Error`];
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

function hideLocalErrors() {
    if (dom.step0Error) dom.step0Error.style.display = 'none';
    if (dom.step1Error) dom.step1Error.style.display = 'none';
}

function updateStepDisplay(isShowingTerms = false) {
    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', isShowingTerms ? step === 4 : step === currentStep);
    });

    const isTermsVisible = dom.termsStep?.classList.contains('active');
    dom.form.querySelector('.elegant-modal-footer').style.display = isTermsVisible ? 'none' : 'flex';

    const isEmailStep = currentStep === 0;
    const isAmountStep = currentStep === 1;
    const isPaymentStep = currentStep === 2;
    const isProcessingStep = currentStep === 3;

    dom.prevBtn.style.display = (isAmountStep || isPaymentStep) ? 'flex' : 'none';
    dom.nextBtn.style.display = (isEmailStep || isAmountStep) ? 'flex' : 'none';
    dom.submitBtn.style.display = isPaymentStep ? 'flex' : 'none';

    if (isPaymentStep) {
        dom.submitBtn.textContent = getTranslatedText('tippingPay', 'Pay!');
    } else {
        dom.nextBtn.textContent = getTranslatedText('tippingNext', 'ENTER');
    }

    if (isProcessingStep || isTermsVisible) {
        dom.prevBtn.style.display = 'none';
        dom.nextBtn.style.display = 'none';
        dom.submitBtn.style.display = 'none';
    }

    dom.progressBar.style.width = `${(currentStep / (totalSteps - 1)) * 100}%`;
}

function showTerms() {
    previousStep = currentStep;
    dom.title.textContent = getTranslatedText('tippingTermsTitle', 'Terms and Conditions');
    updateStepDisplay(true);
}

function hideTerms() {
    currentStep = previousStep;
    dom.title.textContent = getTranslatedText('tippingTitle', 'Tipping Gateway');
    updateStepDisplay(false);
}

async function handleNextStep(e) {
    e.preventDefault();
    hideLocalErrors();
    if (!validateStep(currentStep)) return;

    collectData(currentStep);

    if (currentStep === 0) {
        currentStep++;
        updateStepDisplay();
    } else if (currentStep === 1) {
        if (!validateStep(1)) return;

        // NAJPIERW PRZEJDŹ DO KROKU 3 (SPINNER), A DOPIERO POTEM INICJALIZUJ
        currentStep = 3; // Krok "Processing"
        updateStepDisplay();

        await initializePaymentElement();
    }
}


function handlePrevStep(e) {
    e.preventDefault();
    hideLocalErrors();
    if (currentStep > 0) {
        if (currentStep === 2 && paymentElement) {
            try {
                paymentElement.unmount();
            } catch (err) { /* ignore */ }
        }
        currentStep--;
        updateStepDisplay();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if (currentStep !== 2) return;

    dom.submitBtn.disabled = true;
    currentStep = 3;
    updateStepDisplay();

    const returnUrl = window.location.href.split('#')[0];
    const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: returnUrl,
            receipt_email: formData.email || undefined
        },
        redirect: 'if_required'
    });

    if (error) {
        UI.showToast(error.message || "An unexpected error occurred.", true);
        currentStep = 2;
        updateStepDisplay();
        dom.submitBtn.disabled = false;
        return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        try {
            await API.handleTipSuccess(paymentIntent.id);
            const successMessage = Utils.getTranslation('tippingSuccessMessage')
                .replace('{amount}', formData.amount.toFixed(2))
                .replace('{currency}', formData.currency.toUpperCase());
            UI.showToast(successMessage);
        } catch (apiError) {
            UI.showToast(apiError.message || "Payment succeeded, but server-side confirmation failed.", true);
        }
    }
    hideModal();
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
                showLocalError(0, getTranslatedText('errorInvalidEmail', 'Invalid email.'));
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        const currency = dom.currencySelect.value.toLowerCase();
        const minAmount = (currency === 'pln') ? 5 : 1;
        if (isNaN(amount) || amount < minAmount) {
            const msg = getTranslatedText('errorMinTipAmount', 'Min tip is {minAmount} {currency}.')
                .replace('{minAmount}', minAmount)
                .replace('{currency}', currency.toUpperCase());
            showLocalError(1, msg);
            return false;
        }
        if (!dom.termsCheckbox.checked) {
            showLocalError(1, getTranslatedText('errorTermsNotAccepted', 'Please accept the terms.'));
            return false;
        }
    }
    return true;
}

function collectData(step) {
    if (step === 0) {
        formData.create_account = dom.createAccountCheckbox.checked;
        formData.email = dom.emailInput.value.trim();
    } else if (step === 1) {
        formData.amount = parseFloat(dom.amountInput.value);
        formData.currency = dom.currencySelect.value.toLowerCase();
    }
}

async function initializePaymentElement() {
    if (paymentElement) {
        try { paymentElement.unmount(); } catch(e) {}
    }

    try {
        const clientSecret = await API.createStripePaymentIntent(formData.amount, formData.currency);
        const appearance = { theme: 'night', labels: 'floating' };
        elements = stripe.elements({ appearance, clientSecret, locale: State.get('currentLang') || 'auto' });
        paymentElement = elements.create("payment", { layout: 'tabs' });

        // TERAZ BEZPIECZNIE JEST MONTOWAĆ
        currentStep = 2; // Zmień na krok płatności
        updateStepDisplay(); // Pokaż kontener

        paymentElement.mount(dom.paymentElementContainer);

        paymentElement.on('ready', () => {
            dom.submitBtn.disabled = false;
        });

        paymentElement.on('error', (event) => {
            UI.showToast(event.error.message, true);
            currentStep = 1;
            updateStepDisplay();
        });

    } catch (error) {
        UI.showToast(error.message || "Payment initialization failed.", true);
        currentStep = 1;
        updateStepDisplay();
    }
}

function resetModalState() {
    currentStep = 0;
    formData = {};
    if (dom.form) dom.form.reset();
    if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
    if (dom.emailContainer) dom.emailContainer.classList.remove('visible');
    if (dom.paymentElementContainer) dom.paymentElementContainer.innerHTML = '';
    hideLocalErrors();
    updateStepDisplay();
}

function showModal() {
    cacheDOM();
    if (!stripe && window.Stripe && window.TingTongData?.stripePk) {
        stripe = window.Stripe(window.TingTongData.stripePk);
    }
    resetModalState();
    translateUI();

    addManagedEventListener(dom.closeBtn, 'click', hideModal);
    addManagedEventListener(dom.modal, 'click', e => {
        if (e.target === dom.modal) hideModal();
        if (e.target.closest('[data-action="show-terms"]')) { e.preventDefault(); showTerms(); }
        if (e.target.closest('[data-action="hide-terms"]')) { e.preventDefault(); hideTerms(); }
    });
    addManagedEventListener(dom.nextBtn, 'click', handleNextStep);
    addManagedEventListener(dom.prevBtn, 'click', handlePrevStep);
    addManagedEventListener(dom.form, 'submit', handleFormSubmit);
    addManagedEventListener(dom.createAccountCheckbox, 'change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    UI.openModal(dom.modal);
    updateStepDisplay();
}

function hideModal() {
    removeAllManagedEventListeners();
    UI.closeModal(dom.modal);
    setTimeout(resetModalState, 300);
}

function init() {
    // init jest teraz pusty, cała logika przeniesiona do showModal/hideModal
}

function translateUI() {
    if (!dom.modal) return;
    dom.modal.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const translation = Utils.getTranslation(key);
        if (translation) {
            el.innerHTML = typeof translation === 'object' ? translation[State.get('currentLang')] : translation;
        }
    });
    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        const translation = Utils.getTranslation(key);
        if (translation) {
            el.placeholder = typeof translation === 'object' ? translation[State.get('currentLang')] : translation;
        }
    });
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
    updateLanguage: translateUI,
};
