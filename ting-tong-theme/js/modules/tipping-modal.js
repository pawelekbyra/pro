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
        currencyDisplay: document.getElementById('tippingCurrency'),
        termsCheckbox: document.getElementById('termsAccept'),
        termsStep: document.getElementById('terms-step'),
        paymentElementContainer: document.getElementById('payment-element'),
        paymentMessage: document.getElementById('payment-message'),
        // Error containers
        step0Error: document.getElementById('tippingStep0Error'),
        step1Error: document.getElementById('tippingStep1Error'),
    };
}

function showLocalError(step, messageKey) {
    hideLocalErrors();
    const errorContainer = dom[`step${step}Error`];
    if (errorContainer) {
        errorContainer.textContent = Utils.getTranslation(messageKey);
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
    dom.form.querySelector('.elegant-modal-footer').style.display = isTermsVisible ? 'none' : 'block';

    const isEmailStep = currentStep === 0;
    const isAmountStep = currentStep === 1;
    const isPaymentStep = currentStep === 2;
    const isProcessingStep = currentStep === 3;

    dom.prevBtn.style.display = (isAmountStep || isPaymentStep) ? 'flex' : 'none';
    dom.nextBtn.style.display = (isEmailStep || isAmountStep) ? 'flex' : 'none';

    // Zmiana tekstu przycisku na kroku płatności
    if (isPaymentStep) {
        dom.nextBtn.textContent = Utils.getTranslation('tippingPay');
    } else {
        dom.nextBtn.textContent = Utils.getTranslation('tippingNext');
    }

    // Ukryj wszystkie przyciski w kroku przetwarzania
    if (isProcessingStep || isTermsVisible) {
        dom.prevBtn.style.display = 'none';
        dom.nextBtn.style.display = 'none';
    }

    dom.progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
}

async function handleNextStep() {
    hideLocalErrors();
    if (!validateStep(currentStep)) return;

    collectData(currentStep);

    if (currentStep === 1) { // Po kroku kwoty, przed krokiem płatności
        await initializePaymentElement();
    } else if (currentStep === 2) { // Na kroku płatności, kliknięcie "Płacę!"
        await handleFormSubmit();
        return; // handleFormSubmit zarządza dalszymi krokami
    }

    if (currentStep < totalSteps - 1) {
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
            if (!email) {
                showLocalError(0, 'errorEmailRequired');
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                showLocalError(0, 'errorInvalidEmail');
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        if (isNaN(amount) || amount < 1) {
            showLocalError(1, 'errorInvalidAmount');
            return false;
        }
        if (!dom.termsCheckbox.checked) {
            showLocalError(1, 'errorTermsNotAccepted');
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
        formData.currency = dom.currencyDisplay.textContent.toLowerCase();
    }
}

async function initializePaymentElement() {
    try {
        const clientSecret = await API.createStripePaymentIntent(formData.amount, formData.currency);

        const appearance = { theme: 'night', labels: 'floating' };
        elements = stripe.elements({ appearance, clientSecret });

        const paymentElementOptions = {
            layout: {
                type: 'accordion',
                defaultCollapsed: true,
            }
        };

        paymentElement = elements.create("payment", paymentElementOptions);
        paymentElement.mount(dom.paymentElementContainer);

    } catch (error) {
        console.error("Error initializing Payment Element:", error);
        UI.showToast("Błąd inicjalizacji płatności.", true);
        // Cofnij do poprzedniego kroku, jeśli inicjalizacja się nie powiedzie
        handlePrevStep();
    }
}


async function handleFormSubmit() {
    // Ustawienie stanu przetwarzania
    currentStep = 3;
    updateStepDisplay();

    const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href.split('#')[0],
        },
        redirect: 'if_required'
    });

    if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
            UI.showToast(error.message, true);
        } else {
            UI.showToast("Wystąpił nieoczekiwany błąd płatności.", true);
        }
        currentStep = 2;
        updateStepDisplay();
        return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
            await API.handleTipSuccess(paymentIntent.id);
            UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', formData.amount.toFixed(2)));
        } catch (apiError) {
            console.error("Error confirming tip on backend:", apiError);
            UI.showToast("Płatność się udała, ale wystąpił błąd po stronie serwera.", true);
        }
    }

    hideModal();
}

function resetModalState() {
    currentStep = 0;
    formData = {};
    if(dom.form) dom.form.reset();
    dom.createAccountCheckbox.checked = false;
    dom.emailContainer.classList.remove('visible');
    dom.termsCheckbox.checked = false;
    if (dom.paymentElementContainer) {
        dom.paymentElementContainer.innerHTML = '';
    }
    hideLocalErrors();
    updateStepDisplay();
}

function showModal() {
    cacheDOM();
    if (!stripe) {
        stripe = Stripe(window.StripeData.publicKey);
    }

    resetModalState();
    translateUI();

    dom.createAccountCheckbox.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    const currentUser = State.get('currentUser');
    dom.emailInput.value = currentUser?.email || '';
    dom.amountInput.value = '';

    UI.openModal(dom.modal);
    updateStepDisplay();
}

function hideModal() {
    UI.closeModal(dom.modal);
    setTimeout(resetModalState, 300); // Reset po animacji zamknięcia
}

function init() {
    cacheDOM();
    if (!dom.modal) return;

    dom.closeBtn.addEventListener('click', hideModal);
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
    handleNextStep,
    handlePrevStep,
};
