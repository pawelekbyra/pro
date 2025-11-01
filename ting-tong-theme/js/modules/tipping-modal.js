import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { API } from './api.js';

let dom = {};
let currentStep = 0;
const totalSteps = 4;
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
        paymentMethodsContainer: document.querySelector('.payment-methods-container'),
    };
}

function updateStepDisplay(isShowingTerms = false) {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) {
        console.error("Tipping modal steps not found or cached correctly.");
        return;
    }

    dom.steps.forEach(stepEl => {
        const step = parseInt(stepEl.dataset.step, 10);
        stepEl.classList.toggle('active', isShowingTerms ? step === 4 : step === currentStep);
    });

    const isTermsVisible = dom.termsStep && dom.termsStep.classList.contains('active');
    const footer = dom.form.querySelector('.elegant-modal-footer');
    if (footer) {
        footer.style.display = isTermsVisible ? 'none' : 'block';
    }

    const isProcessingStep = currentStep === 3;

    if (dom.prevBtn) {
        dom.prevBtn.style.display = (currentStep > 0 && !isProcessingStep) ? 'flex' : 'none';
    }
    if (dom.nextBtn) {
        dom.nextBtn.style.display = (currentStep < 2) ? 'flex' : 'none';
    }

    if (footer && isProcessingStep) {
        footer.style.display = 'none';
    }

    if (dom.progressBar) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        dom.progressBar.style.width = `${progress}%`;
    }
}

function handleNextStep() {
    if (validateStep(currentStep)) {
        collectData(currentStep);
        if (currentStep < totalSteps - 1) {
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
    }
}

async function handlePaymentMethodClick(method) {
    formData.payment_method = method;
    console.log('Final form data submitted:', formData);

    currentStep = 3;
    updateStepDisplay();

    try {
        const response = await API.createStripeCheckout(formData);
        if (response.success && response.data.checkout_url) {
            window.location.href = response.data.checkout_url;
        } else {
            const errorMessage = response.data?.message || 'Nie udało się utworzyć sesji płatności.';
            UI.showAlert(errorMessage, true);
            currentStep = 2; // Wróć do kroku wyboru płatności
            updateStepDisplay();
        }
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        UI.showAlert('Wystąpił błąd. Spróbuj ponownie.', true);
        currentStep = 2;
        updateStepDisplay();
    }
}

function setupPaymentMethodListeners() {
    if (dom.paymentMethodsContainer) {
        dom.paymentMethodsContainer.addEventListener('click', (e) => {
            const tile = e.target.closest('.payment-method-tile');
            if (tile) {
                const method = tile.dataset.method;
                handlePaymentMethodClick(method);
            }
        });
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

    setupPaymentMethodListeners();
}

export const TippingModal = {
    init,
    showModal,
    hideModal,
    handleNextStep,
    handlePrevStep,
};