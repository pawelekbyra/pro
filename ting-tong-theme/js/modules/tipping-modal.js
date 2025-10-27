import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';

let dom = {};
let currentStep = 0;
const totalSteps = 3; // 0: options, 1: amount, 2: processing
let formData = {};

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
        amountSuggestionBtns: document.querySelectorAll('.amount-suggestion-btn'),
    };
}

function handleAmountSuggestion(e) {
    const selectedAmount = e.target.dataset.amount;
    if (dom.amountInput) {
        dom.amountInput.value = parseFloat(selectedAmount).toFixed(2);
    }
    dom.amountSuggestionBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
}

function updateStepDisplay() {
    if (!dom.modal || !dom.steps || dom.steps.length === 0) {
        console.error("Tipping modal steps not found or cached correctly.");
        return;
    }

    dom.steps.forEach((stepEl, i) => {
        stepEl.classList.toggle('active', i === currentStep);
    });

    const isFirstStep = currentStep === 0;
    const isAmountStep = currentStep === 1;
    const isProcessingStep = currentStep === 2;

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
        if (dom.createAccountCheckbox.checked && !Utils.isValidEmail(dom.emailInput.value)) {
            UI.showAlert(Utils.getTranslation('errorInvalidEmail'), true);
            return false;
        }
    }
    if (step === 1) {
        const amount = parseFloat(dom.amountInput.value);
        if (isNaN(amount) || amount < 1) {
            UI.showAlert(Utils.getTranslation('errorMinTipAmount'), true);
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
    }
}

async function handleFormSubmit() {
    if (!validateStep(currentStep)) return;
    collectData(currentStep);

    currentStep++;
    updateStepDisplay();

    console.log('Processing payment with data:', formData);

    // Simulate payment processing
    setTimeout(() => {
        UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', formData.amount.toFixed(2)));
        hideModal();

        // Reset state after a short delay to allow for closing animation
        setTimeout(() => {
            currentStep = 0;
            formData = {};
            if(dom.form) dom.form.reset();
            if (dom.createAccountCheckbox) dom.createAccountCheckbox.checked = true;
            if (dom.emailContainer) dom.emailContainer.classList.add('visible');
            updateStepDisplay();
        }, 500);

    }, 2500);
}

function translateUI() {
    if(!dom.modal) return;

    dom.modal.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const translation = Utils.getTranslation(key);
        if(translation) el.innerHTML = translation;
    });

    dom.modal.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        const translation = Utils.getTranslation(key);
        if(translation) el.placeholder = translation;
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

    dom.amountSuggestionBtns?.forEach(btn => {
        btn.addEventListener('click', handleAmountSuggestion);
    });

    dom.amountInput?.addEventListener('input', () => {
        const currentValue = parseFloat(dom.amountInput.value);
        dom.amountSuggestionBtns.forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.amount) === currentValue);
        });
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
    const defaultAmount = 10.00;
    dom.amountInput.value = defaultAmount.toFixed(2);
    dom.amountSuggestionBtns.forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.amount) === defaultAmount);
    });


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