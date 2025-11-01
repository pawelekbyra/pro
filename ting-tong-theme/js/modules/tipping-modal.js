import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

let dom = {};
let currentStep = 0;
const totalSteps = 4;
let formData = {};
let previousStep = 0;
let stripe = null;
let elements = null;
let paymentElement = null;

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
        termsStep: document.getElementById('terms-step'),
        paymentMethodsContainer: document.querySelector('.payment-methods-container'),
    };
}

function updateStepDisplay(isShowingTerms = false) {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) {
        console.error("Tipping modal steps not found or cached correctly.");
        return;
    }

    // Nowa logika aktywnego kroku (4 to krok regulaminu)
    const activeStepIndex = isShowingTerms ? 4 : currentStep;

    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', step === activeStepIndex);
    });

    const isTermsVisible = dom.termsStep && dom.termsStep.classList.contains('active');
    const footer = dom.form.querySelector('.elegant-modal-footer');
    if (footer) {
        // Stopka ukryta na kroku 3 (przetwarzanie/redirect) i kroku 4 (regulamin)
        footer.style.display = (isTermsVisible || currentStep === 3) ? 'none' : 'block';
    }

    // Pokaż/ukryj przyciski
    if (dom.prevBtn) {
        // Przycisk "Wstecz" ukryty na kroku 0 i kroku 3
        dom.prevBtn.style.display = (currentStep > 0 && currentStep < 3) ? 'flex' : 'none';
    }

    if (dom.nextBtn) {
        // Przycisk "Dalej/Płać" ukryty na kroku 3
        dom.nextBtn.style.display = (currentStep < 3) ? 'flex' : 'none';

        // Zmień tekst przycisku na kroku 2 (ostatni krok przed przekierowaniem)
        const isFinalStepBeforePayment = currentStep === 2;
        // Użyj klucza 'tippingSubmit' dla przycisku końcowego
        const nextBtnText = isFinalStepBeforePayment ? Utils.getTranslation('tippingSubmit') : Utils.getTranslation('tippingNext');
        dom.nextBtn.textContent = nextBtnText;
    }

    // Aktualizuj pasek postępu
    if (dom.progressBar) {
        // totalSteps = 4 (0, 1, 2, 3)
        const progress = ((currentStep + 1) / totalSteps) * 100;
        dom.progressBar.style.width = `${progress}%`;
    }
}


function validateStep(step) {
    if (step === 0) {
        if (dom.createAccountCheckbox.checked) {
            const email = dom.emailInput.value.trim();
            if (email === '') {
                UI.showAlert(Utils.getTranslation('errorEmailRequired') || 'Adres e-mail jest wymagany.', true);
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                UI.showAlert(Utils.getTranslation('errorInvalidEmail') || 'Proszę podać poprawny adres e-mail.', true);
                return false;
            }
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

function handleNextStep() {
    collectData(currentStep);
    if (validateStep(currentStep)) {
        if (currentStep === 2) {
            confirmPayment();
        } else if (currentStep < totalSteps - 1) {
            currentStep++;
            updateStepDisplay();
            if (currentStep === 2) {
                initializePaymentElement();
            }
        }
    }
}

async function initializePaymentElement() {
    if (stripe && paymentElement) {
        return;
    }

    try {
        const response = await API.createStripePaymentIntent(formData);

        if (response.success && response.data.clientSecret) {
            const clientSecret = response.data.clientSecret;

            stripe = Stripe(TingTongConfig.stripePublicKey, {
                locale: 'pl'
            });

            elements = stripe.elements({ clientSecret });

            paymentElement = elements.create('payment', {
                layout: {
                    type: 'tabs',
                    defaultCollapsed: false
                }
            });

            paymentElement.mount('#stripe-payment-element');

        } else {
            const errorMessage = response.data?.message || 'Błąd: Nie udało się przygotować płatności.';
            UI.showAlert(errorMessage, true);
            currentStep = 1;
            updateStepDisplay();
        }

    } catch (error) {
        console.error('Błąd inicjalizacji Stripe:', error);
        UI.showAlert('Wystąpił błąd komunikacji z serwerem płatności.', true);
        currentStep = 1;
        updateStepDisplay();
    }
}

async function confirmPayment() {
    if (!stripe || !elements) {
        UI.showAlert('Brak inicjalizacji płatności. Odśwież modal.', true);
        return;
    }

    currentStep = 3;
    updateStepDisplay();

    const payerEmail = formData.email || null;

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href,
            payment_method_data: {
                billing_details: {
                    email: payerEmail,
                }
            }
        }
    });

    if (error) {
        UI.showAlert(error.message, true);
        currentStep = 2;
        updateStepDisplay();
    }
}

function collectData(step) {
    if (step === 0) {
        formData.create_account = dom.createAccountCheckbox.checked;
        formData.email = dom.emailInput.value.trim();
    } else if (step === 1) {
        formData.amount = parseFloat(dom.amountInput.value);
    }
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
        if (translation) {
            el.innerHTML = translation;
        }
    });

    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        let translation = Utils.getTranslation(key);
        if (typeof translation === 'object' && translation !== null) {
            translation = translation[currentLang] || translation['pl'] || '';
        }
        if (translation) {
            el.placeholder = translation;
        }
    });
}

function showModal() {
    cacheDOM();

    if (!dom.modal) {
        console.error("Tipping modal not found in DOM");
        return;
    }

    dom.createAccountCheckbox?.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    translateUI();
    currentStep = 0;

    const currentUser = State.get('currentUser');
    if (currentUser && currentUser.email) {
        dom.emailInput.value = currentUser.email;
    } else {
        dom.emailInput.value = '';
    }

    // Set default amount
    dom.amountInput.value = '';


    // Ensure checkbox is unchecked by default
    if (dom.createAccountCheckbox) {
        dom.createAccountCheckbox.checked = false;
    }
     if (document.getElementById('termsAccept')) {
        document.getElementById('termsAccept').checked = false;
    }
    // Hide email input by default
    if (dom.emailContainer) {
        dom.emailContainer.classList.remove('visible');
    }

    // Use the generic UI.openModal which should handle the .visible class
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

    // Listener for the close button
    if (dom.closeBtn) {
        dom.closeBtn.addEventListener('click', hideModal);
    }

    // Listener for the background overlay click
    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) {
            hideModal();
        }
        if (e.target.closest('[data-action="show-terms"]')) {
            e.preventDefault();
            showTerms();
        }
        if (e.target.closest('[data-action="hide-terms"]')) {
            hideTerms();
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