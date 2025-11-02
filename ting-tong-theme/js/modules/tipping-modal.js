import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import * as ApiModule from './api.js';

const API = ApiModule.API;

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

let dom = {};
let currentStep = 0;
const totalSteps = 4; // 0: options, 1: amount, 2: payment, 3: processing
let formData = {};
let previousStep = 0;

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
    };
}

function updateStepDisplay(isShowingTerms = false) {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) {
        console.error("Tipping modal steps not found or cached correctly.");
        return;
    }

    const activeStepInDOM = isShowingTerms ? 4 : currentStep;

    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', step === activeStepInDOM);
    });

    const isTermsVisible = dom.termsStep && dom.termsStep.classList.contains('active');
    const footer = dom.form.querySelector('.elegant-modal-footer');
    const isProcessingStep = currentStep === 3;

    if (footer) {
        footer.style.display = (isTermsVisible || isProcessingStep) ? 'none' : 'block';
    }

    if (dom.prevBtn) {
        dom.prevBtn.style.display = (currentStep > 0 && !isProcessingStep) ? 'flex' : 'none';
    }
    if (dom.nextBtn) {
        dom.nextBtn.style.display = (currentStep < 2 && !isProcessingStep) ? 'flex' : 'none';
        if (currentStep === 2) {
            dom.nextBtn.style.display = 'none';
        }
    }

    if (dom.progressBar) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        dom.progressBar.style.width = `${progress}%`;
    }
}

function handleNextStep() {
    if (validateStep(currentStep)) {
        collectData(currentStep);
        if (currentStep === 1) {
            currentStep++;
            updateStepDisplay();
            initializePaymentElement();
        } else if (currentStep < totalSteps - 1) {
            currentStep++;
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
                UI.showAlert(Utils.getTranslation('errorEmailRequired') || 'Adres e-mail jest wymagany.', true);
                return false;
            }
            if (!Utils.isValidEmail(email)) {
                UI.showAlert(Utils.getTranslation('errorInvalidEmail') || 'Proszę podać poprawny adres e-mail.', true);
                return false;
            }
        }
    }
    if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        if (isNaN(amount) || amount < 1) {
            UI.showAlert(Utils.getTranslation('errorMinTipAmount'), true);
            return false;
        }
        if (!document.getElementById('termsAccept').checked) {
            UI.showAlert('Proszę zaakceptować regulamin.', true);
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
        formData.currency = 'PLN';
    }
}

async function initializePaymentElement() {
    const paymentElementContainer = document.getElementById('stripe-payment-element');
    if (paymentElementContainer) {
        paymentElementContainer.innerHTML = '';
    }

    try {
        const response = await API.createStripePaymentIntent(formData);

        if (response.success && response.data.clientSecret) {
            const clientSecret = response.data.clientSecret;

            if (!stripe) {
                stripe = Stripe(TingTongConfig.stripePublicKey, { locale: 'pl' });
            }

            elements = stripe.elements({ clientSecret });

            paymentElement = elements.create('payment', {
                layout: {
                    type: 'accordion',
                    defaultCollapsed: true
                }
            });

            if (paymentElementContainer) {
                paymentElement.mount('#stripe-payment-element');
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

    loadStripeScript()
        .then(() => {
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

            dom.amountInput.value = '';
            if (dom.createAccountCheckbox) {
                dom.createAccountCheckbox.checked = false;
            }
            if (document.getElementById('termsAccept')) {
                document.getElementById('termsAccept').checked = false;
            }
            if (dom.emailContainer) {
                dom.emailContainer.classList.remove('visible');
            }

            UI.openModal(dom.modal);
            updateStepDisplay();
        })
        .catch(error => {
            console.error(error);
            UI.showAlert('Błąd ładowania komponentu płatności. Spróbuj ponownie później.', true);
        });
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function init() {
    cacheDOM();
    if (!dom.modal) return;

    if (dom.closeBtn) {
        dom.closeBtn.addEventListener('click', hideModal);
    }

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
