import { Utils } from './utils.js';
import { UI } from './ui.js';
import { authManager } from './auth-manager.js';
import { State } from './state.js';
import { API } from './api.js';

// Global variables for the panel
let cropImage = null;
let cropCanvas = null;
let cropCtx = null;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let minScale = 1;
let maxScale = 3;
// NOWE: Zmienne do obsługi pinch-to-zoom
let initialPinchDistance = null;
let lastScale = 1;

// Global state for settings
let userSettings = {
  emailConsent: true,
  emailLanguage: "pl",
};

// Main initialization function
function init() {
  initializeModal();
  initializeCropper();
  setupEventListeners();
  loadUserSettings();

  // NOWE: Nasłuchuj zmian w State
  State.on('user:login', (data) => {
    if (data.userData) {
      populateProfileForm(data.userData);
    }
  });

  State.on('user:logout', () => {
    const form = document.getElementById('profileForm');
    if (form) form.reset();

    const displayName = document.getElementById("displayName");
    const userEmail = document.getElementById("userEmail");

    if (displayName) displayName.textContent = '';
    if (userEmail) userEmail.textContent = '';
  });
}

// Load user settings - MOCK
async function loadUserSettings() {
  try {
    // MOCK - simulating settings load
    await new Promise((resolve) => setTimeout(resolve, 500));
    userSettings = { emailConsent: true, emailLanguage: "pl" };
    updateSettingsUI();
  } catch (error) {
    console.log("Could not load settings:", error);
  }
}

function updateSettingsUI() {
  const consentToggle = document.getElementById("emailConsent");
  if (userSettings.emailConsent) {
    consentToggle.classList.add("active");
  } else {
    consentToggle.classList.remove("active");
  }
  document.querySelectorAll(".language-option").forEach((option) => {
    option.classList.remove("active");
    if (option.dataset.lang === userSettings.emailLanguage) {
      option.classList.add("active");
    }
  });
}

// Settings handlers
function toggleEmailConsent() {
  userSettings.emailConsent = !userSettings.emailConsent;
  updateSettingsUI();
}

function selectLanguage(lang) {
  // Mapowanie języka aplikacji na locale WordPressa
  const newLocale = lang === 'pl' ? 'pl_PL' : 'en_GB';

  // 1. Aktualizacja ustawień maili (stary kod)
  userSettings.emailLanguage = lang;
  updateSettingsUI();

  // 2. Wysłanie nowej lokalizacji do API WordPressa (wywołanie asynchroniczne)
  if (State.get("isUserLoggedIn")) {
      // Zmień na to:
      API.updateLocale(newLocale)
        .then(result => {
          if (result.success) {
            console.log(`WordPress locale updated to: ${newLocale}`);
          } else {
            console.error("Failed to update WordPress locale:", result.data?.message);
            showError("settingsError", result.data?.message || Utils.getTranslation("localeUpdateError"));
          }
        })
        .catch(error => {
           console.error("API Error updating WordPress locale:", error);
           showError("settingsError", error.message || Utils.getTranslation("localeUpdateError"));
        });
  }
}

async function saveSettings() {
  const button = document.getElementById("saveSettingsBtn");
  const originalText = button.textContent;
  try {
    button.disabled = true;
    button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation("savingButtonText")}`;

    const result = await API.saveSettings(userSettings);

    if (result.success) {
      showSuccess(
        "settingsSuccess",
        Utils.getTranslation("settingsUpdateSuccess"),
      );
    } else {
      throw new Error(result.data?.message || "Failed to save settings.");
    }

  } catch (error) {
    showError("settingsError", error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

// Profile data functions
async function loadInitialProfileData() {
  try {
    const cachedUser = State.get('currentUser');

    if (cachedUser && cachedUser.user_id) {
      console.log('Using cached user data');
      populateProfileForm(cachedUser);
      return;
    }

    console.log('Fetching user data from server');
    const result = await loadUserProfile();

    if (result.success && result.data) {
      populateProfileForm(result.data);
      State.set('currentUser', result.data);
    } else {
      throw new Error(result.data?.message || Utils.getTranslation("profileUpdateError"));
    }
  } catch (error) {
    console.error('Could not load profile data:', error);
    showError("profileError", error.message || Utils.getTranslation("profileUpdateError"));
  }
}

function populateProfileForm(data) {
  if (!data || typeof data !== 'object') {
    console.error('Invalid data passed to populateProfileForm:', data);
    return;
  }

  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("email");
  const displayName = document.getElementById("displayName");
  const userEmail = document.getElementById("userEmail");
  const userAvatar = document.getElementById("userAvatar");

  if (firstName) firstName.value = data.first_name || '';
  if (lastName) lastName.value = data.last_name || '';
  if (email) email.value = data.email || '';
  if (displayName) displayName.textContent = data.display_name || data.email || 'User';
  if (userEmail) userEmail.textContent = data.email || '';

  if (userAvatar && data.avatar) {
    userAvatar.src = data.avatar;
    // Usunięcie sekcji .onerror gwarantuje, że nie będzie używany losowy awatar z i.pravatar.cc.
    // Wszelkie błędy ładowania będą wyświetlać pusty obraz, aż do załadowania tego z functions.php.
  }
}

// Modal visibility functions
function openAccountModal() {
    const modal = document.getElementById("accountModal");
    if (!modal) {
        console.error('Account modal element not found');
        return;
    }

    const loggedInMenu = document.querySelector(".logged-in-menu");
    if (loggedInMenu) {
        loggedInMenu.classList.remove("active");
    }

    UI.openModal(modal);

    const currentUser = State.get('currentUser');
    if (currentUser && currentUser.user_id) {
        populateProfileForm(currentUser);
    } else {
        loadInitialProfileData();
    }
}

function closeAccountModal() {
    const modal = document.getElementById("accountModal");
    if (modal) {
        UI.closeModal(modal, {
            animationClass: 'slideOutLeft',
            contentSelector: '.account-modal-content'
        });
    }
}

// Tab switching
function initializeModal() {
  const tabButtons = document.querySelectorAll(".account-tabs .tab-btn");
  const tabPanes = document.querySelectorAll(".account-content .tab-pane");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      tabPanes.forEach((pane) => pane.classList.remove("active"));
      document.getElementById(targetTab + "-tab").classList.add("active");
      let headerKey;
      switch (targetTab) {
        case "password":
          headerKey = "accountModalTitlePassword";
          break;
        case "delete":
          headerKey = "accountModalTitleDelete";
          break;
        default:
          headerKey = "accountModalTitleProfile";
      }
      document.querySelector(".account-header h2").textContent =
        Utils.getTranslation(headerKey);
    });
  });
}

// Event Listeners setup
function setupEventListeners() {
  document
    .getElementById("avatarFileInput")
    .addEventListener("change", handleFileSelect);
  document
    .getElementById("profileForm")
    .addEventListener("submit", handleProfileSubmit);
  document
    .getElementById("passwordForm")
    .addEventListener("submit", handlePasswordSubmit);
  document
    .getElementById("deleteForm")
    .addEventListener("submit", handleDeleteSubmit);

  document
    .getElementById("avatarEditBtn")
    .addEventListener("click", () =>
      document.getElementById("avatarFileInput").click(),
    );
  document
    .getElementById("emailConsent")
    .addEventListener("click", toggleEmailConsent);
  document
    .querySelectorAll(".language-option")
    .forEach((el) =>
      el.addEventListener("click", () => selectLanguage(el.dataset.lang)),
    );
  document
    .getElementById("saveSettingsBtn")
    .addEventListener("click", saveSettings);

  const deleteInput = document.getElementById("deleteConfirmation");
  const deleteBtn = document.getElementById("deleteAccountBtn");
  if (deleteInput && deleteBtn) {
    deleteInput.addEventListener("input", function () {
      deleteBtn.disabled =
        this.value.trim().toUpperCase() !==
        Utils.getTranslation("deleteConfirmationString").toUpperCase();
    });
  }

  const zoomSlider = document.getElementById("zoomSlider");
  if (zoomSlider) {
    zoomSlider.addEventListener("input", function () {
      scale = parseFloat(this.value);
      drawCropCanvas();
    });
  }

  const cropCloseBtn = document.getElementById("cropCloseBtn");
  if (cropCloseBtn) {
    cropCloseBtn.addEventListener("click", closeCropModal);
  }

  const zoomInBtn = document.getElementById("zoomInBtn");
  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => adjustZoom(0.1));
  }

  const zoomOutBtn = document.getElementById("zoomOutBtn");
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => adjustZoom(-0.1));
  }

  const cropSaveBtn = document.getElementById("cropSaveBtn");
  if (cropSaveBtn) {
    cropSaveBtn.addEventListener("click", cropAndSave);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (
        document.getElementById("cropModal").classList.contains("visible")
      ) {
        closeCropModal();
      } else if (
        document
          .getElementById("accountModal")
          .classList.contains("visible")
      ) {
        closeAccountModal();
      }
    }
  });

  const accountModal = document.getElementById("accountModal");
  if (accountModal) {
    accountModal.addEventListener("click", (event) => {
      if (event.target === accountModal) {
        closeAccountModal();
      }
    });
  }

  const accountCloseBtn = document.querySelector("#accountModal .close-btn");
  if (accountCloseBtn) {
    accountCloseBtn.addEventListener("click", closeAccountModal);
  }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        return showError("avatarError", Utils.getTranslation("fileSelectImageError"));
    }
    if (file.size > 5 * 1024 * 1024) {
        return showError("avatarError", Utils.getTranslation("fileTooLargeError"));
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        cropImage = new Image();
        cropImage.onload = function () {
            const modal = UI.DOM.cropModal;

            // Użyj `onOpen` aby mieć pewność, że modal jest gotowy
            UI.openModal(modal, {
                onOpen: () => {
                    // Czekaj na `transitionend` aby zagwarantować, że modal jest w pełni widoczny
                    // i ma poprawne wymiary przed inicjalizacją canvasa.
                    modal.addEventListener('transitionend', function onModalReady() {
                        initializeCropCanvas();
                        modal.removeEventListener('transitionend', onModalReady);
                    }, { once: true });
                }
            });
        };
        cropImage.onerror = () => showError("avatarError", "Nie udało się załadować obrazu.");
        cropImage.src = e.target.result;
    };
    reader.onerror = () => showError("avatarError", "Nie udało się odczytać pliku.");
    reader.readAsDataURL(file);
}
function closeCropModal() {
  const modal = document.getElementById("cropModal");
  if(modal) {
    UI.closeModal(modal);
  }
  cropImage = null;
}

function initializeCropper() {
  cropCanvas = document.getElementById("cropCanvas");
  if (!cropCanvas) return;
  cropCtx = cropCanvas.getContext("2d");
  cropCanvas.addEventListener("mousedown", startDrag);
  cropCanvas.addEventListener("mousemove", drag);
  window.addEventListener("mouseup", endDrag);
  cropCanvas.addEventListener("mouseleave", endDrag);
  cropCanvas.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  cropCanvas.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  window.addEventListener("touchend", endDrag);
}

function initializeCropCanvas() {
  if (!cropImage) return;
  const canvasRect = cropCanvas.getBoundingClientRect();
  cropCanvas.width = canvasRect.width;
  cropCanvas.height = canvasRect.height;

  const cropCircleSize =
    Math.min(cropCanvas.width, cropCanvas.height) * 0.8;
  const imageMaxDimension = Math.max(cropImage.width, cropImage.height);

  minScale = cropCircleSize / imageMaxDimension;
  scale = minScale;
  offsetX = 0;
  offsetY = 0;

  const slider = document.getElementById("zoomSlider");
  slider.min = minScale.toFixed(2);
  slider.max = (minScale * 4).toFixed(2);
  slider.value = scale.toFixed(2);
  maxScale = minScale * 4;

  drawCropCanvas();
}

function drawCropCanvas() {
  if (!cropImage || !cropCtx) return;
  const canvas = cropCanvas;
  const ctx = cropCtx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const imgWidth = cropImage.width * scale;
  const imgHeight = cropImage.height * scale;
  const x = (canvas.width - imgWidth) / 2 + offsetX;
  const y = (canvas.height - imgHeight) / 2 + offsetY;
  ctx.drawImage(cropImage, x, y, imgWidth, imgHeight);
}

function startDrag(event) {
  isDragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  cropCanvas.style.cursor = "grabbing";
}
function drag(event) {
  if (!isDragging) return;
  const deltaX = event.clientX - lastX;
  const deltaY = event.clientY - lastY;
  offsetX += deltaX;
  offsetY += deltaY;
  lastX = event.clientX;
  lastY = event.clientY;
  constrainOffsets();
  drawCropCanvas();
}
function endDrag() {
  isDragging = false;
  cropCanvas.style.cursor = "grab";
  // Resetuj stan pinch-to-zoom po zakończeniu przeciągania lub szczypania
  initialPinchDistance = null;
  lastScale = 1;
}

function getDistance(p1, p2) {
  const dx = p1.clientX - p2.clientX;
  const dy = p1.clientY - p2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function handleTouchStart(event) {
  event.preventDefault();
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    startDrag({ clientX: touch.clientX, clientY: touch.clientY });
  } else if (event.touches.length === 2) {
    isDragging = false; // Zatrzymaj przeciąganie, aby uniknąć konfliktów
    initialPinchDistance = getDistance(event.touches[0], event.touches[1]);
    lastScale = scale; // Zaczynamy skalowanie od bieżącej skali
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  if (event.touches.length === 1 && isDragging) {
    const touch = event.touches[0];
    drag({ clientX: touch.clientX, clientY: touch.clientY });
  } else if (event.touches.length === 2 && initialPinchDistance) {
    const newDistance = getDistance(event.touches[0], event.touches[1]);
    const scaleMultiplier = newDistance / initialPinchDistance;
    let newScale = lastScale * scaleMultiplier;

    // Ogranicz skalę do zdefiniowanych min/max
    newScale = Math.max(minScale, Math.min(maxScale, newScale));

    // Bezpośrednio zaktualizuj skalę i suwak
    scale = newScale;
    document.getElementById("zoomSlider").value = scale;

    // Przerysuj canvas z nową skalą
    constrainOffsets();
    drawCropCanvas();
  }
}

function adjustZoom(delta) {
  const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
  scale = newScale;
  document.getElementById("zoomSlider").value = scale;
  constrainOffsets();
  drawCropCanvas();
}
function constrainOffsets() {
  if (!cropImage) return;
  const imgWidth = cropImage.width * scale;
  const imgHeight = cropImage.height * scale;
  const maxOffsetX = Math.max(0, (imgWidth - cropCanvas.width) / 2);
  const maxOffsetY = Math.max(0, (imgHeight - cropCanvas.height) / 2);
  offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
  offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
}

async function cropAndSave() {
  if (!cropImage) return;
  const button = document.getElementById("cropSaveBtn");
  const originalHTML = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation("savingButtonText")}`;

  try {
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 200;
    outputCanvas.height = 200;
    const outputCtx = outputCanvas.getContext("2d");

    const cropSize = Math.min(cropCanvas.width, cropCanvas.height) * 0.8;
    const srcSize = cropSize / scale;
    const srcX = (cropImage.width - srcSize) / 2 - offsetX / scale;
    const srcY = (cropImage.height - srcSize) / 2 - offsetY / scale;

    outputCtx.drawImage(
      cropImage,
      srcX,
      srcY,
      srcSize,
      srcSize,
      0,
      0,
      200,
      200,
    );

    const dataUrl = outputCanvas.toDataURL("image/png", 0.9);
    const result = await uploadAvatar(dataUrl);

    if (result?.success && result.data?.url) {
      const newAvatarUrl = result.data.url + "?t=" + Date.now();
      // Zaktualizuj wszystkie instancje avatara
      document.getElementById("userAvatar").src = newAvatarUrl;
      document
        .querySelectorAll(".profile img, .tiktok-symulacja .profile img")
        .forEach((img) => {
          img.src = newAvatarUrl;
        });
      // Zaktualizuj cache w State
      const currentUser = State.get('currentUser') || {};
      currentUser.avatar = newAvatarUrl;
      State.set('currentUser', currentUser);
      showSuccess(
        "avatarSuccess",
        Utils.getTranslation("avatarUpdateSuccess"),
      );
      closeCropModal();
      document.dispatchEvent(
        new CustomEvent("tt:avatar-updated", {
          detail: { url: newAvatarUrl },
        }),
      );
    } else {
      // Ulepszona obsługa błędów - bezpieczne odczytanie wiadomości
      const errorMessage = result?.data?.message || Utils.getTranslation("avatarUpdateError");
      throw new Error(errorMessage);
    }
  } catch (error) {
    // Ulepszona obsługa błędów - upewnienie się, że `error` ma sensowną wiadomość
    const message = error instanceof Error ? error.message : String(error);
    showError(
      "avatarError",
      message || Utils.getTranslation("imageProcessingError"),
    );
  } finally {
    // Ten blok ZAWSZE się wykona, resetując UI, co jest kluczowe
    button.disabled = false;
    button.innerHTML = originalHTML;
  }
}

async function uploadAvatar(dataUrl) {
  return API.uploadAvatar({ image: dataUrl });
}
async function updateProfile(data) {
  return API.updateProfile(data);
}
async function changePassword(data) {
  return API.changePassword(data);
}
async function deleteAccount(confirmText) {
  return API.deleteAccount({ confirm_text: confirmText });
}
async function loadUserProfile() {
  return API.loadUserProfile();
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  const button = document.getElementById("saveProfileBtn");
  const originalText = button.textContent;
  button.disabled = true;
  button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation("savingButtonText")}`;
  try {
    const data = {
      first_name: document.getElementById("firstName").value.trim(),
      last_name: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
    };
    if (!data.first_name || !data.last_name || !data.email)
      throw new Error(Utils.getTranslation("allFieldsRequiredError"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      throw new Error(Utils.getTranslation("invalidEmailError"));
    const result = await updateProfile(data);
    if (result.success) {
      showSuccess(
        "profileSuccess",
        Utils.getTranslation("profileUpdateSuccess"),
      );
      // Zaktualizuj cache w State
      const currentUser = State.get('currentUser') || {};
      const updatedUser = {
        ...currentUser,
        ...result.data
      };
      State.set('currentUser', updatedUser);
      populateProfileForm(result.data);
    } else {
      throw new Error(
        result.data?.message ||
          Utils.getTranslation("profileUpdateFailedError"),
      );
    }
  } catch (error) {
    showError("profileError", error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  const button = document.getElementById("changePasswordBtn");
  const originalText = button.textContent;
  button.disabled = true;
  button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation("changingButtonText")}`;
  try {
    const currentPassword =
        document.getElementById("currentPassword").value,
      newPassword = document.getElementById("newPassword").value,
      confirmPassword = document.getElementById("confirmPassword").value;
    if (!currentPassword || !newPassword || !confirmPassword)
      throw new Error(Utils.getTranslation("allFieldsRequiredError"));
    if (newPassword.length < 8)
      throw new Error(Utils.getTranslation("passwordLengthError"));
    if (newPassword !== confirmPassword)
      throw new Error(Utils.getTranslation("passwordsMismatchError"));
    const result = await changePassword({
      current_password: currentPassword,
      new_password_1: newPassword,
      new_password_2: confirmPassword,
    });
    if (result.success) {
      showSuccess(
        "passwordSuccess",
        Utils.getTranslation("passwordUpdateSuccess"),
      );
      document.getElementById("passwordForm").reset();
    } else {
      throw new Error(
        result.data?.message ||
          Utils.getTranslation("passwordChangeFailedError"),
      );
    }
  } catch (error) {
    showError("passwordError", error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function handleDeleteSubmit(event) {
  event.preventDefault();
  const button = document.getElementById("deleteAccountBtn");
  const originalText = button.textContent;
  button.disabled = true;
  button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation("deletingButtonText")}`;
  try {
    const confirmText = document.getElementById("deleteConfirmation").value;
    const requiredConfirmText = Utils.getTranslation(
      "deleteConfirmationString",
    );
    if (
      confirmText.trim().toUpperCase() !== requiredConfirmText.toUpperCase()
    )
      throw new Error(
        Utils.getTranslation("deleteConfirmationError").replace(
          "{confirmationText}",
          requiredConfirmText,
        ),
      );
    const result = await deleteAccount(confirmText);
    if (result.success) {
      showSuccess(
        "deleteSuccess",
        Utils.getTranslation("deleteAccountSuccess"),
      );
      setTimeout(() => window.location.reload(), 2000);
    } else {
      throw new Error(
        result.data?.message ||
          Utils.getTranslation("deleteAccountFailedError"),
      );
    }
  } catch (error) {
    showError("deleteError", error.message);
    if (
      !document.getElementById("deleteSuccess").classList.contains("show")
    ) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function hideAllMessages() {
  document.querySelectorAll(".status-message").forEach((el) => {
    el.classList.remove("show");
    el.style.display = "none";
  });
}
function showSuccess(elementId, message) {
  hideAllMessages();
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.display = "block";
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.style.display = "none"), 300);
  }, 3000);
}
function showError(elementId, message) {
  hideAllMessages();
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.display = "block";
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.style.display = "none"), 300);
  }, 4000);
}

export const AccountPanel = { init, openAccountModal, closeAccountModal, populateProfileForm };