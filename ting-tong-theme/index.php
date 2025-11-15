<?php
/**
 * The main template file
 *
 * @package TingTongTheme
 */

get_header();
?>

<!-- === Tipping Modal (New Elegant Version) === -->
<div id="tippingModal" class="elegant-modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="elegant-modal-content-wrapper">
        <form id="tippingForm" class="elegant-modal-content">
            <div class="elegant-modal-header">
                <h2 id="tippingTitle" class="elegant-modal-title" data-translate-key="tippingTitle">Bramka Napiwkowa</h2>
                <button type="button" class="modal-close-btn" data-action="close-modal" aria-label="Close tipping modal">&times;</button>
                <div class="elegant-modal-progress-bar-container">
                    <div class="elegant-modal-progress-bar-fill" id="tippingProgressBar"></div>
                </div>
            </div>

            <div class="elegant-modal-body" id="tippingBody">
                <!-- Krok 1: E-mail i zgoda -->
                <div class="elegant-modal-step" data-step="0">
                    <p class="elegant-modal-step-description" data-translate-key="tippingStep1Desc">Założyć konto Patrona? 🏆</p>
                    <div class="elegant-modal-fields-container">
                        <label class="elegant-modal-preference-row">
                            <span class="elegant-modal-preference-label" data-translate-key="tippingCreateAccountLabel">No raczej!</span>
                            <input type="checkbox" id="tippingCreateAccount" class="elegant-modal-checkbox">
                        </label>
                        <div id="tippingEmailContainer" class="elegant-modal-email-container visible">
                            <input type="email" id="tippingEmail" class="elegant-modal-input" data-translate-placeholder="emailPlaceholder" placeholder="(podaj mail na ktory otrzymasz klucze logowania)">
                            <p class="elegant-modal-hint-text" data-translate-key="tippingEmailHint">Na podany e-mail otrzymasz dane dostępu do logowania do sekcji dla patronów.</p>
                        </div>
                        <div id="tippingStep0Error" class="elegant-modal-error"></div>
                    </div>
                </div>

                <!-- Krok 2: Wybór kwoty -->
                <div class="elegant-modal-step" data-step="1">
                    <p class="elegant-modal-step-description" data-translate-key="tippingStep2Desc">Wpisz kwotę napiwku</p>
                    <div class="elegant-modal-fields-container">
                        <div class="tipping-amount-container">
                            <div class="amount-input-wrapper">
                                <input type="number" id="tippingAmount" class="elegant-modal-input amount-input" placeholder=" " min="1" step="any" data-translate-placeholder="tippingAmountPlaceholder">
                                <span class="amount-placeholder-zero">0</span>
                            </div>
                            <div class="tipping-currency-wrapper">
                                <select id="tippingCurrency" class="tipping-currency-select">
                                    <option value="pln">PLN</option>
                                    <option value="eur">EUR</option>
                                    <option value="usd">USD</option>
                                    <option value="gbp">GBP</option>
                                </select>
                                <span class="currency-dropdown-arrow">▼</span>
                            </div>
                        </div>
                        <div class="elegant-modal-preference-row" style="justify-content: center; gap: 10px;">
                            <input type="checkbox" id="termsAccept" class="elegant-modal-checkbox">
                            <label for="termsAccept" class="elegant-modal-preference-label" style="font-size: 13px;" data-translate-key="tippingAcceptTerms">
                                Akceptuję Regulamin i Politykę Prywatności
                            </label>
                        </div>
                        <div id="tippingStep1Error" class="elegant-modal-error"></div>
                        <p class="elegant-modal-hint-text" data-translate-key="tippingAmountHint"></p>
                    </div>
                </div>

                <!-- Krok 3: Płatność Stripe -->
                <div class="elegant-modal-step" data-step="2">
                    <div class="elegant-modal-step-header">
                        <p class="elegant-modal-step-description" data-translate-key="tippingStep3Desc">Wybierz metodę napiwkowania</p>
                        <span id="tippingSummaryAmount" class="tipping-summary-amount"></span>
                    </div>
                    <div id="payment-element">
                        <!-- Stripe Payment Element will be inserted here -->
                    </div>
                    <div id="payment-message" class="hidden"></div>
                </div>

                <!-- Krok 4: Przetwarzanie płatności -->
                <div class="elegant-modal-step" data-step="3">
                    <p class="elegant-modal-step-description" data-translate-key="tippingStep4Desc">Dziękujemy! Trwa weryfikacja Twojej płatności.</p>
                    <div class="elegant-modal-fields-container" style="text-align: center; padding: 40px 0;">
                        <div class="loading-spinner large"></div>
                        <p class="elegant-modal-hint-text" style="margin-top: 20px;" data-translate-key="tippingProcessingHint">To może potrwać chwilę...</p>
                    </div>
                </div>

                <!-- Step 5 (was 4): Regulamin -->
                <div class="elegant-modal-step" data-step="4" id="terms-step">
                    <h3 class="elegant-modal-title" data-translate-key="tippingTermsTitle">Regulamin i Polityka Prywatności</h3>
                    <div class="terms-content" style="font-size: 12px; line-height: 1.5; max-height: 250px; overflow-y: auto; padding-right: 10px;" data-translate-key="tippingTermsContent">
                    </div>
                    <button type="button" class="elegant-modal-btn" data-action="hide-terms" style="margin-top: 20px;" data-translate-key="tippingTermsBackButton">Powrót</button>
                </div>
            </div>

            <div class="elegant-modal-footer">
                <div class="elegant-modal-footer-buttons">
                    <button type="button" id="tippingPrevBtn" class="elegant-modal-btn elegant-modal-btn-prev" data-action="tipping-prev" data-translate-key="tippingPrev">Wstecz</button>
                    <button type="button" id="tippingNextBtn" class="elegant-modal-btn elegant-modal-btn-next" data-action="tipping-next" data-translate-key="tippingNext">ENTER</button>
                    <button type="submit" id="tippingSubmitBtn" class="elegant-modal-btn elegant-modal-btn-submit" data-translate-key="tippingPay">ENTER!</button>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- === First Login Modal (NEW & IMPROVED) === -->
<div id="firstLoginModal" class="fl-modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="fl-modal-content-wrapper">
    <form id="firstLoginForm" class="fl-modal-content">

      <div class="fl-header">
        <div class="fl-drag-handle-container"><div class="fl-drag-handle"></div></div>
        <h2 id="flTitle" class="fl-title" data-translate-key="firstLoginTitle">Uzupełnij profil</h2>
        <div class="fl-progress-bar-container">
          <div class="fl-progress-bar-fill" id="flProgressBar"></div>
        </div>
      </div>

      <div class="fl-body" id="flBody">

        <div class="fl-step" data-step="0">
          <p class="fl-step-description" data-translate-key="firstLoginStep1Desc">Zgody i preferencje.</p>
          <div class="fl-fields-container">
            <label class="fl-preference-row">
              <span class="fl-preference-label" data-translate-key="firstLoginConsentLabel">Zgoda na maile</span>
              <input type="checkbox" id="flEmailConsent" class="fl-checkbox">
            </label>
            <div id="flLanguageOptions" class="fl-language-selector">
              <button type="button" class="fl-language-option active" data-lang="pl" data-translate-key="emailLangPolish">Polski</button>
              <button type="button" class="fl-language-option" data-lang="en" data-translate-key="emailLangEnglish">English</button>
            </div>
          </div>
        </div>

        <div class="fl-step" data-step="1">
          <p class="fl-step-description" data-translate-key="firstLoginStep2Desc">Podaj swoje dane.</p>
          <div class="fl-fields-container">
            <input type="text" id="flFirstName" class="fl-input" data-translate-placeholder="firstNamePlaceholder" placeholder="Imię">
            <input type="text" id="flLastName" class="fl-input" data-translate-placeholder="lastNamePlaceholder" placeholder="Nazwisko">
            <div id="flNameError" class="elegant-modal-error"></div>
            <p class="fl-hint-text" data-translate-key="firstLoginNameHint">Informacje te będą widoczne publicznie.</p>
          </div>
        </div>

        <div class="fl-step" data-step="2">
          <p class="fl-step-description" data-translate-key="firstLoginStep3Desc">Zabezpiecz swoje konto.</p>
          <div class="fl-fields-container">
            <span class="fl-email-display"></span>
            <p class="fl-hint-text" data-translate-key="firstLoginPasswordDesc">Twoje konto zostało utworzone z hasłem tymczasowym. Ustaw teraz nowe, bezpieczne hasło.</p>
            <input type="password" id="flPassword" class="fl-input" data-translate-placeholder="newPasswordPlaceholder" placeholder="Nowe hasło">
            <input type="password" id="flConfirmPassword" class="fl-input" data-translate-placeholder="confirmPasswordPlaceholder" placeholder="Potwierdź hasło">
            <div id="flPasswordError" class="elegant-modal-error"></div>
          </div>
        </div>

      </div>

      <div class="fl-footer">
        <div class="fl-footer-buttons">
          <button type="button" id="flPrevBtn" class="fl-btn fl-btn-prev" data-translate-key="firstLoginPrev">Wstecz</button>
          <button type="button" id="flNextBtn" class="fl-btn fl-btn-next" data-translate-key="firstLoginNext">Dalej</button>
          <button type="submit" id="flSubmitBtn" class="fl-btn fl-btn-submit" data-translate-key="firstLoginSubmit">Zakończ</button>
        </div>
      </div>

    </form>
  </div>
</div>

<div id="preloader">
    <div class="preloader-icon-container">
        <img
            src="<?php echo get_template_directory_uri(); ?>/jajk.png"
            alt="Logo aplikacji"
            class="splash-icon"
        >
    </div>
    <div class="preloader-content-container">
        <div class="language-selection">
            <h2>Wybierz Język / Select Language</h2>
            <div class="lang-buttons-container">
                <button data-lang="pl"><span>Polski</span></button>
                <button data-lang="en"><span>English</span></button>
            </div>
        </div>
    </div>
    <button id="mockLoginBtn" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: #007aff; color: white; padding: 10px 20px; border: none; border-radius: 8px; z-index: 100; display: none;">
        DEBUG: Pokaż First Login Modal
    </button>
</div>

<div id="app-frame">
    <div class="topbar" data-view="default">
        <button class="topbar-icon-btn hamburger-icon" data-action="toggle-main-menu" data-translate-aria-label="menuAriaLabel" aria-label="Menu"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18"></path></svg></button>
        <button class="topbar-central-trigger" data-action="toggle-login-panel"><div class="central-text-wrapper"><span class="topbar-text"></span></div></button>
        <button class="topbar-icon-btn notification-bell" data-action="toggle-notifications" data-translate-aria-label="notificationAriaLabel" aria-label="Powiadomienia"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg><div class="notification-dot"></div></button>
    </div>
    <div class="login-panel" aria-hidden="true">
            <form id="tt-login-form" class="login-form">
                <input type="text" id="tt-username" name="log" aria-label="Username" />
                <div class="password-wrapper">
                    <input type="password" id="tt-password" name="pwd" aria-label="Password" />
                    <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility" aria-label="Toggle password visibility">
                        <svg class="eye-icon-open" style="display: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        <svg class="eye-icon-closed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                    </button>
                </div>
                <button type="submit" id="tt-login-submit">ENTER</button>
            </form>
        </div>
    <div class="logged-in-menu" aria-hidden="true">
        <a href="#" data-action="open-account-modal" class="accountMenuButton" data-translate-key="accountMenuButton">Konto</a>
        <a href="#" data-action="logout" class="logout-link" data-translate-key="logoutLink">Wyloguj</a>
    </div>

    <template id="slide-template">
        <div class="webyx-section swiper-slide">
            <div class="tiktok-symulacja">
                <video crossorigin playsinline webkit-playsinline muted autoplay preload="auto" poster="" class="player"></video>
                <div class="video-controls">
                    <div class="video-controls-left">
                        <button class="volume-button" data-action="toggle-volume">
                            <svg class="volume-on-icon" style="display: none;" fill="white" viewBox="0 0 24 24" width="28" height="28"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                            <svg class="volume-off-icon" fill="white" viewBox="0 0 24 24" width="28" height="28"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>
                        </button>
                        <button class="cc-button" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 0 24 24" width="28" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2v-.5H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2v-.5H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/></svg>
                        </button>
                        <button class="fullscreen-button" data-action="toggle-fullscreen">
                            <svg class="fullscreen-enter-icon" viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>
                            <svg class="fullscreen-exit-icon" style="display: none;" viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg>
                        </button>
                        <button class="info-button" data-action="open-info-modal">
                           <svg class="info-icon-pulsing" fill="white" viewBox="0 0 24 24" width="28" height="28"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="pause-overlay" aria-hidden="true">
                    <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                <div class="replay-overlay" aria-hidden="true">
                    <svg class="replay-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                    </svg>
                </div>

                <div class="secret-overlay" aria-hidden="true">
                    <div class="mur-container">
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                        <div class="mur-row"><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div><div class="cegla"></div></div>
                    </div>
                    <svg class="secret-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    <h2 class="secret-title" data-translate-key="secretTitle">Top Secret</h2>
                    <p class="secret-subtitle">
                        <u data-translate-key="secretSubtitleAction"></u><span data-translate-key="secretSubtitleRest"></span>
                    </p>
                </div>
                <div class="pwa-secret-overlay" aria-hidden="true">
                    <svg class="secret-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    <h2 class="pwa-secret-title" data-translate-key="pwaSecretTitle">Treść Dostępna w Aplikacji</h2>
                    <p class="pwa-secret-subtitle">
                        <u data-translate-key="pwaSecretSubtitleAction" data-action="install-pwa"></u><span data-translate-key="pwaSecretSubtitleRest"></span>
                    </p>
                </div>
                <div class="error-overlay" aria-hidden="true">
                    <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <h2 class="error-title" data-translate-key="videoErrorTitle">Błąd Wideo</h2>
                    <p class="error-subtitle" data-translate-key="videoErrorSubtitle">Nie można załadować materiału.</p>
                    <button class="error-retry-button" data-action="retry-video" data-translate-key="videoErrorRetry">Spróbuj ponownie</button>
                </div>
                <div class="sidebar visible">
                    <div class="profile">
                        <button class="profileButton" data-action="open-author-profile" data-translate-aria-label="authorProfileAriaLabel" aria-label="Profil autora"><img src="" alt="Profil" loading="lazy" decoding="async" /></button>
                        <div class="plus" aria-hidden="true">+</div>
                    </div>
                    <button class="icon-button like-button" data-action="toggle-like" data-like-id="" data-translate-alert="likeAlert" data-translate-aria-label="likeAriaLabel" aria-label="Polub" aria-pressed="false">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <div class="like-count icon-label">0</div>
                    </button>
                    <button class="icon-button commentsButton" data-action="open-comments-modal" aria-controls="commentsModal" data-translate-aria-label="commentsAriaLabel" aria-label="Komentarze">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
                        </svg>
                        <div class="icon-label comment-count">0</div>
                    </button>
                    <button class="icon-button shareButton" data-action="share" data-translate-title="shareTitle" data-translate-aria-label="shareAriaLabel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l6 6-6 6M21 11H9a6 6 0 0 0-6 6" /></svg><div class="icon-label" data-translate-key="shareText">Szeruj</div></button>
                    <button class="icon-button tipButton" data-action="show-tip-jar" data-translate-title="tipTitle" data-translate-aria-label="tipAriaLabel">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="12" rx="2" ry="2" /><path d="M2 10h20" /><circle cx="18" cy="13" r="2" /></svg>
                        <div class="icon-label" data-translate-key="tipText">Napiwek</div>
                    </button>
                </div>
                <div class="bottombar">
                    <div class="progress-bar">
                        <div class="progress-bar-fill"></div>
                        <div class="progress-bar-handle"></div>
                    </div>
                    <div class="text-info">
                        <div class="slide-meta-line">
                             <strong class="author-name"></strong>
                             <span class="slide-title"></span>
                        </div>
                        <p class="slide-description"></p>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <template id="comment-template">
        <div class="comment">
            <div class="comment-author-avatar">
                <img src="" alt="Avatar">
            </div>
            <div class="comment-details">
                <p class="comment-author-name"></p>
                <p class="comment-text"></p>
                <p class="comment-timestamp"></p>
            </div>
        </div>
    </template>

    <div id="webyx-container" class="swiper">
        <div class="swiper-wrapper">
        </div>
    </div>
</div>
<div id="alertBox" role="status" aria-live="polite">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:18px; height:18px; stroke:white; stroke-width:2; fill:none; margin-right:6px;"><path d="M6 10V8a6 6 0 1 1 12 0v2" /><rect x="4" y="10" width="16" height="10" rx="2" ry="2" /></svg>
    <span id="alertText"></span>
</div>

<!-- Author Profile Modal -->
<div id="author-profile-modal" class="profile-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="author-profile-title" aria-hidden="true">
    <div class="profile-modal-content">
        <header class="profile-header">
            <h2 id="author-profile-title" class="username-header"></h2>
            <button class="modal-close-btn" data-action="close-author-profile" aria-label="Close profile">
                &times;
            </button>
        </header>
        <main>
            <section class="info-section">
                <div class="avatar-container">
                    <img src="" alt="User Avatar" class="profile-avatar">
                </div>
            </section>
            <p class="fullname"></p>
            <p class="bio"></p>
            <div class="stats-container">
                <div class="stat">
                    <span class="stat-number following-count">0</span>
                    <span class="stat-label" data-translate-key="profileFollowing">Followers</span>
                </div>
                <div class="stat">
                    <span class="stat-number followers-count">0</span>
                    <span class="stat-label" data-translate-key="profileFollowers">Followers</span>
                </div>
                <div class="stat">
                    <span class="stat-number likes-count">0</span>
                    <span class="stat-label" data-translate-key="profileLikes">Followers</span>
                </div>
            </div>
            <div class="profile-actions">
                <button class="follow-btn" data-action="show-tip-jar">
                    <span data-translate-key="crowdfundingCtaButton">Zostań Patronem</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="12" rx="2" ry="2" /><path d="M2 10h20" /><circle cx="18" cy="13" r="2" /></svg>
                </button>
                <button class="social-btn instagram" aria-label="Instagram">
                    <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </button>
                <button class="social-btn youtube" aria-label="YouTube">
                   <svg viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                </button>
            </div>
            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="videos-grid" data-action="switch-profile-tab">
                    <svg viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"></path></svg>
                </button>
                <button class="profile-tab" data-tab="reposts-grid" data-action="switch-profile-tab">
                    <svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                </button>
                <button class="profile-tab" data-tab="liked-grid" data-action="switch-profile-tab">
                     <svg viewBox="0 0 24 24"><path d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"></path></svg>
                </button>
            </div>
            <div class="profile-tab-content">
                <div id="videos-grid" class="video-gallery active">
                    <!-- Video thumbnails will be inserted here -->
                </div>
                <div id="reposts-grid" class="video-gallery">
                    <!-- Reposted video thumbnails will be inserted here -->
                </div>
                <div id="liked-grid" class="video-gallery">
                    <!-- Liked video thumbnails will be inserted here -->
                </div>
            </div>
        </main>
    </div>
</div>


<!-- FastComments Modal -->
<div id="fastcomments-modal-container" class="modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="commentsModalTitle" data-translate-key="commentsModalTitle">Komentarze</h2>
            <button class="modal-close-btn" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div id="fastcomments-widget-0"></div>
        </div>
    </div>
</div>

<div id="video-player-modal" class="modal-overlay" style="background-color: #000;">
    <video controls style="width: 100%; height: 100%;"></video>
    <button class="modal-close-btn" data-action="close-modal" style="color: #fff;">&times;</button>
</div>

<div class="notification-popup" id="notificationPopup" role="dialog" aria-modal="true" aria-labelledby="notification-title">
    <div class="notification-header">
        <strong id="notification-title" data-translate-key="notificationsTitle">Powiadomienia</strong>
        <button data-action="close-notifications" data-translate-aria-label="closeNotificationsAriaLabel" aria-label="Zamknij powiadomienia">&times;</button>
    </div>
    <ul class="notification-list">
        <li class="notification-item unread">
            <div class="notif-header">
                <div class="notif-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                </div>
                <div class="notif-content-wrapper">
                    <div class="notif-summary">
                        <span class="notif-preview">Nowy komentarz od Paweł</span>
                        <span class="notif-time">2 min temu</span>
                    </div>
                    <div class="expand-chevron"></div>
                    <div class="unread-dot"></div>
                </div>
            </div>
            <div class="notif-full-details">
                <div class="notif-full-details-content">
                    <p>Cześć! Dzięki za super materiał. Naprawdę mi się podobał. Oby tak dalej!</p>
                </div>
            </div>
        </li>
        <li class="notification-item">
            <div class="notif-header">
                <div class="notif-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div class="notif-content-wrapper">
                    <div class="notif-summary">
                        <span class="notif-preview">Anna polubiła Twój film</span>
                        <span class="notif-time">1 godz. temu</span>
                    </div>
                    <div class="expand-chevron"></div>
                </div>
            </div>
            <div class="notif-full-details">
                <div class="notif-full-details-content">
                    <p>Anna właśnie polubiła Twój film pod tytułem "Niesamowite przygody w dżungli".</p>
                </div>
            </div>
        </li>
        <div class="notification-empty-state hidden-by-js">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            <p data-translate-key="notificationsEmpty">Wszystko na bieżąco!</p>
        </div>
    </ul>
</div>

<div class="account-modal-overlay" id="accountModal">
    <div class="account-modal-content">
        <div class="account-header">
            <h2 data-translate-key="accountModalTitleProfile">Profil</h2>
            <button class="close-btn" data-action="close-account-modal" data-translate-aria-label="closeAccountAriaLabel">&times;</button>
        </div>

        <div class="account-tabs">
            <button class="tab-btn active" data-tab="profile" data-translate-key="profileTab">Profil</button>
            <button class="tab-btn" data-tab="password" data-translate-key="passwordTab">Hasło</button>
            <button class="tab-btn" data-tab="delete" data-translate-key="deleteTab">Usuń konto</button>
        </div>

        <div class="account-content">
            <div class="tab-pane active" id="profile-tab">
                <div class="avatar-section">
                    <div class="avatar-wrapper">
                        <div class="avatar-container">
                            <img src="" alt="Avatar" class="avatar-img" id="userAvatar">
                        </div>
                        <button class="avatar-edit-btn" id="avatarEditBtn" data-translate-title="avatarEditBtnTitle" title="Zmień avatar">
                            +
                        </button>
                    </div>
                    <div class="avatar-info">
                        <div class="avatar-name" id="displayName"></div>
                        <div class="avatar-email" id="userEmail"></div>
                        <div class="user-badge">
                            <svg class="badge-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                            </svg>
                            <span data-translate-key="patronBadgeText">Patron Miłości</span>
                        </div>
                    </div>
                    <div class="status-message status-success" id="avatarSuccess" style="margin-top: 16px;"></div>
                    <div class="status-message status-error" id="avatarError" style="margin-top: 16px;"></div>
                </div>

                <div class="form-section">
                    <h3 class="section-title" data-translate-key="personalDataHeader">Dane osobowe</h3>

                    <form id="profileForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" data-translate-key="firstNameLabel">Imię</label>
                                <input type="text" class="form-input" data-translate-placeholder="firstNamePlaceholder" placeholder="Twoje imię" id="firstName" value="">
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-translate-key="lastNameLabel">Nazwisko</label>
                                <input type="text" class="form-input" data-translate-placeholder="lastNamePlaceholder" placeholder="Twoje nazwisko" id="lastName" value="">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-translate-key="emailLabel">Email</label>
                            <input type="email" class="form-input" data-translate-placeholder="emailPlaceholder" placeholder="email@domena.pl" id="email" value="">
                        </div>

                        <button type="submit" class="btn-primary" id="saveProfileBtn" data-translate-key="saveProfileBtn">
                            Zapisz zmiany
                        </button>
                        <div class="status-message status-success" id="profileSuccess"></div>
                        <div class="status-message status-error" id="profileError"></div>
                    </form>
                </div>

                <div class="settings-section">
                    <h3 class="section-title" data-translate-key="settingsHeader">Ustawienia</h3>

                    <div class="toggle-container">
                        <label class="toggle-label" data-translate-key="emailConsentLabel">Zgoda na maile</label>
                        <div class="toggle-switch" id="emailConsent">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" data-translate-key="emailLanguageLabel">Język maili</label>
                        <div class="language-selector">
                            <div class="language-option active" data-lang="pl" data-translate-key="emailLangPolish">
                                Polski
                            </div>
                            <div class="language-option" data-lang="en" data-translate-key="emailLangEnglish">
                                English
                            </div>
                        </div>
                    </div>

                    <button type="button" class="btn-primary" id="saveSettingsBtn" data-translate-key="saveSettingsBtn">
                        Zapisz ustawienia
                    </button>

                    <div class="status-message status-success" id="settingsSuccess"></div>
                    <div class="status-message status-error" id="settingsError"></div>
                </div>
            </div>

            <div class="tab-pane" id="password-tab">
                <div class="profile-section">
                    <h3 class="section-title" data-translate-key="changePasswordHeader">Zmiana hasła</h3>

                    <form id="passwordForm">
                        <div class="form-group">
                            <label class="form-label" data-translate-key="currentPasswordLabel">Obecne hasło</label>
                            <input type="password" class="form-input" data-translate-placeholder="currentPasswordPlaceholder" placeholder="Wprowadź obecne hasło" id="currentPassword">
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-translate-key="newPasswordLabel">Nowe hasło</label>
                            <input type="password" class="form-input" data-translate-placeholder="newPasswordPlaceholder" placeholder="Minimum 8 znaków" id="newPassword">
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-translate-key="confirmPasswordLabel">Powtórz nowe hasło</label>
                            <input type="password" class="form-input" data-translate-placeholder="confirmPasswordPlaceholder" placeholder="Powtórz nowe hasło" id="confirmPassword">
                            <div class="helper-text" data-translate-key="passwordHelperText">
                                Hasło musi zawierać minimum 8 znaków. Zalecamy użycie liter, cyfr i znaków specjalnych.
                            </div>
                        </div>

                        <button type="submit" class="btn-primary" id="changePasswordBtn" data-translate-key="changePasswordBtn">
                            Zmień hasło
                        </button>
                         <div class="status-message status-success" id="passwordSuccess"></div>
                        <div class="status-message status-error" id="passwordError"></div>
                    </form>
                </div>
            </div>

            <div class="tab-pane" id="delete-tab">
                <div class="profile-section">
                    <h3 class="section-title" data-translate-key="deleteAccountHeader">Usuń konto</h3>

                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h4 style="color: #ef4444; margin-bottom: 12px; font-size: 16px;" data-translate-key="deleteWarningHeader">⚠️ Uwaga!</h4>
                        <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.5;" data-translate-key="deleteWarningBody">
                            Ta operacja jest nieodwracalna. Wszystkie Twoje dane, filmy i ustawienia zostaną trwale usunięte.
                        </p>
                    </div>

                    <form id="deleteForm">
                        <div class="form-group">
                            <label class="form-label" data-translate-key="deleteConfirmationLabel">Aby potwierdzić, wpisz: <strong>USUWAM KONTO</strong></label>
                            <input type="text" class="form-input" data-translate-placeholder="deleteConfirmationPlaceholder" placeholder="USUWAM KONTO" id="deleteConfirmation">
                            <div class="helper-text" data-translate-key="deleteHelperText">
                                Po usunięciu konta zostaniesz automatycznie wylogowany.
                            </div>
                        </div>

                        <button type="submit" class="btn-danger" id="deleteAccountBtn" data-translate-key="deleteAccountBtn" disabled>
                            Trwale usuń konto
                        </button>
                        <div class="status-message status-success" id="deleteSuccess"></div>
                        <div class="status-message status-error" id="deleteError"></div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="crop-modal" id="cropModal">
    <div class="crop-modal-content">
        <div class="crop-header">
            <h3 data-translate-key="cropAvatarTitle">Przytnij avatar</h3>
            <button id="cropCloseBtn" class="close-btn" data-translate-aria-label="closeAriaLabel">&times;</button>
        </div>
        <div class="crop-body">
            <div class="crop-canvas-container">
                <canvas id="cropCanvas" width="300" height="300"></canvas>
                <div class="crop-overlay-circle"></div>
            </div>
        </div>
        <div class="crop-footer">
            <div class="zoom-controls">
                <button id="zoomOutBtn" class="zoom-btn" data-translate-aria-label="zoomOutAriaLabel" aria-label="Oddal">-</button>
                <input type="range" id="zoomSlider" class="zoom-slider" min="1" max="3" step="0.01">
                <button id="zoomInBtn" class="zoom-btn" data-translate-aria-label="zoomInAriaLabel" aria-label="Przybliż">+</button>
            </div>
            <button id="cropSaveBtn" class="btn-primary" data-translate-key="saveAvatarBtn">Zapisz avatar</button>
        </div>
    </div>
</div>
<input type="file" class="file-input" id="avatarFileInput" accept="image/*">

<div id="pwa-install-bar" class="pwa-prompt" aria-hidden="true">
    <div class="pwa-prompt-content">
        <p class="pwa-prompt-title" data-translate-key="installPwaHeading">Pobierz apkę!</p>
        <p class="pwa-prompt-description">
            <span data-translate-key="installPwaFullDescription">Zainstaluj Ting Tonga na swoim telefonie.</span>
        </p>
    </div>
    <button id="pwa-install-button" class="pwa-prompt-button" data-action="install-pwa" data-translate-key="installPwaAction">Zainstaluj</button>
</div>

<div id="pwa-ios-instructions" class="pwa-prompt-ios">
    <div class="pwa-ios-header">
        <h3>Zainstaluj aplikację na iPhone</h3>
        <button id="pwa-ios-close-button" class="pwa-ios-close-button">&times;</button>
    </div>
    <div class="pwa-ios-body">
        <p>1. Stuknij ikonę udostępniania <span class="pwa-ios-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a.75.75 0 01.75.75v10.51l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.22 2.22V3.25a.75.75 0 01.75-.75zM3.75 13a.75.75 0 00-1.5 0v5.5c0 1.24 1.01 2.25 2.25 2.25h15c1.24 0 2.25-1.01 2.25-2.25v-5.5a.75.75 0 00-1.5 0v5.5c0 .41-.34.75-.75.75h-15a.75.75 0 01-.75-.75v-5.5z" /></svg></span> w przeglądarce Safari.</p>
        <p>2. Wybierz opcję "Dodaj do ekranu początkowego" <span class="pwa-ios-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.75a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6a.75.75 0 01.75-.75z" /></svg></span>.</p>
        <p>3. Potwierdź, a aplikacja pojawi się na Twoim ekranie!</p>
    </div>
</div>

<div id="pwa-desktop-modal" class="modal-overlay pwa-desktop-mini-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-desktop-title" aria-hidden="true">
    <div class="modal-content" tabindex="-1">
        <button class="modal-close-btn" data-action="close-modal" aria-label="Zamknij">&times;</button>
        <div class="modal-body" style="text-align: center;">
            <svg class="phone-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-8 2h8c.28 0 .5.22.5.5v17c0 .28-.22.5-.5.5h-8c-.28 0-.5-.22-.5-.5v-17c0-.28.22-.5.5-.5zM12 19.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/></svg>
            <p class="pwa-mini-modal-text">Ting Tong to aplikacja mobilna!</p>
            <p class="pwa-mini-modal-subtitle">Wejdź na <strong>www.pawelperfect.pl</strong> na swoim telefonie, aby pobrać</p>
        </div>
    </div>
</div>

<div id="welcome-modal" class="modal-overlay welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title" aria-hidden="true">
    <div class="modal-content welcome-modal-content">
        <div class="welcome-icon-wrapper">
            <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
        </div>

        <h2 id="welcome-modal-title" class="welcome-title">
            <span class="welcome-title-main" data-translate-key="welcomeModalTitle">Witaj w Ting Tong!</span>
            <span class="welcome-title-emoji">✨</span>
        </h2>

        <div class="modal-body welcome-body">
            <p class="welcome-text-hero" data-translate-key="welcomeTextHero">
                Aplikacja napiwkowa<br>do skrolowania treści 🎬
            </p>

            <div class="welcome-divider"></div>

            <p class="welcome-text-highlight" data-translate-key="welcomeTextHighlight">
                💝 Patroni Miłości
            </p>
            <p class="welcome-text-description" data-translate-key="welcomeTextDescription">
                Wesprzyj moją twórczość i dołącz do ekskluzywnej społeczności!
            </p>

            <div class="welcome-actions">
                <button class="welcome-btn welcome-btn-primary" data-action="show-tip-jar">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                    </svg>
                    <span data-translate-key="welcomeBtnSupport">Wesprzyj Projekt</span>
                </button>
                <button class="welcome-btn welcome-btn-secondary" data-action="close-welcome-modal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span data-translate-key="welcomeBtnExplore">Zacznij Skrolować</span>
                </button>
            </div>

            <div class="welcome-signature">
                <div class="signature-line"></div>
                <p class="welcome-footer-text">
                    <span data-translate-key="welcomeFooterCreated">Stworzone z</span> ❤️ <span data-translate-key="welcomeFooterBy">przez</span> <strong>Pawła</strong>
                </p>
            </div>
        </div>
    </div>
</div>

<div class="image-lightbox">
    <img src="" alt="Preview">
    <button class="image-lightbox-close">&times;</button>
</div>

<div id="infoModal" class="modal-overlay info-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" aria-hidden="true">
    <div class="modal-content info-modal-content">
        <button class="modal-close-btn" data-action="close-modal" aria-label="Close modal" style="position: absolute; top: 15px; right: 15px; z-index: 10;">&times;</button>
        <div class="modal-body" id="infoModalBody"></div>
    </div>
</div>

<?php get_footer(); ?>
