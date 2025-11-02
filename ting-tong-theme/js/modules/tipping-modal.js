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

const loadStripeScript = () => {
    return new Promise((resolve, reject) => {
        if (window.Stripe) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Stripe.js failed to load.'));
        document.head.appendChild(script);
    });
};

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
        amountError: document.getElementById('tippingAmountError'),
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

        let nextBtnText;
        if (isFinalStepBeforePayment) {
            const translation = Utils.getTranslation('tippingSubmit');
            nextBtnText = (typeof translation === 'object' && translation !== null) ? translation[State.get('currentLang') || 'pl'] : translation;
        } else {
            nextBtnText = 'ENTER'; // Hardcoded as per user request
        }

        dom.nextBtn.textContent = nextBtnText;
    }

    // Aktualizuj pasek postępu
    if (dom.progressBar) {
        // totalSteps = 4 (0, 1, 2, 3)
        const progress = ((currentStep + 1) / totalSteps) * 100;
        dom.progressBar.style.width = `${progress}%`;
    }
}


function showAmountError(message) {
    if (dom.amountError) {
        dom.amountError.textContent = message;
        dom.amountError.style.display = message ? 'block' : 'none';
    }
}

function validateStep(step) {
    if (step === 0) {
        const isAccountCreation = dom.createAccountCheckbox.checked;
        const email = dom.emailInput.value.trim();

        if (isAccountCreation) {
            if (email === '') {
                UI.showAlert(Utils.getTranslation('errorEmailRequired'), true);
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                UI.showAlert(Utils.getTranslation('errorInvalidEmail'), true);
                return false;
            }
        } else {
            if (email !== '' && !Utils.isValidEmail(email)) {
                UI.showAlert(Utils.getTranslation('errorInvalidEmail'), true);
                return false;
            }
        }
    } else if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        const currency = document.getElementById('tippingCurrency').value;
        const minAmount = 5;

        if (isNaN(amount) || amount < minAmount) {
            const errorMessage = Utils.getTranslation('errorMinTipAmount')
                .replace('{minAmount}', minAmount)
                .replace('{currency}', currency.toUpperCase());
            showAmountError(errorMessage);
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
    showAmountError('');
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

function handlePrevStep() {
    if (currentStep > 0) {
        currentStep--;
        updateStepDisplay();
    }
}

async function initializePaymentElement() {
    // Sprawdź, czy Stripe.js jest załadowany. Jeśli nie, nie kontynuuj.
    if (typeof window.Stripe === 'undefined') {
        console.error("Stripe.js is not loaded.");
        UI.showAlert('Błąd: Nie udało się załadować biblioteki płatności.', true);
        currentStep = 1;
        updateStepDisplay();
        return;
    }

    // Wyczyść poprzednie elementy płatności przed ponowną inicjalizacją
    const paymentElementContainer = document.getElementById('stripe-payment-element');
    if (paymentElementContainer) {
        paymentElementContainer.innerHTML = '';
    }

    try {
        const response = await API.createStripePaymentIntent(formData);

        if (response.success && response.data.clientSecret) {
            const clientSecret = response.data.clientSecret;
            const currency = formData.currency || 'pln';
            console.log(`[Stripe] Inicjalizacja Payment Element dla ${currency.toUpperCase()}`);

            // FIX 1: Upewnij się, że instancja Stripe jest tworzona raz (jeśli nie jest mockiem)
            if (!stripe) {
                stripe = Stripe(TingTongConfig.stripePublicKey, {
                    locale: 'pl'
                });
            }

            elements = stripe.elements({ clientSecret });

            paymentElement = elements.create('payment', {
                layout: {
                    type: 'tabs',
                    defaultCollapsed: false
                }
            });

            if (paymentElementContainer) {
                paymentElement.mount('#stripe-payment-element');

                // FIX 2: Dodajemy event listenery dla lepszej diagnostyki
                paymentElement.on('ready', function() {
                    console.log('Stripe Payment Element jest gotowy i załadował metody płatności.');
                    // Opcjonalnie można tutaj pokazać toasta o sukcesie
                });

                paymentElement.on('error', function(event) {
                    console.error('Błąd ładowania Stripe Payment Element:', event);
                    UI.showAlert(`Błąd ładowania płatności: ${event.error.message || 'Nieznany błąd.'}`, true);
                    currentStep = 1; // Powrót do kroku z kwotą, aby użytkownik mógł zmienić kwotę/walutę
                    updateStepDisplay();
                });
            }


        } else {
            const errorMessage = response.data?.message || 'Błąd: Nie udało się przygotować płatności (serwer).';
            UI.showAlert(errorMessage, true);
            currentStep = 1;
            updateStepDisplay();
        }

    } catch (error) {
        console.error('Krytyczny błąd inicjalizacji Stripe:', error);
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
        const currencySelect = document.getElementById('tippingCurrency');
        formData.currency = currencySelect ? currencySelect.value : 'pln';
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

async function showModal() {
    cacheDOM();

    if (!dom.modal) {
        console.error("Tipping modal not found in DOM");
        return;
    }

    try {
        await loadStripeScript();
    } catch (error) {
        console.error(error);
        UI.showAlert('Błąd ładowania komponentu płatności. Spróbuj ponownie później.', true);
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