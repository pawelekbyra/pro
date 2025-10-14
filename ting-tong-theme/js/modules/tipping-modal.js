import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';

let dom = {};
let currentStep = 0;
const totalSteps = 3; // 0: options, 1: amount, 2: processing
let formData = {};
let listenersAttached = false; // Flag to ensure listeners are attached only once

function cacheDOM() {
    dom = {
        modal: document.getElementById('tippingModal'),
        form: document.getElementById('tippingForm'),
        title: document.getElementById('tippingTitle'),
        progressBar: document.getElementById('tippingProgressBar'),
        steps: document.querySelectorAll('#tippingModal .fl-step'),
        prevBtn: document.getElementById('tippingPrevBtn'),
        nextBtn: document.getElementById('tippingNextBtn'),
        submitBtn: document.getElementById('tippingSubmitBtn'),
        createAccountCheckbox: document.getElementById('tippingCreateAccount'),
        emailContainer: document.getElementById('tippingEmailContainer'),
        emailInput: document.getElementById('tippingEmail'),
        amountInput: document.getElementById('tippingAmount'),
    };
}

function updateStepDisplay() {
    if (!dom.modal) return;

    dom.steps.forEach((stepEl, i) => {
        stepEl.classList.toggle('active', i === currentStep);
    });

    // Explicitly control button visibility for each step
    const isFirstStep = currentStep === 0;
    const isAmountStep = currentStep === 1;
    const isProcessingStep = currentStep === 2;

    dom.prevBtn.style.display = isAmountStep ? 'inline-flex' : 'none';
    dom.nextBtn.style.display = isFirstStep ? 'inline-flex' : 'none';
    dom.submitBtn.style.display = isAmountStep ? 'inline-flex' : 'none';

    if (isProcessingStep) {
        dom.prevBtn.style.display = 'none';
        dom.nextBtn.style.display = 'none';
        dom.submitBtn.style.display = 'none';
    }

    if (dom.progressBar) {
        dom.progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
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
    if (step === 0) { // Step 1: Email
        if (dom.createAccountCheckbox.checked && !Utils.isValidEmail(dom.emailInput.value)) {
            UI.showAlert(Utils.getTranslation('errorInvalidEmail'), true);
            return false;
        }
    }
    if (step === 1) { // Step 2: Amount
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

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateStep(currentStep)) return;
    collectData(currentStep);

    // Go to processing step
    currentStep++;
    updateStepDisplay();

    // Mock payment processing
    console.log('Processing payment with data:', formData);

    setTimeout(() => {
        UI.showToast(Utils.getTranslation('tippingSuccessMessage').replace('{amount}', formData.amount.toFixed(2)));
        hideModal();

        // Reset form after a short delay
        setTimeout(() => {
            currentStep = 0;
            formData = {};
            if(dom.form) dom.form.reset();
            dom.createAccountCheckbox.checked = true;
            dom.emailContainer.classList.add('visible');
            updateStepDisplay();
        }, 300);

    }, 2500); // Simulate network request
}


function setupEventListeners() {
    if (!dom.modal || listenersAttached) return;

    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form?.addEventListener('submit', handleFormSubmit);

    dom.createAccountCheckbox?.addEventListener('change', e => {
        dom.emailContainer.classList.toggle('visible', e.target.checked);
    });

    listenersAttached = true;
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
    // Cache DOM and setup listeners right before showing, ensuring elements exist.
    cacheDOM();
    setupEventListeners();

    if (!dom.modal) {
        console.error("Tipping modal not found in DOM");
        return;
    }
    translateUI();

    // Reset to first step
    currentStep = 0;

    // Pre-fill email if user is logged in
    const currentUser = State.get('currentUser');
    if (currentUser && currentUser.email) {
        dom.emailInput.value = currentUser.email;
    } else {
        dom.emailInput.value = '';
    }
    dom.amountInput.value = '';

    UI.openModal(dom.modal);
    updateStepDisplay();
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function init() {
    // Defer DOM caching and listener setup until it's actually needed.
    // This avoids issues if the script runs before the DOM is fully parsed.
}

export const TippingModal = {
    init,
    showModal,
};