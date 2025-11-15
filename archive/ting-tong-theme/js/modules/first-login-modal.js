import { Utils } from './utils.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { authManager } from './auth-manager.js';

let dom = {};
let currentStep = 0;
const totalSteps = 3;
let formData = {};

function cacheDOM() {
    dom = {
        modal: document.getElementById('firstLoginModal'),
        form: document.getElementById('firstLoginForm'),
        title: document.getElementById('flTitle'),
        progressBar: document.getElementById('flProgressBar'),
        steps: document.querySelectorAll('.fl-step'),
        prevBtn: document.getElementById('flPrevBtn'),
        nextBtn: document.getElementById('flNextBtn'),
        submitBtn: document.getElementById('flSubmitBtn'),
        consentCheckbox: document.getElementById('flEmailConsent'),
        langOptionsContainer: document.getElementById('flLanguageOptions'),
        langOptions: document.querySelectorAll('.fl-language-option'),
        firstNameInput: document.getElementById('flFirstName'),
        lastNameInput: document.getElementById('flLastName'),
        passwordInput: document.getElementById('flPassword'),
        confirmPasswordInput: document.getElementById('flConfirmPassword'),
        emailDisplay: document.querySelector('.fl-email-display'),
        nameError: document.getElementById('flNameError'),
        passwordError: document.getElementById('flPasswordError'),
    };
}

function showLocalError(step, messageKey, isRawMessage = false) {
    hideLocalErrors();
    const message = isRawMessage ? messageKey : Utils.getTranslation(messageKey);
    let errorEl;
    if (step === 1) {
        errorEl = dom.nameError;
    } else if (step === 2) {
        errorEl = dom.passwordError;
    }

    if (errorEl && message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideLocalErrors() {
    if (dom.nameError) dom.nameError.style.display = 'none';
    if (dom.passwordError) dom.passwordError.style.display = 'none';
}


function updateStepDisplay() {
    if (!dom.modal) return;

    dom.steps.forEach((stepEl, i) => {
        if (i === currentStep) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });

    dom.prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
    dom.nextBtn.style.display = currentStep === totalSteps - 1 ? 'none' : 'inline-flex';
    dom.submitBtn.style.display = currentStep === totalSteps - 1 ? 'inline-flex' : 'none';

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
    hideLocalErrors();
    if (step === 1) { // Krok Imię/Nazwisko
        if (!dom.firstNameInput.value.trim() || !dom.lastNameInput.value.trim()) {
            showLocalError(1, 'errorMissingNames');
            return false;
        }
    }
    if (step === 2) { // Krok Hasło
        if (!dom.passwordInput.value) {
            showLocalError(2, 'errorPasswordRequired');
            return false;
        }
        if (dom.passwordInput.value.length < 8) {
            showLocalError(2, 'errorMinPasswordLength');
            return false;
        }
        if (dom.passwordInput.value !== dom.confirmPasswordInput.value) {
            showLocalError(2, 'errorPasswordsMismatch');
            return false;
        }
    }
    return true;
}

function collectData(step) {
    if (step === 0) {
        formData.email_consent = dom.consentCheckbox.checked;
        const activeLang = dom.langOptionsContainer.querySelector('.fl-language-option.active');
        formData.email_language = activeLang ? activeLang.dataset.lang : 'pl';
    } else if (step === 1) {
        formData.first_name = dom.firstNameInput.value.trim();
        formData.last_name = dom.lastNameInput.value.trim();
    } else if (step === 2) {
        formData.new_password = dom.passwordInput.value;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateStep(currentStep)) return;
    collectData(currentStep);

    const submitBtn = dom.submitBtn;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

    try {
        const result = await authManager.ajax('tt_complete_profile', formData);
        if (result.success) {
            const updatedUser = { ...State.get('currentUser'), ...result.data.userData, is_profile_complete: true };
            State.set('currentUser', updatedUser);
            State.emit('user:login', { userData: updatedUser });
            UI.showToast(Utils.getTranslation('profileUpdateSuccess'));
            hideModal();
            currentStep = 0;
            formData = {};
            updateStepDisplay();
            dom.form.reset();

        } else {
            throw new Error(result.data?.message || Utils.getTranslation('profileUpdateFailedError'));
        }
    } catch (error) {
        showLocalError(currentStep, error.message || Utils.getTranslation('genericError'), true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}


function setupEventListeners() {
    if (!dom.modal || !dom.form) return;
    dom.nextBtn?.addEventListener('click', handleNextStep);
    dom.prevBtn?.addEventListener('click', handlePrevStep);
    dom.form.addEventListener('submit', handleFormSubmit);

    dom.consentCheckbox?.addEventListener('change', e => {
        dom.langOptionsContainer.classList.toggle('visible', e.target.checked);
    });

    dom.langOptions?.forEach(opt => {
        opt.addEventListener('click', () => {
            dom.langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
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

function showProfileCompletionModal() {
    if (!dom.modal) return;
    translateUI();

    dom.consentCheckbox.checked = true;
    dom.langOptionsContainer.classList.add('visible');
    dom.langOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.lang === 'pl') opt.classList.add('active');
    });

    const userEmail = State.get('currentUser')?.email || '';
    if (dom.emailDisplay) dom.emailDisplay.textContent = userEmail;

    UI.openModal(dom.modal, {
        isPersistent: true,
        onClose: null
    });
    updateStepDisplay();
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function setupKeyboardShift() {
    const content = dom.modal?.querySelector('.fl-modal-content-wrapper');
    if (!content) return;

    const inputsToObserve = [dom.passwordInput, dom.confirmPasswordInput];

    const calculateShift = (inputEl) => {
        if (typeof window.visualViewport === 'undefined') return 0;
        const inputRect = inputEl.getBoundingClientRect();
        const viewportBottom = window.visualViewport.height;
        const safeMargin = 20;
        const expectedBottom = viewportBottom - safeMargin;
        if (inputRect.bottom > expectedBottom) {
            const shiftNeeded = inputRect.bottom - expectedBottom;
            return -shiftNeeded;
        }
        return 0;
    };

    const handleFocus = (e) => {
        setTimeout(() => {
            if (e.target.closest('.fl-step.active') === null) return;
            let shift = calculateShift(e.target);
            const topLimit = 20;
            const currentTop = content.getBoundingClientRect().top;
            if (currentTop + shift < topLimit) {
                shift = topLimit - currentTop;
            }
            if (shift !== 0) {
                content.style.transition = 'transform 0.3s ease-out';
                content.style.transform = `translateY(${shift}px)`;
            }
        }, 150);
    };

    const handleBlur = () => {
        content.style.transform = 'translateY(0)';
        content.style.transition = '';
    };

    inputsToObserve.forEach(input => {
        if (input) {
            input.addEventListener('focus', handleFocus);
            input.addEventListener('blur', handleBlur);
        }
    });

    window.visualViewport?.addEventListener('resize', () => {
        if (dom.modal.classList.contains('visible') && window.visualViewport.height === window.innerHeight) {
            handleBlur();
        }
    });
}

function init() {
    cacheDOM();
    if (dom.modal) {
        setupEventListeners();
        setupKeyboardShift();
    }
}

function enforceModalIfIncomplete(userData) {
    if (!userData || userData.is_profile_complete === undefined) {
        return;
    }

    if (userData && !userData.is_profile_complete) {
        document.body.classList.add('modal-enforced');
        document.getElementById("preloader")?.classList.add("preloader-hiding");
        document.getElementById("webyx-container")?.classList.add("ready");
        showProfileCompletionModal();
        const appFrame = document.getElementById("app-frame");
        if (appFrame) {
            appFrame.style.pointerEvents = 'none';
        }
    } else {
        document.body.classList.remove('modal-enforced');
        document.getElementById("app-frame")?.style.removeProperty('pointer-events');
    }
}

export const FirstLoginModal = {
    init,
    showProfileCompletionModal,
    checkProfileAndShowModal: (userData) => {
        cacheDOM();
        if (userData && !userData.is_profile_complete) {
            enforceModalIfIncomplete(userData);
        }
    },
    enforceModalIfIncomplete
};
