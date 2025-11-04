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

    // Obsługa przycisków
    dom.nextBtn.style.display = (isEmailStep) ? 'flex' : 'none';
    dom.submitBtn.style.display = (isAmountStep || isPaymentStep) ? 'flex' : 'none';

    // Zmiana tekstu przycisku w kroku 2 na "Płacę!"
    if (isPaymentStep) {
        dom.submitBtn.textContent = Utils.getTranslation('tippingPay') || 'Płacę!';
    } else {
        dom.submitBtn.textContent = Utils.getTranslation('tippingSubmit') || 'Przejdź do płatności';
    }

    // Ukryj wszystkie przyciski w kroku przetwarzania
    if (isProcessingStep || isTermsVisible) {
        dom.prevBtn.style.display = 'none';
        dom.nextBtn.style.display = 'none';
        dom.submitBtn.style.display = 'none';
    }

    // Korekta progresu - totalSteps to 4 (0-3), ale kroki są 0, 1, 2, 3
    dom.progressBar.style.width = `${(currentStep / (totalSteps - 1)) * 100}%`;
}

async function handleNextStep() {
    hideLocalErrors();
    if (!validateStep(currentStep)) return;

    collectData(currentStep);

    // Ta funkcja obsługuje tylko przejście z Kroku 0 na 1
    if (currentStep === 0) {
        currentStep++;
        updateStepDisplay();
        return;
    }
}

// Nowa funkcja do obsługi przejścia z Kroku 1 (Kwota)
async function handleTippingSubmit() {
    hideLocalErrors();
    if (!validateStep(1)) return; // Walidacja Kroku 1

    collectData(1);

    // Przejście do kroku 2: inicjalizacja płatności
    currentStep = 2;
    updateStepDisplay();

    // Dodaj spinner do przycisku na czas inicjalizacji
    dom.submitBtn.disabled = true;
    const originalText = dom.submitBtn.textContent;
    dom.submitBtn.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('savingButtonText') || 'Ładowanie...'}`;

    await initializePaymentElement(originalText);
}


function handlePrevStep() {
    hideLocalErrors();
    if (currentStep > 0) {
        if (currentStep === 2 && paymentElement) {
            // Demontaż Payment Element
             try {
                paymentElement.unmount();
             } catch(e) { /* ignore */ }
        }
        currentStep--;
        updateStepDisplay();
    }
}

function validateStep(step) {
    // Krok 0: Walidacja emaila
    if (step === 0) {
        if (dom.createAccountCheckbox.checked) {
            const email = dom.emailInput.value.trim();
            if (!email) {
                showLocalError(0, Utils.getTranslation('errorEmailRequired'));
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                showLocalError(0, Utils.getTranslation('errorInvalidEmail'));
                return false;
            }
        }
    }
    // Krok 1: Walidacja kwoty i regulaminu
    else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        const currency = dom.currencyDisplay.textContent;
        const minAmount = (currency === 'PLN') ? 5 : 1;

        if (isNaN(amount) || amount < minAmount) {
            const currencyDisplay = currency.toUpperCase();
            const message = (Utils.getTranslation('errorMinTipAmount') || "Minimalna kwota napiwku to {minAmount} {currency}.")
                .replace('{minAmount}', minAmount.toFixed(2))
                .replace('{currency}', currencyDisplay);

            showLocalError(1, message);
            return false;
        }

        if (!dom.termsCheckbox.checked) {
            showLocalError(1, 'Proszę zaakceptować Regulamin, aby przejść do płatności.');
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

async function initializePaymentElement(originalText) {
    // Demontaż starego elementu na wszelki wypadek
    if (paymentElement) {
        try {
            paymentElement.unmount();
        } catch(e) { /* ignore */ }
    }

    try {
        const clientSecret = await API.createStripePaymentIntent(formData.amount, formData.currency);

        const appearance = {
            theme: 'night',
            labels: 'floating',
            variables: {
                colorPrimary: '#ff0055',
                colorBackground: '#1c1c1e',
            }
        };

        elements = stripe.elements({ appearance, clientSecret });

        const paymentElementOptions = {
            layout: 'tabs',
            wallets: 'never',
            // Zapewnienie, że email jest przekazywany automatycznie jeśli go mamy
            fields: {
                 billingDetails: { email: formData.email ? 'never' : 'auto' }
            }
        };

        paymentElement = elements.create("payment", paymentElementOptions);

        paymentElement.on('ready', () => {
            console.log('Stripe Payment Element is ready.');
            // Usuń spinner i aktywuj przycisk dopiero, gdy element jest gotowy
            dom.submitBtn.disabled = false;
            dom.submitBtn.innerHTML = Utils.getTranslation('tippingPay') || 'Płacę!';
        });

        paymentElement.on('error', (event) => {
            console.error('Stripe Payment Element error:', event.error);
            UI.showToast(`Błąd płatności: ${event.error.message}`, true);
            // W razie błędu, przywróć przycisk i cofnij do kroku 1
            dom.submitBtn.disabled = false;
            dom.submitBtn.innerHTML = originalText;
            currentStep = 1;
            updateStepDisplay();
        });

        paymentElement.mount(dom.paymentElementContainer);


    } catch (error) {
        console.error("Error initializing Payment Element:", error);
        UI.showToast(error.message || "Błąd inicjalizacji płatności. Sprawdź, czy klucze Stripe są poprawne.", true);

        // Przywróć przycisk i cofnij do Kroku 1
        dom.submitBtn.disabled = false;
        dom.submitBtn.innerHTML = originalText;
        currentStep = 1;
        updateStepDisplay();
    }
}


async function handleFormSubmit() {
    // Sprawdź, czy na pewno jesteśmy w kroku płatności
    if (currentStep !== 2) return;

    dom.submitBtn.disabled = true;
    const originalText = dom.submitBtn.textContent;
    dom.submitBtn.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation('changingButtonText') || 'Przetwarzam...'}`;

    // Ustawienie stanu przetwarzania
    currentStep = 3;
    updateStepDisplay();

    // Domyślny return_url
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
        const errorMsg = error.message || "Wystąpił nieoczekiwany błąd płatności.";
        UI.showToast(errorMsg, true);

        // Wróć do Kroku 2
        currentStep = 2;
        updateStepDisplay();
        dom.submitBtn.disabled = false;
        dom.submitBtn.textContent = originalText;

        return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        try {
            await API.handleTipSuccess(paymentIntent.id);

            UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', formData.amount.toFixed(2)) || "Płatność pomyślna. Dziękujemy!");

        } catch (apiError) {
            console.error("Error confirming tip on backend:", apiError);
            UI.showToast(apiError.message || "Płatność się udała, ale wystąpił błąd po stronie serwera.", true);
        }
    }

    hideModal();
}

function resetModalState() {
    currentStep = 0;
    formData = {};
    if(dom.form) dom.form.reset();
    if(dom.createAccountCheckbox) dom.createAccountCheckbox.checked = false;
    if(dom.emailContainer) dom.emailContainer.classList.remove('visible');
    if(dom.termsCheckbox) dom.termsCheckbox.checked = false;
    if (dom.paymentElementContainer) {
        dom.paymentElementContainer.innerHTML = '';
    }
    hideLocalErrors();
    updateStepDisplay();
}

function showModal() {
    cacheDOM();

    // FIX: Poprawna inicjalizacja obiektu Stripe
    if (!stripe && window.Stripe) {
        const stripePk = (typeof window.TingTongData !== 'undefined' && window.TingTongData.stripePk) || null;
        if (!stripePk) {
             UI.showAlert("Błąd krytyczny: Brak klucza publicznego Stripe (TingTongData.stripePk). Sprawdź functions.php.", true);
             return;
        }
        stripe = window.Stripe(stripePk);
    } else if (!window.Stripe) {
         UI.showAlert("Błąd krytyczny: Biblioteka Stripe.js nie jest załadowana. Sprawdź functions.php.", true);
         return;
    }

    resetModalState();
    translateUI();

    if(dom.createAccountCheckbox) dom.createAccountCheckbox.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    const currentUser = State.get('currentUser');
    if(dom.emailInput) dom.emailInput.value = currentUser?.email || '';
    if(dom.amountInput) dom.amountInput.value = '';

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

    if(dom.closeBtn) dom.closeBtn.addEventListener('click', hideModal);

    // PRZYCISK DALEJ (Krok 0 -> Krok 1)
    if(dom.nextBtn) dom.nextBtn.addEventListener('click', handleNextStep);

    // PRZYCISK PRZEJDŹ DO PŁATNOŚCI/PŁACĘ (Krok 1 -> Krok 2)
    if(dom.submitBtn) dom.submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentStep === 1) {
            await handleTippingSubmit(); // Inicjalizuje Payment Intent i przechodzi do Kroku 2
        } else if (currentStep === 2) {
            await handleFormSubmit(); // Potwierdza Payment Intent
        }
    });

    if(dom.prevBtn) dom.prevBtn.addEventListener('click', handlePrevStep);

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
};
