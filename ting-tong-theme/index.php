<?php get_header(); ?>

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
        <button class="topbar-icon-btn hamburger-icon" data-action="toggle-main-menu" aria-label="Menu"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 12h18M3 6h18M3 18h18"></path></svg></button>
        <button class="topbar-central-trigger" data-action="toggle-login-panel"><div class="central-text-wrapper"><span class="topbar-text"></span></div></button>
        <button class="topbar-icon-btn notification-bell" data-action="toggle-notifications" aria-label="Powiadomienia"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="white" stroke-width="2"></path><path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="white" stroke-width="2"></path></svg><div class="notification-dot"></div></button>
    </div>
    <div class="login-panel" aria-hidden="true">
        <form id="tt-login-form" class="login-form">
            <input type="text" id="tt-username" name="log" aria-label="Username" />
            <div class="password-wrapper">
                <input type="password" id="tt-password" name="pwd" aria-label="Password" />
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility" aria-label="Toggle password visibility">
                    <svg class="eye-icon-open" style="display: none;" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    <svg class="eye-icon-closed" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                </button>
            </div>
            <button type="submit" id="tt-login-submit">ENTER</button>
        </form>
    </div>
    <div class="logged-in-menu" aria-hidden="true">
        <a href="#" data-action="open-account-modal" class="accountMenuButton">Konto</a>
        <a href="#" data-action="logout" class="logout-link">Wyloguj</a>
    </div>
    <div id="webyx-container" class="swiper"><div class="swiper-wrapper"></div></div>
</div>

<div id="pwa-install-bar" class="pwa-prompt" aria-hidden="true">
    <div class="pwa-prompt-content">
        <p class="pwa-prompt-title">Pobierz apkę!</p>
        <p class="pwa-prompt-description">Zainstaluj Ting Tonga na swoim telefonie.</p>
    </div>
    <button id="pwa-install-button" class="pwa-prompt-button" disabled>Zainstaluj</button>
</div>

<?php get_footer(); ?>