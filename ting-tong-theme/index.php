<?php
/**
 * The main template file
 *
 * @package TingTongTheme
 */

get_header();
?>

<!-- === Tipping Modal === -->
<div id="tippingModal" class="fl-modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="fl-modal-content-wrapper">
    <form id="tippingForm" class="fl-modal-content">

      <div class="fl-header">
        <div class="fl-drag-handle-container"><div class="fl-drag-handle"></div></div>
        <h2 id="tippingTitle" class="fl-title" data-translate-key="tippingTitle">Bramka Napiwkowa</h2>
        <div class="fl-progress-bar-container">
          <div class="fl-progress-bar-fill" id="tippingProgressBar"></div>
        </div>
      </div>

      <div class="fl-body" id="tippingBody">

        <div class="fl-step" data-step="0">
          <p class="fl-step-description" data-translate-key="tippingStep1Desc">Zostań Patronem Miłości i wspieraj rozwój projektu.</p>
          <div class="fl-fields-container">
            <label class="fl-preference-row">
              <span class="fl-preference-label" data-translate-key="tippingCreateAccountLabel">Czy założyć konto patrona?</span>
              <input type="checkbox" id="tippingCreateAccount" class="fl-checkbox" checked>
            </label>
            <div id="tippingEmailContainer" class="fl-email-container visible">
                <input type="email" id="tippingEmail" class="fl-input" data-translate-placeholder="emailPlaceholder" placeholder="email@domena.pl">
                <p class="fl-hint-text" data-translate-key="tippingEmailHint">Na podany e-mail otrzymasz dane dostępu do logowania do sekcji dla patronów.</p>
            </div>
          </div>
        </div>

        <div class="fl-step" data-step="1">
          <p class="fl-step-description" data-translate-key="tippingStep2Desc">Wybierz kwotę, którą chcesz wesprzeć projekt.</p>
          <div class="fl-fields-container">
             <div class="tipping-amount-container">
                <input type="number" id="tippingAmount" class="fl-input" data-translate-placeholder="tippingAmountPlaceholder" placeholder="Wpisz kwotę" min="1" step="any">
                <span class="tipping-currency">EUR</span>
             </div>
             <p class="fl-hint-text" data-translate-key="tippingAmountHint">Minimalna kwota to 1 EUR. Dziękujemy za każde wsparcie!</p>
          </div>
        </div>

        <div class="fl-step" data-step="2">
            <p class="fl-step-description" data-translate-key="tippingStep3Desc">Przekierowanie do płatności...</p>
            <div class="fl-fields-container" style="text-align: center; padding: 40px 0;">
                <div class="loading-spinner large"></div>
                <p class="fl-hint-text" style="margin-top: 20px;" data-translate-key="tippingRedirectHint">Za chwilę zostaniesz przekierowany do bezpiecznej bramki płatności Stripe.</p>
            </div>
        </div>

      </div>

      <div class="fl-footer">
        <div class="fl-footer-buttons">
          <button type="button" id="tippingPrevBtn" class="fl-btn fl-btn-prev" data-action="tipping-prev" data-translate-key="tippingPrev">Wstecz</button>
          <button type="button" id="tippingNextBtn" class="fl-btn fl-btn-next" data-action="tipping-next" data-translate-key="tippingNext">Dalej</button>
          <button type="submit" id="tippingSubmitBtn" class="fl-btn fl-btn-submit" data-translate-key="tippingSubmit">Przejdź do płatności</button>
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
                <button type="submit" id="tt-login-submit">ENTER.</button>
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
                           <svg fill="white" viewBox="0 0 24 24" width="28" height="28"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="pause-overlay" aria-hidden="true">
                    <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                <div class="replay-overlay" aria-hidden="true">
                    <svg class="replay-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 2v6h-6"/>
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                        <path d="M3 22v-6h6"/>
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                    </svg>
                </div>

                <div class="secret-overlay" aria-hidden="true">
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
                        <button class="profileButton" data-action="open-public-profile" data-translate-aria-label="accountAriaLabel" aria-label="Konto"><img src="" alt="Profil" loading="lazy" decoding="async" /></button>
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
                        <h3 class="slide-title"></h3>
                        <div class="slide-author-line">
                            <span class="author-label">autor:</span>
                            <span class="author-name"></span>
                        </div>
                        <p class="slide-description"></p>
                    </div>
                </div>
            </div>
        </div>
    </template>
    <div id="webyx-container" class="swiper">
        <div class="swiper-wrapper">
        </div>
    </div>
    <div id="alertBox" role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:18px; height:18px; stroke:white; stroke-width:2; fill:none; margin-right:6px;"><path d="M6 10V8a6 6 0 1 1 12 0v2" /><rect x="4" y="10" width="16" height="10" rx="2" ry="2" /></svg>
        <span id="alertText"></span>
    </div>
</div>
<div id="commentsModal" class="modal-overlay" role="dialog" aria-modal="true" data-translate-aria-label="commentsModalTitle" aria-label="Komentarze" aria-hidden="true">
    <div class="modal-content" tabindex="-1">
        <div class="modal-header">
            <h2 id="commentsTitle" class="modal-title" data-translate-key="commentsModalTitle">Komentarze</h2>
            <div class="comment-sort-options">
                <div class="sort-dropdown">
                    <button class="sort-trigger">
                        <span data-translate-key="commentSortTriggerText">Sortuj według: </span>
                        <span class="current-sort" data-translate-key="commentSortNewest">Fresz</span> ▼
                    </button>
                    <div class="sort-options">
                        <button class="sort-option active" data-sort="newest" data-translate-key="commentSortNewest">Fresz</button>
                        <button class="sort-option" data-sort="popular" data-translate-key="commentSortBest">Best</button>
                    </div>
                </div>
            </div>
            <button class="modal-close-btn" data-action="close-modal" data-translate-aria-label="closeCommentsAriaLabel" aria-label="Zamknij komentarze">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Comments will be rendered here -->
        </div>
        <div class="comment-form-container">
            <div class="login-to-comment-prompt" style="display: none;">
                <p>
                    <a href="#" data-action="toggle-login-panel" data-translate-key="loginToCommentAction">Zaloguj się</a><span data-translate-key="loginToCommentRest">, aby dodać komentarz.</span>
                </p>
            </div>
            <form id="comment-form">
                <div class="image-preview-container"></div>
                <div class="comment-input-wrapper">
                    <div class="emoji-picker"></div>
                    <input type="text" id="comment-input" data-translate-placeholder="addCommentPlaceholder" placeholder="Dodaj komentarz..." autocomplete="off" data-translate-aria-label="addCommentPlaceholder" aria-label="Dodaj komentarz">
                    <div class="comment-attachments">
                        <button type="button" class="attachment-btn emoji-btn" data-action="toggle-emoji-picker" aria-label="Dodaj emoji">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                <line x1="9" y1="9" x2="9.01" y2="9"/>
                                <line x1="15" y1="9" x2="15.01" y2="9"/>
                            </svg>
                        </button>
                        <button type="button" class="attachment-btn image-btn" data-action="attach-image" aria-label="Dodaj zdjęcie">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <button type="submit" class="submit-btn" data-translate-aria-label="sendCommentAriaLabel" aria-label="Wyślij komentarz">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </form>
            <input type="file" class="comment-image-input" accept="image/*">
        </div>
    </div>
</div>

<div class="notification-popup" id="notificationPopup" role="dialog" aria-modal="true" aria-labelledby="notification-title">
    <div class="notification-header">
        <strong id="notification-title" data-translate-key="notificationsTitle">Powiadomienia</strong>
        <button data-action="close-notifications" data-translate-aria-label="closeNotificationsAriaLabel" aria-label="Zamknij powiadomienia">&times;</button>
    </div>
    <ul class="notification-list">
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
<div id="tiktok-profile-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tiktok-profile-username" aria-hidden="true">
    <div class="tiktok-profile-content">
        <header class="tiktok-profile-header">
            <button class="profile-action-btn" data-action="close-modal" aria-label="Close profile" style="font-size: 28px;">&times;</button>
            <h2 id="tiktok-profile-username" class="username"></h2>
        </header>
        <main class="profile-main">
            <div class="profile-summary">
                <div class="profile-avatar-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                     <img src="" alt="Avatar użytkownika" class="profile-avatar" id="tiktok-profile-avatar">
                     <h1 class="profile-nickname" id="tiktok-profile-nickname"></h1>
                     <p id="tiktok-profile-at-username"></p>
                </div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="tiktok-following-count">0</span>
                        <span class="stat-label" data-translate-key="profileFollowingLabel">Obserwuje</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="tiktok-followers-count">0</span>
                        <span class="stat-label" data-translate-key="profileFollowersLabel">Obserwujący</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="tiktok-likes-count">0</span>
                        <span class="stat-label" data-translate-key="profileLikesLabel">Polubienia</span>
                    </div>
                </div>
            </div>
            <p class="profile-bio" id="tiktok-profile-bio"></p>
            <div class="profile-actions">
                <button class="follow-button" data-translate-key="profileFollowBtn">Obserwuj</button>
                <button class="icon-button"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg></button>
            </div>

            <div class="profile-tabs">
                <div class="tab active" data-tab-content="videos-grid"><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/></svg></div>
                <div class="tab" data-tab-content="liked-grid"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>
                <div class="tab" data-tab-content="reposts-grid"><svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>
            </div>
            <div class="video-gallery active" id="videos-grid">
                <!-- Video thumbnails will be dynamically inserted here -->
            </div>
             <div class="video-gallery" id="liked-grid">
                <!-- Liked video thumbnails will be dynamically inserted here -->
            </div>
            <div class="video-gallery" id="reposts-grid">
                <!-- Reposted video thumbnails will be dynamically inserted here -->
            </div>
        </main>
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
        <h3>Jak zainstalować aplikację</h3>
        <button id="pwa-ios-close-button" class="pwa-ios-close-button">&times;</button>
    </div>
    <div class="pwa-ios-body">
        <p>1. Stuknij ikonę <strong>udostępniania</strong> w przeglądarce.</p>
        <p>2. Wybierz <strong>"Dodaj do ekranu początkowego"</strong>.</p>
        <p>3. Potwierdź, a aplikacja pojawi się na Twoim ekranie!</p>
    </div>
</div>

<div id="pwa-desktop-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pwa-desktop-title" aria-hidden="true">
    <div class="modal-content" tabindex="-1">
        <button class="modal-close-btn" data-action="close-modal">&times;</button>
        <h2 id="pwa-desktop-title" data-translate-key="pwaModalTitle">Pełne doświadczenie Ting Tong na Twoim telefonie!</h2>
        <div class="modal-body" style="text-align: center;">
            <p data-translate-key="pwaModalBody">Zeskanuj kod QR lub odwiedź nas na telefonie, aby pobrać aplikację i odblokować pełne możliwości.</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com" alt="QR Code" style="margin-top: 16px; border-radius: 8px;">
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

<div id="infoModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" aria-hidden="true">
    <div class="modal-content">
        <button class="modal-close-btn" data-action="close-modal">&times;</button>
        <div class="modal-body">
            <h2 id="info-modal-title">O Projekcie Ting Tong</h2>
            <p>Witaj w Ting Tong – innowacyjnej aplikacji, która rewolucjonizuje sposób, w jaki twórcy i widzowie wchodzą ze sobą w interakcje. Nasza platforma, zaprojektowana na wzór popularnych aplikacji z krótkimi formami wideo, to nie tylko miejsce do oglądania, ale przede wszystkim do realnego wspierania ulubionych autorów.</p>

            <h3>Nasza Misja</h3>
            <p>Celem Ting Tong jest stworzenie ekosystemu, w którym kreatywność jest bezpośrednio nagradzana. Wierzymy, że twórcy zasługują na transparentne i proste narzędzia do monetyzacji swojej pasji, a widzowie powinni mieć możliwość realnego wpływu na rozwój kanałów, które kochają. Chcemy zlikwidować barierę między twórcą a odbiorcą, budując społeczność opartą na wzajemnym szacunku i wsparciu.</p>

            <h3>Kluczowe Funkcje</h3>
            <ul>
                <li><strong>Intuicyjny Interfejs:</strong> Przewijaj wideo w pionie, tak jak lubisz. Nasz interfejs jest szybki, płynny i zaprojektowany z myślą o urządzeniach mobilnych.</li>
                <li><strong>System Napiwków:</strong> Podoba Ci się treść? Okaż swoje wsparcie jednym kliknięciem! Zintegrowany i bezpieczny system napiwków pozwala na błyskawiczne przekazywanie drobnych kwot bezpośrednio do twórcy.</li>
                <li><strong>Społeczność:</strong> Komentuj, lajkuj i udostępniaj. Bądź częścią aktywnej społeczności skupionej wokół Twoich ulubionych tematów i twórców.</li>
                <li><strong>Tryb PWA (Progressive Web App):</strong> Zainstaluj Ting Tong na swoim telefonie, aby uzyskać dostęp do dodatkowych funkcji, płynniejszego działania i powiadomień push – wszystko to bez konieczności pobierania aplikacji ze sklepu.</li>
                <li><strong>Tryb Immersyjny:</strong> Zanurz się w treściach bez rozpraszaczy. Jedno dotknięcie ukrywa interfejs, pozwalając Ci skupić się na tym, co najważniejsze – wideo.</li>
            </ul>

            <h3>Dla Twórców</h3>
            <p>Jesteś twórcą? Ting Tong oferuje Ci proste narzędzia do zarabiania na swojej pasji. Bez skomplikowanych algorytmów i niejasnych zasad. Po prostu twórz, a Twoi fani zajmą się resztą. Skup się na jakości, a my zapewnimy Ci platformę do jej monetyzacji.</p>

            <h3>Dla Widzów</h3>
            <p>Jako widz, masz realny wpływ. Twoje wsparcie nie tylko motywuje twórców do dalszej pracy, ale także pomaga im inwestować w lepszy sprzęt, rozwijać nowe formaty i poświęcać więcej czasu na to, co robią najlepiej. Każdy napiwek to cegiełka budująca przyszłość niezależnej twórczości w internecie.</p>
            <p>Dziękujemy, że jesteś z nami. Przewijaj, odkrywaj i wspieraj!</p>
        </div>
    </div>
</div>


<?php get_footer(); ?>