import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

// Helper do obsługi tłumaczeń, które mogą być obiektami
function getTranslatedText(key, fallback) {
    const translation = Utils.getTranslation(key);
    if (typeof translation === 'object' && translation !== null) {
        return translation[State.get('currentLang')] || fallback;
    }
    return translation || fallback;
}

let dom = {};
let currentStep = 0;
const totalSteps = 4; // 0: options, 1: amount, 2: payment, 3: processing
let formData = {};
let previousStep = 0;

// Stripe variables
let stripe;
let elements;
let paymentElement;

function _getPreferredCurrencyByLocale() {
    const EUROPEAN_CURRENCY_MAP = {
        EUR: ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'],
        GBP: ['GB'],
    };

    try {
        const locale = navigator.language.split('-')[1]?.toUpperCase();

        if (locale) {
            if (EUROPEAN_CURRENCY_MAP.EUR.includes(locale)) {
                return 'eur';
            }
            if (EUROPEAN_CURRENCY_MAP.GBP.includes(locale)) {
                return 'gbp';
            }
        }
    } catch (e) {
        console.warn("Could not determine currency from locale:", e);
    }

    // Fallback logic
    if (State.get('currentLang') === 'pl') {
        return 'pln';
    }

    return 'usd'; // Global fallback
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
        currencySelect: document.getElementById('tippingCurrency'),
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
    const isLoggedIn = State.get('isUserLoggedIn');

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

    // Hide back button for logged in users on the amount step (their first step)
    if (isLoggedIn && isAmountStep) {
        dom.prevBtn.style.display = 'none';
    } else {
        dom.prevBtn.style.display = (isAmountStep || isPaymentStep) ? 'flex' : 'none';
    }

    // Handle button visibility
    dom.nextBtn.style.display = (isEmailStep || isAmountStep) ? 'flex' : 'none';
    dom.submitBtn.style.display = isPaymentStep ? 'flex' : 'none';

    // Change button text in the payment step
    if (isPaymentStep) {
        dom.submitBtn.textContent = getTranslatedText('tippingPay', 'Pay!');
    } else {
        // The text for nextBtn ("ENTER") is set via HTML attribute and the `translateUI` function,
        // but we set it here again to be sure.
        dom.nextBtn.textContent = getTranslatedText('tippingNext', 'ENTER');
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

    if (currentStep === 0) {
        currentStep++;
        updateStepDisplay();
    } else if (currentStep === 1) {
        // Re-validate specifically for step 1 before proceeding
        if (!validateStep(1)) return;

        dom.nextBtn.disabled = true;
        const originalText = dom.nextBtn.textContent;
        dom.nextBtn.innerHTML = `<span class="loading-spinner"></span>`;

        // --- NOWA LOGIKA: MAPOWANIE JĘZYKA NA KOD KRAJU ---
        const appLang = State.get('currentLang');
        const countryCodeHint = appLang === 'pl' ? 'PL' : 'GB'; // PL -> PL, EN -> GB

        // Initialize payment in the background
        await initializePaymentElement(originalText, countryCodeHint); // PRZEKAZANO HINT
    }
}


function handlePrevStep() {
    hideLocalErrors();
    if (currentStep > 0) {
        if (currentStep === 2) { // Specifically when moving back from the payment step
            if (paymentElement) {
                try {
                    paymentElement.unmount();
                } catch (e) { /* ignore */ }
            }
            // Restore the next button's state
            dom.nextBtn.disabled = false;
            dom.nextBtn.innerHTML = getTranslatedText('tippingNext', 'ENTER');
        }
        currentStep--;
        updateStepDisplay();
    }
}

function validateStep(step) {
    // Step 0: Email validation
    if (step === 0) {
        if (dom.createAccountCheckbox.checked) {
            const email = dom.emailInput.value.trim();
            if (!email) {
                showLocalError(0, getTranslatedText('errorEmailRequired', 'Email address is required.'));
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                showLocalError(0, getTranslatedText('errorInvalidEmail', 'Please provide a valid email address.'));
                return false;
            }
        }
    }
    // Step 1: Amount and terms validation
    else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        const currency = dom.currencySelect.value.toLowerCase();
        const minAmount = (currency === 'pln') ? 5 : 1;

        if (dom.amountInput.value.trim() !== '' && (isNaN(amount) || amount < minAmount)) {
            const currencyDisplay = currency.toUpperCase();
            const message = (getTranslatedText('errorMinTipAmount', 'The minimum tip amount is {minAmount} {currency}.'))
                .replace('{minAmount}', minAmount)
                .replace('{currency}', currencyDisplay);

            showLocalError(1, message);
            return false;
        }

        if (isNaN(amount) || amount < minAmount) {
            return false;
        }

        if (!dom.termsCheckbox.checked) {
            showLocalError(1, getTranslatedText('errorTermsNotAccepted', 'You must accept the terms and conditions.'));
            return false;
        }
        return true; // FIX: Ensure true is returned on successful validation
    }
    return true;
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

function collectData(step) {
    if (step === 0) {
        formData.create_account = dom.createAccountCheckbox.checked;
        formData.email = dom.emailInput.value.trim();
    } else if (step === 1) {
        formData.amount = parseFloat(dom.amountInput.value);
        formData.currency = dom.currencySelect.value.toLowerCase();
    }
}

async function initializePaymentElement(originalText, countryCodeHint) { // DODANO HINT
    // Demontaż starego elementu na wszelki wypadek
    if (paymentElement) {
        try {
            paymentElement.unmount();
        } catch(e) { /* ignore */ }
    }

    try {
        // UŻYJ NOWEJ SYGNATURY API.createStripePaymentIntent
        const clientSecret = await API.createStripePaymentIntent(formData.amount, formData.currency, countryCodeHint);

        const appearance = {
            theme: 'night',
            labels: 'floating',
            variables: {
                colorPrimary: '#ff0055',
                colorBackground: '#1c1c1e',
            }
        };

        const localeCode = State.get('currentLang') || 'auto';
        elements = stripe.elements({ appearance, clientSecret, locale: localeCode });

        const paymentElementOptions = {
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
            fields: {
                 billingDetails: {
                     name: 'auto', // Zbieraj Imię i Nazwisko TYLKO, gdy Stripe tego potrzebuje dla metody płatności
                     email: formData.email ? 'never' : 'auto',
                     // Adres pozostawiamy w domyślnym trybie 'auto' / 'never', który jest uproszczony
                 }
            }
        };

        paymentElement = elements.create("payment", paymentElementOptions);

        dom.paymentElementContainer.classList.remove('ready');
        paymentElement.mount(dom.paymentElementContainer);

        paymentElement.on('ready', () => {
            // Przełącz widok DOPIERO gdy element jest gotowy
            currentStep = 2;
            updateStepDisplay();
            // Pokaż element i przywróć przycisk
            dom.paymentElementContainer.classList.add('ready');
            dom.submitBtn.disabled = false;
            dom.submitBtn.innerHTML = getTranslatedText('tippingPay', 'Płacę!');
        });

        paymentElement.on('error', (event) => {
            console.error('Payment Element error:', event.error);
            UI.showToast(event.error.message, true);
             // Przywróć przycisk `next` i cofnij do Kroku 1
            dom.nextBtn.disabled = false;
            dom.nextBtn.innerHTML = originalText;
            currentStep = 1;
            updateStepDisplay();
        });


    } catch (error) {
        console.error("Error initializing Payment Element:", error);
        UI.showToast(error.message || "Błąd inicjalizacji płatności. Sprawdź, czy klucze Stripe są poprawne.", true);

        // Przywróć przycisk `next` i cofnij do Kroku 1
        dom.nextBtn.disabled = false;
        dom.nextBtn.innerHTML = originalText;
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
            receipt_email: formData.email || undefined,
            payment_method_data: {
                billing_details: {
                    email: formData.email ? formData.email : undefined,
                }
            }
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
            const successMessage = Utils.getTranslation('tippingSuccessMessage')
                .replace('{amount}', formData.amount.toFixed(2))
                .replace('{currency}', formData.currency.toUpperCase());
            UI.showToast(successMessage || `Thank you for your ${formData.amount.toFixed(2)} ${formData.currency.toUpperCase()} tip!`);

        } catch (apiError) {
            console.error("Error confirming tip on backend:", apiError);
            UI.showToast(apiError.message || "Payment succeeded, but there was a server-side error.", true);
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

function showModal(options = {}) {
    cacheDOM();

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

    if (dom.currencySelect) {
        dom.currencySelect.value = _getPreferredCurrencyByLocale();
    }

    const isLoggedIn = State.get('isUserLoggedIn');
    const currentUser = State.get('currentUser');

    if (isLoggedIn) {
        currentStep = 1; // Skip to amount step
        formData.email = currentUser?.email || '';
        formData.create_account = false;
    } else {
        currentStep = 0;
        // The event listener is in init(), so we just ensure the state is correct
        if(dom.createAccountCheckbox) {
             dom.createAccountCheckbox.checked = false;
             dom.emailContainer.classList.remove('visible');
        }
    }

    if(dom.emailInput) dom.emailInput.value = currentUser?.email || '';
    if (dom.amountInput) {
        dom.amountInput.value = '';
        dom.amountInput.placeholder = ' ';
    }

    UI.openModal(dom.modal, options);
    updateStepDisplay();
}

function hideModal() {
    UI.closeModal(dom.modal);
    setTimeout(resetModalState, 300);
}

function init() {
    cacheDOM();
    if (!dom.modal) return;

    if(dom.createAccountCheckbox) {
        dom.createAccountCheckbox.addEventListener('change', e => {
            dom.emailContainer.classList.toggle('visible', e.target.checked);
        });
    }

    if(dom.closeBtn) dom.closeBtn.addEventListener('click', hideModal);

    // PRZYCISK "ENTER" (Krok 0 -> 1 i Krok 1 -> 2)
    if(dom.nextBtn) dom.nextBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleNextStep();
    });

    // PRZYCISK "PŁACĘ" (Krok 2 -> 3)
    if(dom.submitBtn) dom.submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleFormSubmit(); // Potwierdza Payment Intent
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

function updateLanguage() {
    if (dom.modal && dom.modal.classList.contains('visible')) {
        translateUI();
    }
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
    updateLanguage,
    handleNextStep,
    handlePrevStep,
};
