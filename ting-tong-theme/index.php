<?php
/**
 * The main template file
 *
 * @package TingTongTheme
 */

get_header();
?>

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
                <input type="password" id="tt-password" name="pwd" aria-label="Password" />
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
                <video crossorigin playsinline muted autoplay preload="auto" poster="" class="player"></video>
                <button class="volume-button" data-action="toggle-volume">
                    <svg class="volume-on-icon" style="display: none;" fill="white" viewBox="0 0 24 24" width="28" height="28"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                    <svg class="volume-off-icon" fill="white" viewBox="0 0 24 24" width="28" height="28"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>
                </button>
                <div class="pause-overlay" aria-hidden="true">
                    <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                <!-- ✅ NOWE: Replay overlay -->
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
                <div class="error-overlay" aria-hidden="true">
                    <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <h2 class="error-title" data-translate-key="videoErrorTitle">Błąd Wideo</h2>
                    <p class="error-subtitle" data-translate-key="videoErrorSubtitle">Nie można załadować materiału.</p>
                    <button class="error-retry-button" data-action="retry-video" data-translate-key="videoErrorRetry">Spróbuj ponownie</button>
                </div>
                <div class="sidebar visible">
                    <div class="profile">
                        <button class="profileButton" data-action="open-public-profile" data-translate-aria-label="subscribeAriaLabel" aria-label="Subskrybuj"><img src="" alt="Profil" loading="lazy" decoding="async" /></button>
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
                        <div class="text-user"></div>
                        <div class="text-description"></div>
                    </div>
                </div>
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
    </div>
<input type="file" class="file-input" id="avatarFileInput" accept="image/*">

<div id="pwa-install-bar" class="pwa-prompt" aria-hidden="true" style="display: none;">
    <div class="pwa-prompt-content">
        <p class="pwa-prompt-title" data-translate-key="installPwaHeading">Zobacz więcej!</p>
        <p class="pwa-prompt-description">
            <u data-translate-key="installPwaSubheadingAction"></u><span data-translate-key="installPwaSubheadingRest"></span>
        </p>
    </div>
    <button id="pwa-install-button" class="pwa-prompt-button" data-translate-key="installPwaAction">Zainstaluj</button>
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
<div id="toast-notification" class="toast" role="status" aria-live="polite"></div>

<div id="welcome-modal" class="modal-overlay welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title" aria-hidden="true">
    <div class="modal-content welcome-modal-content">
        <!-- Ikona na górze -->
        <div class="welcome-icon-wrapper">
            <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
        </div>

        <!-- Tytuł -->
        <h2 id="welcome-modal-title" class="welcome-title">
            <span class="welcome-title-main" data-translate-key="welcomeModalTitle">Witaj w Ting Tong!</span>
            <span class="welcome-title-emoji">✨</span>
        </h2>

        <!-- Treść -->
        <div class="modal-body welcome-body">
            <p class="welcome-text-hero" data-translate-key="welcomeTextHero">
                Aplikacja napiwkowa<br>do skrolowania treści 🎬
            </p>

            <!-- Separator -->
            <div class="welcome-divider"></div>

            <p class="welcome-text-highlight" data-translate-key="welcomeTextHighlight">
                💝 Patroni Miłości
            </p>
            <p class="welcome-text-description" data-translate-key="welcomeTextDescription">
                Wesprzyj moją twórczość i dołącz do ekskluzywnej społeczności!
            </p>

            <!-- Przyciski -->
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

            <!-- Podpis autora -->
            <div class="welcome-signature">
                <div class="signature-line"></div>
                <p class="welcome-footer-text">
                    <span data-translate-key="welcomeFooterCreated">Stworzone z</span> ❤️ <span data-translate-key="welcomeFooterBy">przez</span> <strong>Pawła</strong>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- DODAJ na końcu body, przed zamknięciem </body> -->
<div class="image-lightbox">
    <img src="" alt="Preview">
    <button class="image-lightbox-close">&times;</button>
</div>

<!-- MODAL PIERWSZEGO LOGOWANIA - ZAKTUALIZOWANY -->
<div id="firstLoginModal" class="first-login-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="first-login-title">
  <div class="first-login-modal-content">

    <!-- Header z powitaniem -->
    <div class="first-login-header">
      <div class="first-login-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </div>
      <h2 id="first-login-title" class="first-login-title" data-translate-key="firstLoginTitle">Witaj na Ting Tongu!</h2>
      <p class="first-login-subtitle" data-translate-key="firstLoginSubtitle">Uzupełnij swój profil, aby kontynuować</p>
    </div>

    <!-- Body ze scrollem -->
    <div class="first-login-body">

      <!-- ✅ NOWA SEKCJA ZGÓD - subtelna, mała -->
      <div class="first-login-preferences">
        <div class="preference-row">
          <span class="preference-label" data-translate-key="emailConsentLabel">Powiadomienia mailowe</span>
          <div class="toggle-switch active" id="firstLoginEmailConsent">
            <div class="toggle-slider"></div>
          </div>
        </div>
        <div class="preference-row">
          <span class="preference-label" data-translate-key="emailLanguageLabel">Język maili</span>
          <div class="language-selector-compact">
            <div class="language-option-compact active" data-lang="pl" data-translate-key="emailLangPolish">PL</div>
            <div class="language-option-compact" data-lang="en" data-translate-key="emailLangEnglish">EN</div>
          </div>
        </div>
      </div>

      <!-- Wyświetlenie emaila logowania -->
      <div class="first-login-email-display">
        <div class="first-login-email-label" data-translate-key="firstLoginEmailLabel">Logujesz się za pomocą</div>
        <div class="first-login-email-value" id="firstLoginEmail">user@example.com</div>
      </div>

      <!-- Formularz -->
      <form id="firstLoginForm">

        <!-- SEKCJA 1: Dane Osobowe -->
        <div class="first-login-section">
          <h3 class="first-login-section-title" data-translate-key="firstLoginPersonalDataTitle">Dane Osobowe</h3>

          <div class="first-login-form-row">
            <div class="first-login-form-group">
              <label class="first-login-form-label" for="firstLoginFirstName">
                <span data-translate-key="firstLoginFirstNameLabel">Imię</span>
                <span class="required">*</span>
              </label>
              <input
                type="text"
                id="firstLoginFirstName"
                class="first-login-form-input"
                data-translate-placeholder="firstLoginFirstNamePlaceholder"
                placeholder="Np. Jan lub zmyślone"
                required
                autocomplete="given-name"
              >
            </div>

            <div class="first-login-form-group">
              <label class="first-login-form-label" for="firstLoginLastName">
                <span data-translate-key="firstLoginLastNameLabel">Nazwisko</span>
                <span class="required">*</span>
              </label>
              <input
                type="text"
                id="firstLoginLastName"
                class="first-login-form-input"
                data-translate-placeholder="firstLoginLastNamePlaceholder"
                placeholder="Np. Kowalski lub zmyślone"
                required
                autocomplete="family-name"
              >
            </div>
          </div>

          <div class="first-login-form-hint" data-translate-key="firstLoginPersonalDataHint">
            💡 Wskazówka: Możesz użyć prawdziwych lub całkowicie zmyślonych danych
          </div>
        </div>

        <!-- SEKCJA 2: Zmiana Hasła (BEZ CURRENT PASSWORD) -->
        <div class="first-login-section">
          <h3 class="first-login-section-title" data-translate-key="firstLoginPasswordTitle">Ustaw Nowe Hasło</h3>

          <div class="first-login-form-group">
            <label class="first-login-form-label" for="firstLoginNewPassword">
              <span data-translate-key="firstLoginNewPasswordLabel">Nowe hasło</span>
              <span class="required">*</span>
            </label>
            <input
              type="password"
              id="firstLoginNewPassword"
              class="first-login-form-input"
              data-translate-placeholder="firstLoginNewPasswordPlaceholder"
              placeholder="Minimum 8 znaków"
              required
              autocomplete="new-password"
            >
            <div class="password-strength-indicator" id="passwordStrengthIndicator">
              <div class="password-strength-bar" id="passwordStrengthBar"></div>
            </div>
            <div class="password-strength-text" id="passwordStrengthText"></div>
          </div>

          <div class="first-login-form-group">
            <label class="first-login-form-label" for="firstLoginConfirmPassword">
              <span data-translate-key="firstLoginConfirmPasswordLabel">Powtórz nowe hasło</span>
              <span class="required">*</span>
            </label>
            <input
              type="password"
              id="firstLoginConfirmPassword"
              class="first-login-form-input"
              data-translate-placeholder="firstLoginConfirmPasswordPlaceholder"
              placeholder="Wpisz ponownie nowe hasło"
              required
              autocomplete="new-password"
            >
            <div class="first-login-form-hint" data-translate-key="firstLoginPasswordHelperText">
              Hasło musi zawierać minimum 8 znaków. Zalecamy użycie liter, cyfr i znaków specjalnych.
            </div>
          </div>
        </div>

      </form>

      <!-- Status Messages -->
      <div class="first-login-status-message first-login-status-success" id="firstLoginSuccess"></div>
      <div class="first-login-status-message first-login-status-error" id="firstLoginError"></div>

    </div>

    <!-- Footer z przyciskiem -->
    <div class="first-login-footer">
      <button type="submit" form="firstLoginForm" class="first-login-submit-btn" id="firstLoginSubmitBtn" data-translate-key="firstLoginSubmitBtn">
        Gotowe! Przejdź do aplikacji
      </button>
    </div>

  </div>
</div>

<!-- Debug Tools -->
<div id="debug-tools" style="position: fixed; bottom: 10px; right: 10px; z-index: 10000;">
</div>

<?php get_footer(); ?>