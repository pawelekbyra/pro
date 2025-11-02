import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

let dom = {};
let currentStep = 0;
const totalSteps = 4; // 0: options, 1: amount, 2: payment, 3: processing
let formData = {};
let previousStep = 0;

// Stripe-specific variables
let stripe;
let elements;
let paymentElement;

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
        createAccountCheckbox: document.getElementById('tippingCreateAccount'),
        emailContainer: document.getElementById('tippingEmailContainer'),
        emailInput: document.getElementById('tippingEmail'),
        amountInput: document.getElementById('tippingAmount'),
        currencySelect: document.getElementById('tippingCurrency'),
        termsAcceptCheckbox: document.getElementById('termsAccept'),
        termsStep: document.getElementById('terms-step'),
        paymentElementContainer: document.getElementById('stripe-payment-element'),
        paymentSubmitBtn: document.getElementById('tippingSubmitPaymentBtn'),
        paymentProcessingContainer: document.querySelector('[data-step="3"] .elegant-modal-fields-container'),
    };
}

async function initializePaymentElement() {
    if (!dom.paymentElementContainer) return;
    dom.paymentElementContainer.innerHTML = '<div class="loading-spinner"></div>'; // Show loader
    dom.paymentSubmitBtn.style.display = 'none';

    try {
        const data = {
            amount: formData.amount,
            currency: formData.currency,
            email: formData.email,
        };
        const response = await API.createStripePaymentIntent(data);

        if (response.success && response.data.clientSecret) {
            const { clientSecret } = response.data;

            if (!stripe) {
                 stripe = Stripe(TingTongConfig.stripePublicKey);
            }

            elements = stripe.elements({ clientSecret });

            paymentElement = elements.create('payment', {
                layout: {
                    type: 'accordion',
                    defaultCollapsed: true,
                }
            });

            dom.paymentElementContainer.innerHTML = ''; // Clear loader
            paymentElement.mount(dom.paymentElementContainer);
            dom.paymentSubmitBtn.style.display = 'flex'; // Show pay button
        } else {
            throw new Error(response.data.message || 'Failed to initialize payment.');
        }
    } catch (error) {
        console.error("Stripe initialization failed:", error);
        UI.showAlert(error.message || 'Błąd inicjalizacji płatności.', true);
        dom.paymentElementContainer.innerHTML = `<p class="error-text">${error.message || 'Nie udało się załadować formularza płatności. Spróbuj ponownie.'}</p>`;
    }
}


async function handlePaymentSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) {
        return;
    }

    currentStep = 3; // Move to processing step
    updateStepDisplay();

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href,
            receipt_email: formData.email,
        },
    });

    if (error) {
        UI.showAlert(error.message, true);
        currentStep = 2; // Go back to payment step
        updateStepDisplay();
    } else {
        // This part is rarely reached because Stripe redirects. Handle success on the return URL.
        UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', formData.amount.toFixed(2)));
        hideModal();
    }
}


function updateStepDisplay(isShowingTerms = false) {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) return;

    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', isShowingTerms ? step === 4 : step === currentStep);
    });

    const isTermsVisible = dom.termsStep && dom.termsStep.classList.contains('active');
    const footer = dom.form.querySelector('.elegant-modal-footer');
    if (footer) footer.style.display = isTermsVisible ? 'none' : 'block';

    const isProcessingStep = currentStep === 3;
    const isPaymentStep = currentStep === 2;

    dom.prevBtn.style.display = (currentStep > 0 && !isProcessingStep) ? 'flex' : 'none';
    dom.nextBtn.style.display = (currentStep < 2) ? 'flex' : 'none';
    dom.paymentSubmitBtn.style.display = (isPaymentStep && paymentElement) ? 'flex' : 'none';

    if (footer && (isProcessingStep || isPaymentStep)) {
        footer.style.display = 'none';
    }

    const progress = ((currentStep + 1) / totalSteps) * 100;
    dom.progressBar.style.width = `${progress}%`;

    // Handle button text change
    if (currentStep === 1) {
        dom.nextBtn.querySelector('span').textContent = Utils.getTranslation('tippingProceedToPayment');
    } else {
        dom.nextBtn.querySelector('span').textContent = Utils.getTranslation('tippingNext');
    }
}

function handleNextStep() {
    if (validateStep(currentStep)) {
        collectData(currentStep);
        if (currentStep < 2) { // Stop before payment step
            currentStep++;
            if (currentStep === 2) {
                initializePaymentElement();
            }
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
    if (step === 0) {
        if (dom.createAccountCheckbox.checked) {
            const email = dom.emailInput.value.trim();
            if (email === '') {
                UI.showAlert(Utils.getTranslation('errorEmailRequired'), true);
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                UI.showAlert(Utils.getTranslation('errorInvalidEmail'), true);
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        if (isNaN(amount) || amount < 1) {
            UI.showAlert(Utils.getTranslation('errorMinTipAmount'), true);
            return false;
        }
        if (!dom.termsAcceptCheckbox.checked) {
            UI.showAlert(Utils.getTranslation('errorAcceptTerms'), true);
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
        formData.currency = dom.currencySelect.value;
    }
}

function showTerms() {
    previousStep = currentStep;
    updateStepDisplay(true);
}

function hideTerms() {
    currentStep = previousStep;
    updateStepDisplay(false);
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

function resetModalState() {
    currentStep = 0;
    formData = {};
    if (dom.form) dom.form.reset();
    if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
    if (dom.emailContainer) dom.emailContainer.classList.remove('visible');
    if (dom.termsAcceptCheckbox) dom.termsAcceptCheckbox.checked = false;
    if (dom.paymentElementContainer) dom.paymentElementContainer.innerHTML = '';
    paymentElement = null;
    updateStepDisplay();
}

function showModal() {
    cacheDOM();
    if (!dom.modal) return;

    // Load Stripe.js script if not already loaded
    if (typeof Stripe === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        document.head.appendChild(script);
        script.onload = () => {
            stripe = Stripe(TingTongConfig.stripePublicKey);
        };
    } else if (!stripe) {
        stripe = Stripe(TingTongConfig.stripePublicKey);
    }

    resetModalState();
    translateUI();

    const currentUser = State.get('currentUser');
    dom.emailInput.value = (currentUser && currentUser.email) ? currentUser.email : '';
    dom.amountInput.value = '';

    UI.openModal(dom.modal);
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
    setTimeout(resetModalState, 500);
}

function init() {
    cacheDOM();
    if (!dom.modal) return;

    dom.closeBtn?.addEventListener('click', hideModal);
    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) hideModal();
        if (e.target.closest('[data-action="show-terms"]')) {
            e.preventDefault();
            showTerms();
        }
        if (e.target.closest('[data-action="hide-terms"]')) hideTerms();
    });

    dom.createAccountCheckbox?.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    dom.paymentSubmitBtn?.addEventListener('click', handlePaymentSubmit);
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
    handleNextStep,
    handlePrevStep,
};
