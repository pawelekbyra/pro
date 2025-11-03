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
let clientSecret;
let isStripeInitialized = false;

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
        termsStep: document.getElementById('terms-step'),
        paymentElementContainer: document.getElementById('payment-element'),
        paymentErrorContainer: document.getElementById('tippingPaymentError'),
    };
}

async function initializeStripe() {
    if (isStripeInitialized) return;

    if (typeof Stripe === 'undefined') {
        UI.showToast("Ładowanie modułu płatności...", false, 2000);
        await Utils.loadScript('https://js.stripe.com/v3/');
    }

    if (typeof TingTongConfig === 'undefined' || !TingTongConfig.stripePublicKey) {
        console.error("Stripe publishable key is not defined.");
        showLocalError("Błąd konfiguracji płatności.");
        return;
    }

    stripe = Stripe(TingTongConfig.stripePublicKey);
    isStripeInitialized = true;
}

async function initializePaymentElement() {
    if (!stripe) await initializeStripe();

    showProcessingSpinner(true);
    hideLocalErrors();

    const response = await API.createStripePaymentIntent({
        amount: formData.amount,
        email: formData.email,
        currency: formData.currency,
    });

    showProcessingSpinner(false);

    if (!response.success || !response.data.client_secret) {
        console.error("Failed to create Payment Intent:", response);
        showLocalError(response.data.message || "Nie udało się zainicjować płatności.");
        return;
    }

    clientSecret = response.data.client_secret;
    elements = stripe.elements({ clientSecret });

    const paymentElement = elements.create('payment', {
        layout: { type: 'accordion', defaultCollapsed: true }
    });
    paymentElement.mount(dom.paymentElementContainer);

    paymentElement.on('ready', () => {
        dom.nextBtn.disabled = false;
    });

    paymentElement.on('change', (event) => {
        if (event.error) {
            showLocalError(event.error.message);
        } else {
            hideLocalErrors();
        }
    });
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    showProcessingSpinner(true);
    dom.nextBtn.disabled = true;

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href,
        },
        redirect: 'if_required'
    });

    if (error) {
        showProcessingSpinner(false);
        dom.nextBtn.disabled = false;
        showLocalError(error.message);
        console.error("Stripe confirmPayment error:", error);
    } else {
        // Payment successful!
        currentStep = 3;
        updateStepDisplay();
        setTimeout(() => {
            UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', formData.amount.toFixed(2)));
            hideModal();
            resetModalState();
        }, 1500);
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

    const isProcessing = currentStep === 3;

    if (footer && isProcessing) footer.style.display = 'none';
    if (dom.prevBtn) dom.prevBtn.style.display = (currentStep > 0 && !isProcessing) ? 'flex' : 'none';
    if (dom.nextBtn) {
       dom.nextBtn.style.display = !isProcessing ? 'flex' : 'none';
       dom.nextBtn.textContent = currentStep === 2 ? Utils.getTranslation("tippingPayButton") : Utils.getTranslation("tippingNextButton");
    }

    if (dom.progressBar) {
        const progress = isProcessing ? 100 : ((currentStep + 1) / totalSteps) * 100;
        dom.progressBar.style.width = `${progress}%`;
    }
}


async function handleNextStep() {
    hideLocalErrors();
    if (!validateStep(currentStep)) return;

    collectData(currentStep);

    if (currentStep === 1) { // Moving to payment step
        currentStep++;
        updateStepDisplay();
        dom.nextBtn.disabled = true;
        await initializePaymentElement();
    } else if (currentStep < 2) {
        currentStep++;
        updateStepDisplay();
    }
}


function handlePrevStep() {
    hideLocalErrors();
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
                showLocalError(Utils.getTranslation('errorEmailRequired'));
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                showLocalError(Utils.getTranslation('errorInvalidEmail'));
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        if (isNaN(amount) || amount < 1) {
            showLocalError(Utils.getTranslation('errorMinTipAmount'));
            return false;
        }
        if (!document.getElementById('termsAccept').checked) {
            showLocalError('Proszę zaakceptować regulamin.');
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
    dom.modal.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        el.innerHTML = Utils.getTranslation(key);
    });
    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        el.placeholder = Utils.getTranslation(key);
    });
}

function resetModalState() {
     setTimeout(() => {
        currentStep = 0;
        formData = {};
        if (dom.form) dom.form.reset();
        if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
        if (dom.emailContainer) dom.emailContainer.classList.remove('visible');
        if (document.getElementById('termsAccept')) document.getElementById('termsAccept').checked = false;
        if (dom.paymentElementContainer) dom.paymentElementContainer.innerHTML = '';
        dom.nextBtn.disabled = false;
        hideLocalErrors();
        updateStepDisplay();
    }, 500);
}

function showModal() {
    cacheDOM();
    if (!dom.modal) return;

    initializeStripe(); // Load Stripe.js in the background

    dom.createAccountCheckbox?.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    translateUI();
    resetModalState();

    const currentUser = State.get('currentUser');
    if (currentUser && currentUser.email) {
        dom.emailInput.value = currentUser.email;
    }

    UI.openModal(dom.modal);
    updateStepDisplay();
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function showLocalError(message) {
    if (dom.paymentErrorContainer) {
        dom.paymentErrorContainer.textContent = message;
        dom.paymentErrorContainer.style.display = 'block';
    } else {
        UI.showAlert(message, true);
    }
}

function hideLocalErrors() {
    if (dom.paymentErrorContainer) {
        dom.paymentErrorContainer.style.display = 'none';
    }
}

function showProcessingSpinner(show) {
    const spinner = dom.modal.querySelector('.processing-spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
    if(dom.paymentElementContainer) {
       dom.paymentElementContainer.style.display = show ? 'none' : 'block';
    }
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

    dom.form.addEventListener('submit', (e) => e.preventDefault());
    dom.nextBtn.addEventListener('click', (e) => {
        if(currentStep === 2) {
            handlePaymentSubmit(e);
        } else {
            handleNextStep();
        }
    });
    dom.prevBtn.addEventListener('click', handlePrevStep);
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
};
