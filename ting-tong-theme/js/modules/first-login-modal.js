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
    };
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
    if (step === 1) { // Krok Imię/Nazwisko
        if (!dom.firstNameInput.value.trim() || !dom.lastNameInput.value.trim()) {
            UI.showAlert(Utils.getTranslation('errorMissingNames'), true); // POPRAWIONO KLUCZ
            return false;
        }
    }
    if (step === 2) { // Krok Hasło
        if (dom.passwordInput.value.length < 8) {
            UI.showAlert(Utils.getTranslation('errorMinPasswordLength'), true);
            return false;
        }
        if (dom.passwordInput.value !== dom.confirmPasswordInput.value) {
            UI.showAlert(Utils.getTranslation('errorPasswordsMismatch'), true); // POPRAWIONO KLUCZ
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

    // ZAWSZE zbierz dane z ostatniego kroku (Krok 2: Hasło) PRZED walidacją i wysłaniem.
    // W tej funkcji walidujemy i zbieramy DANE Z CAŁEGO PROFILU (zebrane w krokach 0 i 1 oraz teraz krok 2).
    if (!validateStep(currentStep)) return;
    collectData(currentStep);

    const submitBtn = dom.submitBtn;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loading-spinner"></span>`;

    // WALIDACJA PO ZBIERANIU DANYCH:
    if (currentStep === 2) {
        // Dodatkowa, niezbędna walidacja hasła, której brakuje, gdy pomijany jest krok 1.
        if (formData.new_password.length < 8) {
            UI.showAlert(Utils.getTranslation('errorMinPasswordLength'), true);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }
    }

    // Dalsza logika formularza jest poprawna:
    try {
        // ZMIANA: Wysyłamy jako standardowy formularz, a nie JSON
        const result = await authManager.ajax('tt_complete_profile', formData);
        if (result.success) {
            const updatedUser = { ...State.get('currentUser'), ...result.data.userData, is_profile_complete: true };
            State.set('currentUser', updatedUser);
            // NOWE: Emitujemy zdarzenie user:login, aby odświeżyć UI i potencjalnie zamknąć login panel
            State.emit('user:login', { userData: updatedUser });
            UI.showToast(Utils.getTranslation('profileUpdateSuccess'));
            hideModal();
            // Reset form state for next time
            currentStep = 0;
            formData = {};
            updateStepDisplay();
            dom.form.reset();

        } else {
            // FIX: Złap błąd z komunikatu serwera i wyświetl
            throw new Error(result.data?.message || Utils.getTranslation('profileUpdateFailedError'));
        }
    } catch (error) {
        UI.showAlert(error.message || Utils.getTranslation('genericError'), true);
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

    // FIX 2: Ustawienie domyślnego stanu: zgoda zaznaczona, język polski
    dom.consentCheckbox.checked = true;
    dom.langOptionsContainer.classList.add('visible'); // Pokaż opcje językowe
    dom.langOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.lang === 'pl') opt.classList.add('active'); // Domyślnie PL
    });

    const userEmail = State.get('currentUser')?.email || '';
    if (dom.emailDisplay) dom.emailDisplay.textContent = userEmail;

    UI.openModal(dom.modal, {
        isPersistent: true, // Nowa flaga w UI.js (patrz niżej)
        // Zapewnienie, że funkcja zamykająca nie jest wywoływana
        onClose: null
    });
    updateStepDisplay();
}

function hideModal() {
    if (!dom.modal) return;
    UI.closeModal(dom.modal);
}

function setupKeyboardShift() {
    // Cel: element, który ma być przesuwany (cała zawartość modala)
    const content = dom.modal?.querySelector('.fl-modal-content-wrapper');

    if (!content) return;

    // Lista pól do obserwowania (inputy hasła)
    const inputsToObserve = [dom.passwordInput, dom.confirmPasswordInput];

    // Ustalanie optymalnego przesunięcia (tylko jeśli visualViewport jest dostępny)
    const calculateShift = (inputEl) => {
        if (typeof window.visualViewport === 'undefined') return 0;

        const inputRect = inputEl.getBoundingClientRect();
        const viewportBottom = window.visualViewport.height; // Dolna krawędź widocznego obszaru (nad klawiaturą)
        const safeMargin = 20; // Margines bezpieczeństwa w pikselach

        // Wymagana pozycja, czyli tuż nad klawiaturą z marginesem
        const expectedBottom = viewportBottom - safeMargin;

        if (inputRect.bottom > expectedBottom) {
            // Pole jest niżej niż powinno - obliczamy shift w górę
            const shiftNeeded = inputRect.bottom - expectedBottom;
            return -shiftNeeded; // Wartość ujemna dla przesunięcia w górę
        }

        return 0;
    };

    const handleFocus = (e) => {
        // Używamy requestAnimationFrame/setTimeout, aby dać klawiaturze czas na pojawienie się
        // i zaktualizowanie window.visualViewport.height.
        setTimeout(() => {
            if (e.target.closest('.fl-step.active') === null) {
                // Upewnij się, że fokus jest w aktualnie widocznym kroku
                return;
            }

            let shift = calculateShift(e.target);

            // Ogranicznik górny: nie przesuwaj powyżej 20px od góry
            const topLimit = 20;
            const currentTop = content.getBoundingClientRect().top;

            // Jeśli aktualna pozycja przesunie się za wysoko, dostosuj shift
            if (currentTop + shift < topLimit) {
                shift = topLimit - currentTop;
            }

            if (shift !== 0) {
                // Stosujemy transformację Y do elementu, który nie jest już animowany
                content.style.transition = 'transform 0.3s ease-out';
                content.style.transform = `translateY(${shift}px)`;
            }
        }, 150); // Krótkie opóźnienie dla stabilizacji klawiatury
    };

    const handleBlur = () => {
        // Wróć do pozycji domyślnej po blur.
        // Modal i tak ma transform: translateY(0) w stanie .visible, ale to resetuje dynamiczne przesunięcie.
        content.style.transform = 'translateY(0)';
        content.style.transition = ''; // Usuń customową transakcję
    };

    // Dodaj nasłuchiwanie do pól
    inputsToObserve.forEach(input => {
        if (input) {
            input.addEventListener('focus', handleFocus);
            input.addEventListener('blur', handleBlur);
        }
    });

    // Dodatkowy listener do resetowania pozycji na iOS po ukryciu klawiatury
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
        // Jeśli nie mamy danych (np. błąd API, co oznacza, że i tak nie jesteśmy zalogowani), nie robimy nic.
        return;
    }

    if (userData && !userData.is_profile_complete) {
        // Zablokuj skrolowanie w tle
        document.body.classList.add('modal-enforced');

        // Ukryj preloader, aby pokazać UI pod modalem
        document.getElementById("preloader")?.classList.add("preloader-hiding");
        document.getElementById("webyx-container")?.classList.add("ready");

        showProfileCompletionModal();

        // KLUCZOWE: Zablokuj interakcje z głównym kontenerem aplikacji
        const appFrame = document.getElementById("app-frame");
        if (appFrame) {
            appFrame.style.pointerEvents = 'none';
        }
    } else {
        // W przeciwnym razie upewnij się, że blokada jest usunięta
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