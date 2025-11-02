import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import * as ApiModule from './api.js';
const API = ApiModule.API;

let dom = {};
let stripe = null;
let elements = null;
let paymentElement = null;
let currentStep = 0;
const totalSteps = 3; // 0: options, 1: amount, 2: payment
let formData = {};
let previousStep = 0; // Zapamiętuje poprzedni krok przed pokazaniem regulaminu

// Pomocnicza funkcja do wyświetlania błędu wewnątrz modala
function showLocalError(stepIndex, message) {
    const errorContainerId = `tippingStep${stepIndex}Error`;
    const el = document.getElementById(errorContainerId);

    if (!el) {
        // Jeśli nie znaleziono lokalnego, użyj globalnego toast (choć jest to błąd UX)
        UI.showAlert(message, true);
        return;
    }

    // Ukryj wszystkie błędy oprócz bieżącego
    hideLocalErrors();

    el.textContent = message;
    el.style.display = 'block';
    requestAnimationFrame(() => el.classList.add('show'));

    // Ustaw automatyczne zniknięcie błędu
    el.timeout = setTimeout(() => {
        el.classList.remove('show');
        el.addEventListener('transitionend', () => el.style.display = 'none', { once: true });
    }, 4000);
}

// Pomocnicza funkcja do ukrywania wszystkich lokalnych błędów
function hideLocalErrors() {
    dom.modal.querySelectorAll('.elegant-modal-error').forEach(el => {
        clearTimeout(el.timeout);
        el.classList.remove('show');
        el.style.display = 'none';
    });
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
        termsStep: document.getElementById('terms-step'),
    };
}

function updateStepDisplay(isShowingTerms = false) {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) {
        console.error("Tipping modal steps not found or cached correctly.");
        return;
    }

    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', isShowingTerms ? step === 3 : step === currentStep);
    });

    const isTermsVisible = dom.termsStep && dom.termsStep.classList.contains('active');

    const isFirstStep = currentStep === 0;
    const isAmountStep = currentStep === 1;
    const isProcessingStep = currentStep === 2;

    // Pokaż/ukryj stopkę z przyciskami nawigacyjnymi
    dom.form.querySelector('.elegant-modal-footer').style.display = isTermsVisible ? 'none' : 'block';


    // Use flex as the new buttons are in a flex container
    dom.prevBtn.style.display = isAmountStep ? 'flex' : 'none';
    dom.nextBtn.style.display = isFirstStep ? 'flex' : 'none';
    dom.submitBtn.style.display = isAmountStep ? 'flex' : 'none';

    if (isProcessingStep) {
        dom.prevBtn.style.display = 'none';
        dom.nextBtn.style.display = 'none';
        dom.submitBtn.style.display = 'none';
    }

    if (dom.progressBar) {
        // Ensure progress bar never goes to 0% if it's visible
        const progress = currentStep > -1 ? ((currentStep + 1) / totalSteps) * 100 : 33.33;
        dom.progressBar.style.width = `${progress}%`;
    }
}

async function initializePaymentElement() {
    try {
        const paymentData = {
            amount: formData.amount,
            currency: formData.currency,
            email: formData.email,
        };
        const paymentIntent = await API.createStripePaymentIntent(paymentData);

        if (!paymentIntent || !paymentIntent.client_secret || !paymentIntent.publishable_key) {
            throw new Error('Invalid Payment Intent data from server.');
        }

        stripe = Stripe(paymentIntent.publishable_key);
        elements = stripe.elements({ clientSecret: paymentIntent.client_secret });
        paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element'); // Upewnij się, że masz ten kontener w HTML

    } catch (error) {
        console.error("Stripe initialization failed:", error);
        showLocalError(2, 'Nie udało się zainicjować płatności. Spróbuj ponownie.');
    }
}

async function confirmPayment() {
    if (!stripe || !elements) {
        showLocalError(2, 'Błąd konfiguracji Stripe. Odśwież stronę.');
        return;
    }

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href, // Użytkownik wróci na tę samą stronę
        },
    });

    if (error) {
        showLocalError(2, error.message || 'Wystąpił nieoczekiwany błąd płatności.');
    } else {
        UI.showToast('Płatność w toku...');
    }
}

function handleNextStep() {
    if (validateStep(currentStep)) {
        collectData(currentStep);
        if (currentStep < totalSteps - 1) {
            currentStep++;
            updateStepDisplay();
            if (currentStep === 2) { // Krok płatności
                initializePaymentElement();
            }
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
    // Ukryj poprzednie błędy przed walidacją
    hideLocalErrors();

    if (step === 0) {
        const isAccountCreation = dom.createAccountCheckbox.checked;
        const email = dom.emailInput.value.trim();

        if (isAccountCreation) {
            if (email === '') {
                showLocalError(0, Utils.getTranslation('errorEmailRequired') || 'Adres e-mail jest wymagany.');
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                showLocalError(0, Utils.getTranslation('errorInvalidEmail') || 'Proszę podać poprawny adres e-mail.');
                return false;
            }
        } else {
            if (email !== '' && !Utils.isValidEmail(email)) {
                showLocalError(0, Utils.getTranslation('errorInvalidEmail') || 'Proszę podać poprawny adres e-mail.');
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        const currency = document.getElementById('tippingCurrency').value;
        const minAmount = (currency === 'PLN') ? 5 : 1; // FIX: Wprowadź walidację 5 PLN, 1 dla reszty

        if (isNaN(amount) || amount < minAmount) {
            const currencyDisplay = currency.toUpperCase();
            const message = Utils.getTranslation('errorMinTipAmount')
                .replace('{minAmount}', minAmount)
                .replace('{currency}', currencyDisplay);
            showLocalError(1, message);
            return false;
        }

        if (!document.getElementById('termsAccept').checked) {
            showLocalError(1, 'Proszę zaakceptować Regulamin, aby przejść do płatności.');
            return false;
        }
    }
    return true;
}

function showTerms() {
    previousStep = currentStep; // Zapisz, z którego kroku przyszedłeś (1 lub 2)
    updateStepDisplay(true); // Wywołaj z flagą 'true', aby wyświetlić Krok 4 (Regulamin)
}

function hideTerms() {
    currentStep = previousStep; // Wróć do zapisanego Kroku
    updateStepDisplay(false);
}


function collectData(step) {
    if (step === 0) {
        formData.create_account = dom.createAccountCheckbox.checked;
        formData.email = dom.emailInput.value.trim();
    } else if (step === 1) {
        formData.amount = parseFloat(dom.amountInput.value);
        formData.currency = document.getElementById('tippingCurrency').value;
    }
}

async function handleFormSubmit() {
    if (currentStep !== 2) { // Tylko na kroku płatności
        if (!validateStep(currentStep)) return;
        collectData(currentStep);
        return;
    }

    await confirmPayment();
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
    handleFormSubmit,
};