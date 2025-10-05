(() => {
  /* ============================
   * 1) CDN helper + preconnect
   * ============================ */
  const CDN_HOST = null; // <— ZMIEŃ jeśli używasz innego hosta CDN
  const isHttpUrl = (u) => /^https?:\/\//i.test(u);

  // Wstrzyknij preconnect/dns-prefetch (robimy to dynamicznie, żeby nie ruszać <head>)
  try {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (head && CDN_HOST) {
      const mk = (tag, attrs) => {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        return el;
      };
      // nie duplikuj
      if (
        !document.querySelector(`link[rel="preconnect"][href="${CDN_HOST}"]`)
      ) {
        head.appendChild(
          mk("link", { rel: "preconnect", href: CDN_HOST, crossorigin: "" }),
        );
      }
      if (
        !document.querySelector(
          `link[rel="dns-prefetch"][href="//${CDN_HOST.replace(/^https?:\/\//, "")}"]`,
        )
      ) {
        head.appendChild(
          mk("link", {
            rel: "dns-prefetch",
            href: "//" + CDN_HOST.replace(/^https?:\/\//, ""),
          }),
        );
      }
    }
  } catch (e) {
    /* no-op */
  }

  // Helper mapujący origin → CDN (zachowuje ścieżkę)
  function toCDN(url) {
    if (!url || !CDN_HOST) return url;
    try {
      // jeśli już CDN — zostaw
      if (url.startsWith(CDN_HOST)) return url;
      // jeśli absolutny http(s) — podmień tylko host
      if (isHttpUrl(url)) {
        const u = new URL(url);
        const c = new URL(CDN_HOST);
        return `${c.origin}${u.pathname}${u.search}${u.hash}`;
      }
      // jeśli względny — dolej do CDN
      return CDN_HOST.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
    } catch {
      return url;
    }
  }

  // Podmień src na CDN przy pierwszym ustawieniu źródeł (bez grzebania w Twoich funkcjach)
  // — obejście: obserwujemy dodawanie/zmianę <source>/<video>
  const mm = new MutationObserver((muts) => {
    for (const m of muts) {
      const nodes = Array.from(m.addedNodes || []);
      for (const n of nodes) rewriteSources(n);
      if (
        m.type === "attributes" &&
        (m.target.tagName === "SOURCE" || m.target.tagName === "VIDEO") &&
        m.attributeName === "src"
      ) {
        rewriteNodeSrc(m.target);
      }
    }
  });
  mm.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });

  function rewriteSources(root) {
    if (!root || !CDN_HOST) return;
    if (root.tagName === "SOURCE" || root.tagName === "VIDEO")
      rewriteNodeSrc(root);
    root.querySelectorAll?.("source, video").forEach(rewriteNodeSrc);
  }
  function rewriteNodeSrc(el) {
    try {
      const src = el.getAttribute("src");
      if (!src) return;
      const mapped = toCDN(src);
      if (mapped && mapped !== src) el.setAttribute("src", mapped);
    } catch (e) {}
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // Guard for undefined WordPress objects in standalone mode
  if (typeof window.ajax_object === "undefined") {
    console.warn(
      "`ajax_object` is not defined. Using mock data for standalone development.",
    );
    window.ajax_object = {
      ajax_url: "#", // Prevent actual network requests
      nonce: "0a1b2c3d4e",
    };
  }

  const mockSlides = [
    {
      id: "slide1",
      access: "public",
      initialLikes: 10,
      isLiked: false,
      initialComments: 4,
      isIframe: false,
      mp4Url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      user: "Filmik 1",
      description: "Podpis do filmiku 1",
      avatar: "https://i.pravatar.cc/100?u=1",
      likeId: "101",
      comments: [
        {
          id: "c1-1",
          parentId: null,
          user: "Kasia",
          avatar: "https://i.pravatar.cc/100?u=10",
          text: "Niesamowite ujęcie! 🐰",
          timestamp: "2023-10-27T10:00:00Z",
          likes: 15,
          isLiked: false,
          canEdit: true,
        },
        {
          id: "c1-1-1",
          parentId: "c1-1",
          user: "Tomek",
          avatar: "https://i.pravatar.cc/100?u=11",
          text: "Prawda!",
          timestamp: "2023-10-27T10:01:00Z",
          likes: 2,
          isLiked: false,
        },
        {
          id: "c1-2",
          parentId: null,
          user: "Tomek",
          avatar: "https://i.pravatar.cc/100?u=11",
          text: "Haha, co za królik!",
          timestamp: "2023-10-27T10:05:00Z",
          likes: 5,
          isLiked: true,
        },
        {
          id: "c1-3",
          parentId: null,
          user: "Anna",
          avatar: "https://i.pravatar.cc/100?u=13",
          text: "Super! ❤️",
          timestamp: "2023-10-27T10:10:00Z",
          likes: 25,
          isLiked: false,
        },
      ],
    },
    {
      id: "slide2",
      access: "secret",
      initialLikes: 20,
      isLiked: false,
      initialComments: 2,
      isIframe: false,
      mp4Url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      user: "Paweł Polutek",
      description: "Podpis do filmiku 2",
      avatar: "https://i.pravatar.cc/100?u=2",
      likeId: "102",
      comments: [
        {
          id: "c2-1",
          parentId: null,
          user: "Admin",
          avatar: "https://i.pravatar.cc/100?u=12",
          text: "To jest materiał premium!",
          timestamp: "2023-10-27T11:00:00Z",
          likes: 100,
          isLiked: true,
        },
        {
          id: "c2-2",
          parentId: null,
          user: "Ewa",
          avatar: "https://i.pravatar.cc/100?u=14",
          text: "Zgadzam się, świetna jakość.",
          timestamp: "2023-10-27T11:05:00Z",
          likes: 12,
          isLiked: false,
        },
      ],
    },
    {
      id: "slide3",
      access: "pwa",
      initialLikes: 30,
      isLiked: false,
      initialComments: 2,
      isIframe: false,
      mp4Url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      user: "Test Video",
      description: "A test video slide.",
      avatar: "https://i.pravatar.cc/100?u=3",
      likeId: "103",
      comments: [
        {
          id: "c3-1",
          parentId: null,
          user: "Jan",
          avatar: "https://i.pravatar.cc/100?u=15",
          text: "Działa!",
          timestamp: "2023-10-27T12:00:00Z",
          likes: 0,
          isLiked: false,
        },
        {
          id: "c3-2",
          parentId: null,
          user: "Zofia",
          avatar: "https://i.pravatar.cc/100?u=16",
          text: "Testowy komentarz",
          timestamp: "2023-10-27T12:01:00Z",
          likes: 1,
          isLiked: false,
        },
      ],
    },
  ];

  // Guard for undefined WordPress objects in standalone mode
  if (typeof window.ajax_object === "undefined") {
    console.warn(
      "`ajax_object` is not defined. Using mock data for standalone development.",
    );
    window.ajax_object = {
      ajax_url: "#", // Prevent actual network requests
      nonce: "0a1b2c3d4e",
    };
  }

  if (typeof window.TingTongData === "undefined") {
    console.warn(
      "`TingTongData` is not defined. Using mock data for standalone development.",
    );
    window.TingTongData = {
      isLoggedIn: false,
      slides: mockSlides,
    };
  }

  /**
   * ==========================================================================
   * 1. CONFIGURATION & APP DATA
   * ==========================================================================
   */
  const Config = {
    PREFETCH_NEIGHBORS: true,
    PREFETCH_MARGIN: "150%",
    UNLOAD_FAR_SLIDES: true,
    FAR_DISTANCE: 2,
    LOW_DATA_MODE: false,
    METRICS_ENDPOINT: "/api/tt-metrics",
    DEBUG_PANEL: true,
    GESTURE_GRACE_PERIOD_MS: 2000,
    TRANSLATIONS: {
      pl: {
        loggedOutText: "Nie masz psychy się zalogować",
        loggedInText: "Ting Tong",
        loginSuccess: "Zalogowano pomyślnie!",
        loginFailed: "Logowanie nie powiodło się. Spróbuj ponownie.",
        accountHeaderText: "Konto",
        menuAriaLabel: "Menu",
        subscribeAriaLabel: "subskrajbować",
        shareTitle: "Udostępnij",
        shareAriaLabel: "Udostępnij",
        shareText: "Szeruj",
        tipTitle: "Napiwek",
        tipAriaLabel: "Napiwek",
        tipText: "Napiwek",
        languageAriaLabel: "Zmień język",
        languageText: "PL",
        subscribeAlert: "Zaloguj się, aby subskrajbować.",
        likeAlert: "Zaloguj się, aby lajkować.",
        notificationAlert: "Zaloguj się i bądź na bieżąco.",
        menuAccessAlert: "Zaloguj się, aby uzyskać dostęp do menu.",
        logoutSuccess: "Zostałeś wylogowany.",
        likeError: "Błąd komunikacji z serwerem.",
        secretTitle: "Ściśle Tajne",
        secretSubtitleAction: "Zaloguj się,",
        secretSubtitleRest: " aby odblokować",
        pwaTitle: "Ściśle Tajne",
        pwaSubtitleAction: "Pobierz aplikację,",
        pwaSubtitleRest: " aby zobaczyć",
        closeAccountAriaLabel: "Zamknij panel konta",
        accountMenuButton: "Konto",
        logoutLink: "Wyloguj",
        profileTab: "Profil",
        passwordTab: "Hasło",
        deleteTab: "Usuń konto",
        loggedInState: "Zalogowany",
        loggedOutState: "Gość",
        linkCopied: "Link skopiowany do schowka!",
        likeAriaLabel: "Polub",
        notificationAriaLabel: "Powiadomienia",
        commentsAriaLabel: "Komentarze",
        commentsModalTitle: "Komentarze",
        closeCommentsAriaLabel: "Zamknij komentarze",
        likeAriaLabelWithCount: "Polub. Aktualna liczba polubień: {count}",
        unlikeAriaLabelWithCount:
          "Cofnij polubienie. Aktualna liczba polubień: {count}",
        notificationsTitle: "Powiadomienia",
        closeNotificationsAriaLabel: "Zamknij powiadomienia",
        notificationsEmpty: "Wszystko na bieżąco!",
        notif1Preview: "Nowa wiadomość od Admina",
        notif1Time: "2 min temu",
        notif1Full:
          "Cześć! Chcieliśmy tylko dać znać, że nowa wersja aplikacji jest już dostępna. Sprawdź nowe funkcje w panelu konta!",
        notif2Preview: "Twój profil został zaktualizowany",
        notif2Time: "10 min temu",
        notif2Full:
          "Twoje zmiany w profilu zostały pomyślnie zapisane. Możesz je przejrzeć w dowolnym momencie, klikając w swój awatar.",
        notif3Preview: "Specjalna oferta czeka na Ciebie!",
        notif3Time: "1 godz. temu",
        notif3Full:
          "Nie przegap! Przygotowaliśmy dla Ciebie specjalną letnią promocję. Zgarnij dodatkowe bonusy już teraz. Oferta ograniczona czasowo.",
        pwaModalTitle: "Pełne doświadczenie Ting Tong na Twoim telefonie!",
        pwaModalBody:
          "Zeskanuj kod QR lub odwiedź nas na telefonie, aby pobrać aplikację i odblokować pełne możliwości.",
        installPwaHeading: "Zobacz więcej!",
        installPwaSubheadingAction: "Pobierz aplikację",
        installPwaSubheadingRest: " i zobacz więcej!",
        installPwaAction: "Zainstaluj",
        openPwaAction: "Otwórz",
        videoErrorTitle: "Błąd Wideo",
        videoErrorSubtitle: "Nie można załadować materiału.",
        videoErrorRetry: "Spróbuj ponownie",
        alreadyInstalledText: "Przecież już ściągłeś",
        noComments: "Brak komentarzy. Bądź pierwszy!",
        commentSortTriggerText: "Sortuj według: ",
        commentSortNewest: "Fresz",
        commentSortBest: "Best",
        toggleRepliesShow: "Rozwiń odpowiedzi ({count})",
        toggleRepliesHide: "Ukryj odpowiedzi",
        loginToCommentAction: "Zaloguj się",
        loginToCommentRest: ", aby dodać komentarz.",
        addCommentPlaceholder: "Dodaj komentarz...",
        sendCommentAriaLabel: "Wyślij komentarz",
        commentReplyAction: "Reply",
        replyingTo: "Odpowiadasz @{user}",
        cancelReplyAriaLabel: "Anuluj odpowiedź",
        failedToUpdateLike: "Nie udało się zaktualizować polubienia.",
        accountModalTitleProfile: "Profil",
        accountModalTitlePassword: "Hasło",
        accountModalTitleDelete: "Usuń konto",
        avatarEditBtnTitle: "Zmień avatar",
        patronBadgeText: "Patron Miłości",
        personalDataHeader: "Dane osobowe",
        firstNameLabel: "Imię",
        firstNamePlaceholder: "Twoje imię",
        lastNameLabel: "Nazwisko",
        lastNamePlaceholder: "Twoje nazwisko",
        emailLabel: "Email",
        emailPlaceholder: "email@domena.pl",
        saveProfileBtn: "Zapisz zmiany",
        settingsHeader: "Ustawienia",
        emailConsentLabel: "Zgoda na maile",
        emailLanguageLabel: "Język maili",
        emailLangPolish: "Polski",
        emailLangEnglish: "English",
        saveSettingsBtn: "Zapisz ustawienia",
        changePasswordHeader: "Zmiana hasła",
        currentPasswordLabel: "Obecne hasło",
        currentPasswordPlaceholder: "Wprowadź obecne hasło",
        newPasswordLabel: "Nowe hasło",
        newPasswordPlaceholder: "Minimum 8 znaków",
        confirmPasswordLabel: "Powtórz nowe hasło",
        confirmPasswordPlaceholder: "Powtórz nowe hasło",
        passwordHelperText:
          "Hasło musi zawierać minimum 8 znaków. Zalecamy użycie liter, cyfr i znaków specjalnych.",
        changePasswordBtn: "Zmień hasło",
        deleteAccountHeader: "Usuń konto",
        deleteWarningHeader: "⚠️ Uwaga!",
        deleteWarningBody:
          "Ta operacja jest nieodwracalna. Wszystkie Twoje dane, filmy i ustawienia zostaną trwale usunięte.",
        deleteConfirmationLabel:
          "Aby potwierdzić, wpisz: <strong>USUWAM KONTO</strong>",
        deleteConfirmationPlaceholder: "USUWAM KONTO",
        deleteHelperText:
          "Po usunięciu konta zostaniesz automatycznie wylogowany.",
        deleteAccountBtn: "Trwale usuń konto",
        profileFollowingLabel: "Obserwuje",
        profileFollowersLabel: "Obserwujący",
        profileLikesLabel: "Polubienia",
        profileFollowBtn: "Obserwuj",
        savingButtonText: "Zapisywanie...",
        changingButtonText: "Zmienianie...",
        deletingButtonText: "Usuwanie...",
        settingsUpdateSuccess: "Ustawienia zostały zapisane! (DEMO)",
        settingsUpdateError: "Wystąpił błąd podczas zapisywania ustawień.",
        fileSelectImageError: "Proszę wybrać plik obrazu.",
        fileTooLargeError: "Plik jest za duży. Maksymalny rozmiar to 5MB.",
        avatarUpdateSuccess: "Avatar został zaktualizowany!",
        avatarUpdateError: "Nie otrzymano URL avatara",
        imageProcessingError: "Błąd podczas przetwarzania obrazu.",
        allFieldsRequiredError: "Wszystkie pola są wymagane.",
        invalidEmailError: "Podaj prawidłowy adres email.",
        profileUpdateSuccess: "Profil został zaktualizowany!",
        profileUpdateError: "Wystąpił błąd podczas aktualizacji profilu.",
        profileUpdateFailedError: "Błąd aktualizacji profilu.",
        passwordUpdateSuccess: "Hasło zostało zmienione!",
        passwordUpdateError: "Błąd zmiany hasła.",
        passwordLengthError: "Nowe hasło musi mieć minimum 8 znaków.",
        passwordsMismatchError: "Nowe hasła muszą być identyczne.",
        passwordChangeFailedError: "Błąd zmiany hasła.",
        deleteAccountSuccess: "Konto zostało usunięte. Trwa wylogowywanie...",
        deleteAccountError: "Błąd usuwania konta.",
        deleteAccountFailedError: "Błąd usuwania konta.",
        deleteConfirmationError: "Wpisz dokładnie: {confirmationText}",
        deleteConfirmationString: "USUWAM KONTO",
        postCommentError: "Nie udało się opublikować komentarza.",
        commentEditAction: "Edytuj",
        commentDeleteAction: "Usuń",
        deleteCommentConfirm: "Czy na pewno chcesz usunąć ten komentarz?",
        editCommentPrompt: "Edytuj swój komentarz:",
        commentUpdateSuccess: "Komentarz zaktualizowany.",
        commentUpdateError: "Nie udało się zaktualizować komentarza.",
        commentDeleteSuccess: "Komentarz usunięty.",
                    commentDeleteError: "Nie udało się usunąć komentarza.",
                    postCommentSuccess: "Komentarz został opublikowany!",
      },
      en: {
        loggedOutText: "You don't have the guts to log in",
        loggedInText: "You are logged in",
        loginSuccess: "Logged in successfully!",
        loginFailed: "Login failed. Please try again.",
        accountHeaderText: "Account",
        menuAriaLabel: "Menu",
        subscribeAriaLabel: "Subscribe",
        shareTitle: "Share",
        shareAriaLabel: "Share",
        shareText: "Share",
        tipTitle: "Tip",
        tipAriaLabel: "Tip",
        tipText: "Tip",
        languageAriaLabel: "Change language",
        languageText: "EN",
        subscribeAlert: "Log in to subscribe.",
        profileViewAlert: "Log in to see the profile.",
        likeAlert: "Log in to like.",
        notificationAlert: "Log in to stay up to date.",
        menuAccessAlert: "Log in to access the menu.",
        logoutSuccess: "You have been logged out.",
        likeError: "Server communication error.",
        secretTitle: "Top Secret",
        secretSubtitleAction: "Log in",
        secretSubtitleRest: " to unlock",
        pwaTitle: "Top Secret",
        pwaSubtitleAction: "Download the app",
        pwaSubtitleRest: " to view",
        closeAccountAriaLabel: "Close account panel",
        accountMenuButton: "Account",
        logoutLink: "Logout",
        profileTab: "Profile",
        passwordTab: "Password",
        deleteTab: "Delete account",
        loggedInState: "Logged In",
        loggedOutState: "Guest",
        linkCopied: "Link copied to clipboard!",
        likeAriaLabel: "Like",
        notificationAriaLabel: "Notifications",
        commentsAriaLabel: "Comments",
        commentsModalTitle: "Comments",
        closeCommentsAriaLabel: "Close comments",
        likeAriaLabelWithCount: "Like. Current likes: {count}",
        unlikeAriaLabelWithCount: "Unlike. Current likes: {count}",
        notificationsTitle: "Notifications",
        closeNotificationsAriaLabel: "Close notifications",
        notificationsEmpty: "You are all caught up!",
        notif1Preview: "New message from Admin",
        notif1Time: "2 mins ago",
        notif1Full:
          "Hi there! Just wanted to let you know that a new version of the app is available. Check out the new features in your account panel!",
        notif2Preview: "Your profile has been updated",
        notif2Time: "10 mins ago",
        notif2Full:
          "Your profile changes have been saved successfully. You can review them anytime by clicking on your avatar.",
        notif3Preview: "A special offer is waiting for you!",
        notif3Time: "1 hour ago",
        notif3Full:
          "Don't miss out! We have prepared a special summer promotion just for you. Grab your extra bonuses now. Limited time offer.",
        pwaModalTitle: "The full Ting Tong experience is on your phone!",
        pwaModalBody:
          "Scan the QR code below or visit us on your phone to download the app and unlock the full experience.",
        installPwaHeading: "See more!",
        installPwaSubheadingAction: "Download the app",
        installPwaSubheadingRest: " to see more!",
        installPwaAction: "Install",
        openPwaAction: "Open",
        videoErrorTitle: "Video Error",
        videoErrorSubtitle: "Could not load the content.",
        videoErrorRetry: "Try Again",
        alreadyInstalledText: "You've already installed the app!",
        noComments: "No comments yet. Be the first!",
        commentSortTriggerText: "Sort by: ",
        commentSortNewest: "Newest",
        commentSortBest: "Best",
        toggleRepliesShow: "Show replies ({count})",
        toggleRepliesHide: "Hide replies",
        loginToCommentAction: "Log in",
        loginToCommentRest: " to add a comment.",
        addCommentPlaceholder: "Add a comment...",
        sendCommentAriaLabel: "Send comment",
        commentReplyAction: "Reply",
        replyingTo: "Replying to @{user}",
        cancelReplyAriaLabel: "Cancel reply",
        failedToUpdateLike: "Failed to update like.",
        accountModalTitleProfile: "Profile",
        accountModalTitlePassword: "Password",
        accountModalTitleDelete: "Delete Account",
        avatarEditBtnTitle: "Change avatar",
        patronBadgeText: "Patron of Love",
        personalDataHeader: "Personal Data",
        firstNameLabel: "First Name",
        firstNamePlaceholder: "Your first name",
        lastNameLabel: "Last Name",
        lastNamePlaceholder: "Your last name",
        emailLabel: "Email",
        emailPlaceholder: "email@domain.com",
        saveProfileBtn: "Save changes",
        settingsHeader: "Settings",
        emailConsentLabel: "Email Consent",
        emailLanguageLabel: "Email Language",
        emailLangPolish: "Polish",
        emailLangEnglish: "English",
        saveSettingsBtn: "Save settings",
        changePasswordHeader: "Change Password",
        currentPasswordLabel: "Current Password",
        currentPasswordPlaceholder: "Enter current password",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "Minimum 8 characters",
        confirmPasswordLabel: "Repeat new password",
        confirmPasswordPlaceholder: "Repeat new password",
        passwordHelperText:
          "Password must be at least 8 characters long. We recommend using letters, numbers, and special characters.",
        changePasswordBtn: "Change password",
        deleteAccountHeader: "Delete Account",
        deleteWarningHeader: "⚠️ Warning!",
        deleteWarningBody:
          "This operation is irreversible. All your data, videos, and settings will be permanently deleted.",
        deleteConfirmationLabel:
          "To confirm, type: <strong>DELETE ACCOUNT</strong>",
        deleteConfirmationPlaceholder: "DELETE ACCOUNT",
        deleteHelperText:
          "After deleting your account, you will be automatically logged out.",
        deleteAccountBtn: "Permanently delete account",
        profileFollowingLabel: "Following",
        profileFollowersLabel: "Followers",
        profileLikesLabel: "Likes",
        profileFollowBtn: "Follow",
        savingButtonText: "Saving...",
        changingButtonText: "Changing...",
        deletingButtonText: "Deleting...",
        settingsUpdateSuccess: "Settings have been saved! (DEMO)",
        settingsUpdateError: "An error occurred while saving settings.",
        fileSelectImageError: "Please select an image file.",
        fileTooLargeError: "File is too large. Maximum size is 5MB.",
        avatarUpdateSuccess: "Avatar has been updated!",
        avatarUpdateError: "Avatar URL not received",
        imageProcessingError: "Error processing image.",
        allFieldsRequiredError: "All fields are required.",
        invalidEmailError: "Please provide a valid email address.",
        profileUpdateSuccess: "Profile has been updated!",
        profileUpdateError: "An error occurred while updating the profile.",
        profileUpdateFailedError: "Profile update failed.",
        passwordUpdateSuccess: "Password has been changed!",
        passwordUpdateError: "Error changing password.",
        passwordLengthError: "New password must be at least 8 characters long.",
        passwordsMismatchError: "New passwords must be identical.",
        passwordChangeFailedError: "Password change failed.",
        deleteAccountSuccess: "Account has been deleted. Logging you out...",
        deleteAccountError: "Error deleting account.",
        deleteAccountFailedError: "Account deletion failed.",
        deleteConfirmationError: "Please type exactly: {confirmationText}",
        deleteConfirmationString: "DELETE ACCOUNT",
        postCommentSuccess: "Comment published successfully!",
      },
    },
  };


  // --- POPRAWIONA LOGIKA WYSZUKIWANIA DANYCH ---
  const slidesData =
    typeof window.TingTongData !== "undefined" &&
    Array.isArray(window.TingTongData.slides) &&
    window.TingTongData.slides.length > 0
      ? window.TingTongData.slides
      : mockSlides;

  slidesData.forEach((s) => {
    s.likeId = String(s.likeId);
  });
  // --- KONIEC POPRAWIONEJ LOGIKI ---

  /**
   * ==========================================================================
   * 2. STATE MANAGEMENT
   * ==========================================================================
   */
  const State = (function () {
    const _state = {
      isUserLoggedIn:
        (typeof TingTongData !== "undefined" && TingTongData.isLoggedIn) ||
        false,
      currentLang: "pl",
      currentSlideIndex: 0,
      isAutoplayBlocked: false,
      lastFocusedElement: null,
      lastUserGestureTimestamp: 0,
      activeVideoSession: 0,
      commentSortOrder: "newest",
      replyingToComment: null,
    };

    return {
      get: (key) => _state[key],
      set: (key, value) => {
        _state[key] = value;
      },
      getState: () => ({ ..._state }),
    };
  })();

  /**
   * ==========================================================================
   * 3. UTILITIES
   * ==========================================================================
   */
  const Utils = (function () {
    return {
      /**
       * Retrieves a translation string for a given key based on the current language.
       * @param {string} key - The key of the translation string to retrieve.
       * @returns {string} The translated string, or the key itself if no translation is found.
       */
      getTranslation: (key) =>
        Config.TRANSLATIONS[State.get("currentLang")]?.[key] || key,
      /**
       * Formats a number into a compact, human-readable string (e.g., 1.2K, 5M).
       * @param {number} count - The number to format.
       * @returns {string} The formatted string representation of the number.
       */
      formatCount: (count) => {
        count = Number(count) || 0;
        if (count >= 1000000)
          return (count / 1000000).toFixed(1).replace(".0", "") + "M";
        if (count >= 1000)
          return (count / 1000).toFixed(1).replace(".0", "") + "K";
        return String(count);
      },
      fixProtocol: (url) => {
        if (!url) return url;
        try {
          if (window.location.protocol === "https:") {
            const urlObj = new URL(url, window.location.origin);
            if (urlObj.protocol === "http:") {
              urlObj.protocol = "https:";
              return urlObj.toString();
            }
          }
        } catch (e) {
          /* Invalid URL, return as is */
        }
        return url;
      },
      toRelativeIfSameOrigin: (url) => {
        if (!url) return url;
        try {
          const urlObj = new URL(url, window.location.origin);
          if (urlObj.origin === window.location.origin) {
            return urlObj.pathname + urlObj.search + urlObj.hash;
          }
        } catch (e) {
          /* Invalid URL, return as is */
        }
        return url;
      },
      vibrateTry: (ms = 35) => {
        if (navigator.vibrate) {
          try {
            navigator.vibrate(ms);
          } catch (e) {}
        }
      },
      recordUserGesture: () => {
        State.set("lastUserGestureTimestamp", Date.now());
      },
      setAppHeightVar: () => {
        document.documentElement.style.setProperty(
          "--app-height",
          `${window.innerHeight}px`,
        );
      },
    };
  })();

  /**
   * ==========================================================================
   * 4. API MODULE
   * ==========================================================================
   */
  const API = (function () {
    /**
     * A private helper function to send AJAX requests to the backend.
     * @param {string} action - The WordPress AJAX action to call.
     * @param {Object} [data={}] - An object containing data to send with the request.
     * @returns {Promise<Object>} A promise that resolves with the JSON response from the server.
     */
    async function _request(action, data = {}) {
      try {
        const body = new URLSearchParams({
          action,
          nonce: ajax_object.nonce,
          ...data,
        });
        const response = await fetch(ajax_object.ajax_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          credentials: "same-origin",
          body,
        });
        if (!response.ok)
          throw new Error(`Server responded with ${response.status}`);
        const json = await response.json();
        if (json.new_nonce) ajax_object.nonce = json.new_nonce;
        return json;
      } catch (error) {
        console.error(`API Client Error for action "${action}":`, error);
        return { success: false, data: { message: error.message } };
      }
    }

    function findCommentById(comments, commentId) {
      if (!comments || !commentId) return null;
      return comments.find((c) => c.id === commentId) || null;
    }

    return {
      login: (data) => _request("tt_ajax_login", data),
      logout: () => _request("tt_ajax_logout"),
      toggleLike: (postId) => _request("toggle_like", { post_id: postId }),
      refreshNonce: async () => {
        const json = await _request("tt_refresh_nonce");
        if (json.success && json.nonce) ajax_object.nonce = json.nonce;
        else console.error("Failed to refresh nonce.", json);
      },
      fetchSlidesData: () => _request("tt_get_slides_data_ajax"),
      /**
       * Fetches the comments for a specific slide.
       * @param {string} slideId - The ID of the slide to fetch comments for.
       * @returns {Promise<Object>} A promise that resolves with the comments data.
       */
      fetchComments: async (slideId) => {
        const response = await _request("tt_get_comments", {
          slide_id: slideId,
        });

        if (response.success) {
          return response;
        } else {
          // MOCK: Simulate API delay
          console.warn("AJAX tt_get_comments failed, using mock fallback.");
          await new Promise((resolve) => setTimeout(resolve, 300));
          const slide = slidesData.find((s) => s.id === slideId);
          if (slide && slide.comments) {
            return { success: true, data: slide.comments };
          }
          return { success: false, data: { message: "Comments not found." } };
        }
      },
/**
 * Posts a new comment to a specific slide.
 * @param {string} slideId - The ID of the slide to post the comment to.
 * @param {string} text - The content of the comment.
 * @param {string|null} [parentId=null] - The ID of the parent comment if this is a reply.
 * @returns {Promise<Object>} A promise that resolves with the newly created comment data.
 */
      postComment: async (slideId, text, parentId = null) => {
        const response = await _request("tt_post_comment", {
          slide_id: slideId,
          text,
          parent_id: parentId,
        });

        if (response.success) {
          return response;
        } else {
          // MOCK FALLBACK
          console.warn("AJAX tt_post_comment failed, using mock fallback.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          const slide = slidesData.find((s) => s.id === slideId);
          if (!slide) {
            return { success: false, data: { message: "Slide not found." } };
          }

          const newComment = {
            id: `c${slide.id}-${Date.now()}`,
            parentId: parentId,
            user: "Ja (Ty)", // Mocked user
            avatar: "https://i.pravatar.cc/100?u=99", // Mocked avatar
            text: text,
            timestamp: new Date().toISOString(),
            likes: 0,
            isLiked: false,
            canEdit: true,
          };

          slide.comments.push(newComment);
          slide.initialComments = slide.comments.length;

          return { success: true, data: newComment };
        }
      },
/**
 * Edits an existing comment.
 * @param {string} slideId - The ID of the slide the comment belongs to.
 * @param {string} commentId - The ID of the comment to edit.
 * @param {string} newText - The new text content for the comment.
 * @returns {Promise<Object>} A promise that resolves with the updated comment data.
 */
      editComment: async (slideId, commentId, newText) => {
        const response = await _request("tt_edit_comment", {
          slide_id: slideId,
          comment_id: commentId,
          text: newText,
        });

        if (response.success) {
          return response;
        } else {
          // MOCK FALLBACK
          console.warn("AJAX tt_edit_comment failed, using mock fallback.");
          await new Promise((resolve) => setTimeout(resolve, 300));
          const slide = slidesData.find((s) => s.id === slideId);
          if (!slide)
            return { success: false, data: { message: "Slide not found." } };
          const comment = findCommentById(slide.comments, commentId);
          if (!comment)
            return { success: false, data: { message: "Comment not found." } };

          comment.text = newText;
          return { success: true, data: comment };
        }
      },

/**
 * Deletes a comment.
 * @param {string} slideId - The ID of the slide the comment belongs to.
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<Object>} A promise that resolves with a success status.
 */
      deleteComment: async (slideId, commentId) => {
        const response = await _request("tt_delete_comment", {
          slide_id: slideId,
          comment_id: commentId,
        });

        if (response.success) {
          return response;
        } else {
          // MOCK FALLBACK
          console.warn("AJAX tt_delete_comment failed, using mock fallback.");
          await new Promise((resolve) => setTimeout(resolve, 300));
          const slide = slidesData.find((s) => s.id === slideId);
          if (!slide)
            return { success: false, data: { message: "Slide not found." } };

          const commentIndex = slide.comments.findIndex(
            (c) => c.id === commentId,
          );
          if (commentIndex === -1)
            return { success: false, data: { message: "Comment not found." } };

          slide.comments.splice(commentIndex, 1);
          slide.initialComments = slide.comments.length;

          return { success: true };
        }
      },
/**
 * Toggles the like status of a comment.
 * @param {string} slideId - The ID of the slide the comment belongs to.
 * @param {string} commentId - The ID of the comment to like/unlike.
 * @returns {Promise<Object>} A promise that resolves with the new like status and count.
 */
      toggleCommentLike: async (slideId, commentId) => {
        const response = await _request("tt_toggle_comment_like", {
          slide_id: slideId,
          comment_id: commentId,
        });

        if (response.success) {
          return response;
        } else {
          // MOCK FALLBACK
          console.warn(
            "AJAX tt_toggle_comment_like failed, using mock fallback.",
          );
          await new Promise((resolve) => setTimeout(resolve, 200));
          const slide = slidesData.find((s) => s.id === slideId);
          if (!slide)
            return { success: false, data: { message: "Slide not found." } };

          const comment = findCommentById(slide.comments, commentId);
          if (!comment)
            return { success: false, data: { message: "Comment not found." } };

          comment.isLiked = !comment.isLiked;
          comment.likes += comment.isLiked ? 1 : -1;

          return {
            success: true,
            data: { isLiked: comment.isLiked, likes: comment.likes },
          };
        }
      },
    };
  })();

  /**
   * ==========================================================================
   * 5. UI MODULE
   * ==========================================================================
   */
  const UI = (function () {
    const DOM = {
      container: document.getElementById("webyx-container"),
      template: document.getElementById("slide-template"),
      preloader: document.getElementById("preloader"),
      alertBox: document.getElementById("alertBox"),
      alertText: document.getElementById("alertText"),
      commentsModal: document.getElementById("commentsModal"),
      accountModal: document.getElementById("accountModal"),
      tiktokProfileModal: document.getElementById("tiktok-profile-modal"),
      notificationPopup: document.getElementById("notificationPopup"),
      pwaDesktopModal: document.getElementById("pwa-desktop-modal"),
      pwaInstallPrompt: document.getElementById("pwaInstallPrompt"),
      pwaIosInstructions: document.getElementById("pwa-ios-instructions"),
      pwaDesktopInstallButton: document.querySelector(
        ".topbar-icon-btn.desktop-only",
      ),
      toastNotification: document.getElementById("toast-notification"),
      welcomeModal: document.getElementById("welcome-modal"),
    };
    let alertTimeout;
    let toastTimeout;

    function showToast(message) {
        if (!DOM.toastNotification) return;
        clearTimeout(toastTimeout);
        DOM.toastNotification.textContent = message;
        DOM.toastNotification.classList.add("visible");
        toastTimeout = setTimeout(() => {
            DOM.toastNotification.classList.remove("visible");
        }, 3000);
    }

    function showAlert(message, isError = false) {
      if (!DOM.alertBox || !DOM.alertText) return;
      clearTimeout(alertTimeout);
      DOM.alertBox.style.animation = "none";
      requestAnimationFrame(() => {
        DOM.alertBox.style.animation = "";
        DOM.alertText.textContent = message;
        DOM.alertBox.style.backgroundColor = isError
          ? "var(--accent-color)"
          : "rgba(0, 0, 0, 0.85)";
        DOM.alertBox.classList.add("visible");
      });
      alertTimeout = setTimeout(
        () => DOM.alertBox.classList.remove("visible"),
        3000,
      );
    }

    function getFocusable(node) {
      if (!node) return [];
      return Array.from(
        node.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function trapFocus(modal) {
      const focusable = getFocusable(modal);
      if (focusable.length === 0) return () => {};
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const handleKeyDown = (e) => {
        if (e.key !== "Tab") return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      };
      modal.addEventListener("keydown", handleKeyDown);
      return () => modal.removeEventListener("keydown", handleKeyDown);
    }

    function openModal(modal) {
      State.set("lastFocusedElement", document.activeElement);
      DOM.container.setAttribute("aria-hidden", "true");
      modal.classList.add("visible");
      modal.setAttribute("aria-hidden", "false");
      const focusable = getFocusable(modal);
      (focusable.length > 0
        ? focusable[0]
        : modal.querySelector(".modal-content")
      )?.focus();
      modal._focusTrapDispose = trapFocus(modal);
    }

    function closeModal(modal) {
      if (!modal) return;

      const modalContent = modal.querySelector(
        ".modal-content, .tiktok-profile-content, .account-modal-content",
      );
      const isAnimated =
        modalContent &&
        (modal.id === "tiktok-profile-modal" ||
          modal.id === "commentsModal" ||
          modal.id === "accountModal");

      if (isAnimated) {
        if (modal.classList.contains("is-hiding")) return;

        let cleanedUp = false;
        const cleanup = () => {
          if (cleanedUp) return;
          cleanedUp = true;

          modalContent.removeEventListener("transitionend", cleanup);

          modal.classList.remove("visible", "is-hiding");

          if (modal._focusTrapDispose) {
            modal._focusTrapDispose();
            delete modal._focusTrapDispose;
          }
          DOM.container.removeAttribute("aria-hidden");
          State.get("lastFocusedElement")?.focus();
        };

        const timeoutId = setTimeout(cleanup, 500);

        modalContent.addEventListener(
          "transitionend",
          () => {
            clearTimeout(timeoutId);
            cleanup();
          },
          { once: true },
        );

        modal.classList.add("is-hiding");
        modal.setAttribute("aria-hidden", "true");
      } else {
        // Fallback for other modals
        modal.classList.remove("visible");
        modal.setAttribute("aria-hidden", "true");
        if (modal._focusTrapDispose) {
          modal._focusTrapDispose();
          delete modal._focusTrapDispose;
        }
        DOM.container.removeAttribute("aria-hidden");
        State.get("lastFocusedElement")?.focus();
      }
    }

    function updateLikeButtonState(likeButton, liked, count) {
      if (!likeButton) return;
      const likeCountEl = likeButton.querySelector(".like-count");
      likeButton.classList.toggle("active", liked);
      likeButton.setAttribute("aria-pressed", String(liked));
      if (likeCountEl) {
        likeCountEl.textContent = Utils.formatCount(count);
        likeCountEl.dataset.rawCount = String(count);
      }
      const translationKey = liked
        ? "unlikeAriaLabelWithCount"
        : "likeAriaLabelWithCount";
      const label = Utils.getTranslation(translationKey).replace(
        "{count}",
        Utils.formatCount(count),
      );
      likeButton.setAttribute("aria-label", label);
    }

    function applyLikeStateToDom(likeId, liked, count) {
      document
        .querySelectorAll(`.like-button[data-like-id="${likeId}"]`)
        .forEach((btn) => updateLikeButtonState(btn, liked, count));
    }

    function updateUIForLoginState() {
      UI.updateCommentFormVisibility();
      const isLoggedIn = State.get("isUserLoggedIn");
      const currentSlideIndex = State.get("currentSlideIndex");

      // Update global UI elements
      const topbar = document.querySelector("#app-frame > .topbar");
      const loginPanel = document.querySelector("#app-frame > .login-panel");
      const loggedInMenu = document.querySelector(
        "#app-frame > .logged-in-menu",
      );

      if (topbar) {
        topbar
          .querySelector(".central-text-wrapper")
          .classList.toggle("with-arrow", !isLoggedIn);
        topbar.querySelector(".topbar-text").textContent = isLoggedIn
          ? "Ting Tong"
          : Utils.getTranslation("loggedOutText");
        topbar.classList.remove("login-panel-active");
      }
      if (loginPanel) {
        loginPanel.classList.remove("active");
      }
      if (loggedInMenu) {
        loggedInMenu.classList.remove("active");
      }

      // Update per-slide elements
      DOM.container.querySelectorAll(".webyx-section").forEach((section) => {
        const sim = section.querySelector(".tiktok-symulacja");
        sim.classList.toggle("is-logged-in", isLoggedIn);
        const isSecret = sim.dataset.access === "secret";
        const isPwaOnly = sim.dataset.access === "pwa";
        const isStandalone = () =>
          window.matchMedia("(display-mode: standalone)").matches;

        const showSecretOverlay =
          (isSecret && !isLoggedIn) || (isPwaOnly && !isStandalone());

        const secretOverlay = section.querySelector(".secret-overlay");
        if (secretOverlay) {
          secretOverlay.classList.toggle("visible", showSecretOverlay);
        }

        if (showSecretOverlay) {
          const titleKey = isPwaOnly ? "pwaTitle" : "secretTitle";
          const subtitleActionKey = isPwaOnly
            ? "pwaSubtitleAction"
            : "secretSubtitleAction";
          const subtitleRestKey = isPwaOnly
            ? "pwaSubtitleRest"
            : "secretSubtitleRest";

          section.querySelector(".secret-title").textContent =
            Utils.getTranslation(titleKey);

          const subtitleUElement = section.querySelector(".secret-subtitle u");
          const subtitleSpanElement = section.querySelector(
            ".secret-subtitle span",
          );

          if (subtitleUElement && subtitleSpanElement) {
            // The data-action attribute is used by the global mainClickHandler
            // to trigger the correct action when this element is clicked.
            subtitleUElement.dataset.action = isPwaOnly
              ? "install-pwa"
              : "toggle-login-panel";
            subtitleUElement.dataset.translateKey = subtitleActionKey;
            subtitleUElement.textContent =
              Utils.getTranslation(subtitleActionKey);
            subtitleSpanElement.dataset.translateKey = subtitleRestKey;
            subtitleSpanElement.textContent =
              Utils.getTranslation(subtitleRestKey);
          }
        }

        const likeBtn = section.querySelector(".like-button");
        if (likeBtn) {
          const slide = slidesData.find(
            (s) => String(s.likeId) === String(likeBtn.dataset.likeId),
          );
          if (slide) {
            updateLikeButtonState(
              likeBtn,
              !!(slide.isLiked && isLoggedIn),
              Number(slide.initialLikes || 0),
            );
          }
        }
      });
    }

    function updateTranslations() {
      const lang = State.get("currentLang");
      document.documentElement.lang = lang;

      document.querySelectorAll("[data-translate-key]").forEach((el) => {
        el.textContent = Utils.getTranslation(el.dataset.translateKey);
      });
      document.querySelectorAll("[data-translate-aria-label]").forEach((el) => {
        el.setAttribute(
          "aria-label",
          Utils.getTranslation(el.dataset.translateAriaLabel),
        );
      });
      document.querySelectorAll("[data-translate-title]").forEach((el) => {
        el.setAttribute(
          "title",
          Utils.getTranslation(el.dataset.translateTitle),
        );
      });
      document
        .querySelectorAll("[data-translate-placeholder]")
        .forEach((el) => {
          el.setAttribute(
            "placeholder",
            Utils.getTranslation(el.dataset.translatePlaceholder),
          );
        });

      // Handle composite elements
      const sortTrigger = document.querySelector(".sort-trigger");
      if (sortTrigger) {
        const sortOrder = State.get("commentSortOrder");
        const currentSortText = Utils.getTranslation(
          sortOrder === "popular" ? "commentSortBest" : "commentSortNewest",
        );
        sortTrigger.innerHTML = `${Utils.getTranslation("commentSortTriggerText")}<span class="current-sort">${currentSortText}</span> ▼`;
      }

      const loginPrompt = document.querySelector(".login-to-comment-prompt p");
      if (loginPrompt) {
        loginPrompt.innerHTML = `<a href="#" data-action="toggle-login-panel" data-translate-key="loginToCommentAction">${Utils.getTranslation("loginToCommentAction")}</a><span data-translate-key="loginToCommentRest">${Utils.getTranslation("loginToCommentRest")}</span>`;
      }

      updateUIForLoginState();
    }

    function createSlideElement(slideData, index) {
      const slideFragment = DOM.template.content.cloneNode(true);
      const section = slideFragment.querySelector(".webyx-section");
      section.dataset.index = index;
      section.dataset.slideId = slideData.id;

      if (slideData.isIframe) {
        const tiktokSymulacja = section.querySelector(".tiktok-symulacja");
        const videoEl = tiktokSymulacja.querySelector("video");
        if (videoEl) videoEl.remove();
        const pauseOverlay = tiktokSymulacja.querySelector(".pause-overlay");
        if (pauseOverlay) pauseOverlay.remove();
        const secretOverlay = tiktokSymulacja.querySelector(".secret-overlay");
        if (secretOverlay) secretOverlay.remove();
        const errorOverlay = tiktokSymulacja.querySelector(".error-overlay");
        if (errorOverlay) errorOverlay.remove();

        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.src = slideData.iframeUrl;
        iframe.frameBorder = "0";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        tiktokSymulacja.prepend(iframe);
      } else if (slideData.mp4Url) {
        const videoEl = section.querySelector("video");
        if (videoEl) {
          videoEl.src = slideData.mp4Url;
        }
      }

      section.querySelector(".tiktok-symulacja").dataset.access =
        slideData.access;
      section.querySelector(".profileButton img").src = slideData.avatar;
      section.querySelector(".text-user").textContent = slideData.user;
      section.querySelector(".text-description").textContent =
        slideData.description;

      const likeBtn = section.querySelector(".like-button");
      likeBtn.dataset.likeId = slideData.likeId;
      updateLikeButtonState(likeBtn, slideData.isLiked, slideData.initialLikes);

      const commentsBtn = section.querySelector(".commentsButton");
      const commentsCountEl = commentsBtn.querySelector(".comment-count");
      commentsCountEl.textContent = Utils.formatCount(
        slideData.initialComments,
      );

      const tiktokSymulacja = section.querySelector(".tiktok-symulacja");
      const videoEl = section.querySelector("video");
      const pauseOverlay = section.querySelector(".pause-overlay");

      if (tiktokSymulacja && videoEl && pauseOverlay) {
        tiktokSymulacja.addEventListener("click", (e) => {
          // Upewnij się, że kliknięcie nie pochodzi z paska bocznego lub dolnego
          if (e.target.closest(".sidebar, .bottombar, .secret-overlay")) {
            return;
          }
          if (videoEl.paused) {
            // Wznów odtwarzanie i ukryj nakładkę
            videoEl
              .play()
              .catch((error) => console.log("Błąd odtwarzania:", error));
            pauseOverlay.classList.remove("visible");
          } else {
            // Spauzuj wideo i pokaż nakładkę z ikoną play
            videoEl.pause();
            pauseOverlay.classList.add("visible");
          }
        });
      }
      const progressBar = section.querySelector(".progress-bar");
      const progressBarFill = section.querySelector(".progress-bar-fill");

      if (videoEl) {
        videoEl.addEventListener(
          "playing",
          () => {
            tiktokSymulacja.classList.add("video-loaded");
          },
          { once: true },
        );
      }

      if (videoEl && progressBar && progressBarFill) {
        const handle = section.querySelector(".progress-bar-handle");
        let isDragging = false;

        const updateProgress = () => {
          if (isDragging || !videoEl.duration) return;
          const progress = (videoEl.currentTime / videoEl.duration) * 100;
          progressBarFill.style.width = `${progress}%`;
          if (handle) handle.style.left = `${progress}%`;
        };

        const seek = (e) => {
          const rect = progressBar.getBoundingClientRect();
          const clickX =
            (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
          const width = rect.width;
          const progress = Math.max(0, Math.min(1, clickX / width));

          if (videoEl.duration > 0) {
            videoEl.currentTime = progress * videoEl.duration;
            progressBarFill.style.width = `${progress * 100}%`;
            if (handle) handle.style.left = `${progress * 100}%`;
          }
        };

        videoEl.addEventListener("timeupdate", updateProgress);

        const startDrag = (e) => {
          if (e.type === "touchstart") {
            e.preventDefault();
          }
          isDragging = true;
          progressBar.classList.add("dragging");
          const wasPlaying = !videoEl.paused;
          videoEl.pause();

          seek(e);

          const onDrag = (moveEvent) => {
            if (!isDragging) return;
            moveEvent.preventDefault();
            seek(moveEvent);
          };

          const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            progressBar.classList.remove("dragging");
            if (wasPlaying) {
              videoEl.play().catch((err) => {
                console.error("Play failed after drag:", err);
              });
            }
            document.removeEventListener("mousemove", onDrag);
            document.removeEventListener("mouseup", endDrag);
            document.removeEventListener("touchmove", onDrag, {
              passive: false,
            });
            document.removeEventListener("touchend", endDrag);
          };

          document.addEventListener("mousemove", onDrag);
          document.addEventListener("mouseup", endDrag);
          document.addEventListener("touchmove", onDrag, { passive: false });
          document.addEventListener("touchend", endDrag);
        };

        progressBar.addEventListener("mousedown", startDrag);
        progressBar.addEventListener("touchstart", startDrag, {
          passive: false,
        });
      }

      return section;
    }

    function renderSlides() {
      const wrapper = DOM.container.querySelector(".swiper-wrapper");
      if (!wrapper) return;
      wrapper.innerHTML = "";
      if (slidesData.length === 0) return;

      slidesData.forEach((data, index) => {
        const slideElement = createSlideElement(data, index);
        wrapper.appendChild(slideElement);
      });
    }

    function initGlobalPanels() {
      // This function is now empty as the form is hardcoded in index.html
    }

    function populateProfileModal(slideData) {
      if (!slideData || !DOM.tiktokProfileModal) return;

      // Basic info
      const atUsername = `@${slideData.user
        .toLowerCase()
        .replace(/\s/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")}`;
      DOM.tiktokProfileModal.querySelector("#tiktok-profile-avatar").src =
        slideData.avatar;
      DOM.tiktokProfileModal.querySelector(
        "#tiktok-profile-username",
      ).textContent = atUsername;
      DOM.tiktokProfileModal.querySelector(
        "#tiktok-profile-nickname",
      ).textContent = slideData.user;
      DOM.tiktokProfileModal.querySelector(
        "#tiktok-profile-at-username",
      ).textContent = atUsername;
      DOM.tiktokProfileModal.querySelector("#tiktok-profile-bio").textContent =
        `To jest bio użytkownika ${slideData.user}.\nOdkryj więcej! ✨`;

      // Stats
      DOM.tiktokProfileModal.querySelector(
        "#tiktok-following-count",
      ).textContent = Math.floor(Math.random() * 500);
      DOM.tiktokProfileModal.querySelector(
        "#tiktok-followers-count",
      ).textContent = Utils.formatCount(Math.floor(Math.random() * 5000000));
      DOM.tiktokProfileModal.querySelector("#tiktok-likes-count").textContent =
        Utils.formatCount(slideData.initialLikes * 3.5); // Mock total likes

      // Video Grid (mock data)
      const videoGrid = DOM.tiktokProfileModal.querySelector("#videos-grid");
      videoGrid.innerHTML = ""; // Clear previous
      for (let i = 1; i <= 9; i++) {
        const thumb = document.createElement("div");
        thumb.className = "video-thumbnail";
        thumb.innerHTML = `
                        <img src="https://picsum.photos/200/280?random=${slideData.id}-${i}" alt="Miniatura filmu">
                        <div class="video-views">
                            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                            ${Utils.formatCount(Math.floor(Math.random() * 3000000))}
                        </div>
                    `;
        videoGrid.appendChild(thumb);
      }
    }

    function renderComments(comments) {
      const modalBody = DOM.commentsModal.querySelector(".modal-body");
      if (!modalBody) return;

      modalBody.innerHTML = "";

      if (!comments || comments.length === 0) {
        modalBody.innerHTML =
          '<p class="no-comments-message" data-translate-key="noComments">Brak komentarzy. Bądź pierwszy!</p>';
        return;
      }

      const commentList = document.createElement("div");
      commentList.className = "comments-list";

      const repliesMap = new Map();
      comments.forEach((comment) => {
        if (comment.parentId) {
          if (!repliesMap.has(comment.parentId)) {
            repliesMap.set(comment.parentId, []);
          }
          repliesMap.get(comment.parentId).push(comment);
        }
      });

      const createCommentElement = (comment) => {
        const commentEl = document.createElement("div");
        commentEl.className = "comment-item";
        commentEl.dataset.commentId = comment.id;

        const avatarWrapper = document.createElement("div");
        avatarWrapper.className = "comment-avatar-wrapper";
        const avatarImg = document.createElement("img");
        avatarImg.src = comment.avatar;
        avatarImg.alt = "Avatar";
        avatarImg.className = "comment-avatar";
        avatarImg.loading = "lazy";
        avatarWrapper.appendChild(avatarImg);

        const main = document.createElement("div");
        main.className = "comment-main";

        const body = document.createElement("div");
        body.className = "comment-body";
        const userSpan = document.createElement("span");
        userSpan.className = "comment-user";
        userSpan.textContent = comment.user;
        const textP = document.createElement("p");
        textP.className = "comment-text";
        textP.textContent = comment.text;
        body.appendChild(userSpan);
        body.appendChild(textP);

        const footer = document.createElement("div");
        footer.className = "comment-footer";
        const timestampSpan = document.createElement("span");
        timestampSpan.className = "comment-timestamp";
        timestampSpan.textContent = new Date(
          comment.timestamp,
        ).toLocaleString();
        const replyBtn = document.createElement("button");
        replyBtn.className = "comment-action-btn comment-reply-btn";
        replyBtn.dataset.action = "reply-to-comment";
        replyBtn.textContent = Utils.getTranslation("commentReplyAction");

        const actionsWrapper = document.createElement("div");
        actionsWrapper.className = "comment-actions-wrapper";
        actionsWrapper.appendChild(replyBtn);

        if (comment.canEdit) {
          const editBtn = document.createElement("button");
          editBtn.className = "comment-action-btn comment-edit-btn";
          editBtn.dataset.action = "edit-comment";
          editBtn.textContent = Utils.getTranslation("commentEditAction");

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "comment-action-btn comment-delete-btn";
          deleteBtn.dataset.action = "delete-comment";
          deleteBtn.textContent = Utils.getTranslation("commentDeleteAction");

          actionsWrapper.appendChild(editBtn);
          actionsWrapper.appendChild(deleteBtn);
        }

        const likesDiv = document.createElement("div");
        likesDiv.className = "comment-likes";
        const likeBtn = document.createElement("button");
        likeBtn.className = `comment-like-btn ${comment.isLiked ? "active" : ""}`;
        likeBtn.dataset.action = "toggle-comment-like";
        likeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        const likeCountSpan = document.createElement("span");
        likeCountSpan.className = "comment-like-count";
        likeCountSpan.textContent = Utils.formatCount(comment.likes);
        likesDiv.appendChild(likeBtn);
        likesDiv.appendChild(likeCountSpan);

        footer.appendChild(timestampSpan);
        footer.appendChild(actionsWrapper);
        footer.appendChild(likesDiv);

        main.appendChild(body);
        main.appendChild(footer);

        commentEl.appendChild(avatarWrapper);
        commentEl.appendChild(main);

        return commentEl;
      };

      const topLevelComments = comments.filter((c) => !c.parentId);

      topLevelComments.forEach((comment) => {
        const threadWrapper = document.createElement("div");
        threadWrapper.className = "comment-thread";

        const parentEl = createCommentElement(comment);
        threadWrapper.appendChild(parentEl);

        const commentReplies = repliesMap.get(comment.id);
        if (commentReplies && commentReplies.length > 0) {
          const repliesContainer = document.createElement("div");
          repliesContainer.className = "comment-replies";

          commentReplies.forEach((reply) => {
            const replyEl = createCommentElement(reply);
            repliesContainer.appendChild(replyEl);
          });

          const toggleBtn = document.createElement("button");
          toggleBtn.className = "toggle-replies-btn";
          const updateToggleText = () => {
            const isVisible = repliesContainer.classList.contains("visible");
            const key = isVisible ? "toggleRepliesHide" : "toggleRepliesShow";
            const text = Utils.getTranslation(key).replace(
              "{count}",
              commentReplies.length,
            );
            toggleBtn.innerHTML = `<span class="arrow"></span> ${text}`;
          };

          toggleBtn.addEventListener("click", () => {
            repliesContainer.classList.toggle("visible");
            toggleBtn.classList.toggle("expanded");
            updateToggleText();
          });

          updateToggleText(); // Set initial text

          // Insert the toggle button after the parent comment's main content
          parentEl.querySelector(".comment-main").appendChild(toggleBtn);
          threadWrapper.appendChild(repliesContainer);
        }
        commentList.appendChild(threadWrapper);
      });

      modalBody.appendChild(commentList);
    }

    function updateCommentFormVisibility() {
      const isLoggedIn = State.get("isUserLoggedIn");
      const form = document.getElementById("comment-form");
      const prompt = document.querySelector(".login-to-comment-prompt");

      if (form && prompt) {
        if (isLoggedIn) {
          form.style.display = "flex";
          prompt.style.display = "none";
        } else {
          form.style.display = "none";
          prompt.style.display = "block";
        }
      }
    }

    function initKeyboardListener() {
      if (!("visualViewport" in window)) {
        return;
      }

      const commentsModal = DOM.commentsModal;
      if (!commentsModal) return;

      const handleViewportResize = () => {
        // Use the layout viewport height as the stable reference
        const layoutViewportHeight = document.documentElement.clientHeight;
        const visualViewportHeight = window.visualViewport.height;

        // A significant difference implies the keyboard is visible.
        const keyboardHeight = layoutViewportHeight - visualViewportHeight;
        const isKeyboardVisible = keyboardHeight > 150;

        commentsModal.classList.toggle("keyboard-visible", isKeyboardVisible);

        // The offset is simply the calculated height of the keyboard.
        commentsModal.style.setProperty(
          "--keyboard-offset",
          `${keyboardHeight}px`,
        );
      };

      window.visualViewport.addEventListener("resize", handleViewportResize);
    }

    return {
      DOM,
      showAlert,
      openModal,
      closeModal,
      updateUIForLoginState,
      updateTranslations,
      applyLikeStateToDom,
      createSlideElement,
      renderSlides,
      initGlobalPanels,
      populateProfileModal,
      renderComments,
      updateCommentFormVisibility,
      initKeyboardListener,
      showToast,
    };
  })();

  /**
   * ==========================================================================
   * PWA MODULE
   * ==========================================================================
   */
  const PWA = (function () {
    // DOM Elements
    const installBar = document.getElementById("pwa-install-bar");
    const installButton = document.getElementById("pwa-install-button");
    const iosInstructions = document.getElementById("pwa-ios-instructions");
    const iosCloseButton = document.getElementById("pwa-ios-close-button");
    const desktopModal = document.getElementById("pwa-desktop-modal");

    // Predicates
    const isIOS = () => {
      if (typeof window === "undefined" || !window.navigator) return false;
      return (
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    };
    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    const isDesktop = () => !isIOS() && !/Android/i.test(navigator.userAgent);

    // State
    let installPromptEvent = null;
    let isAppInstalled = isStandalone(); // Initialize state

    // Actions
    function showIosInstructions() {
      if (iosInstructions) iosInstructions.classList.add("visible");
    }

    function hideIosInstructions() {
      if (iosInstructions) iosInstructions.classList.remove("visible");
    }

    function updatePwaUiForInstalledState() {
      if (!installBar || !installButton) return;
    }

    function showDesktopModal() {
      if (desktopModal) UI.openModal(desktopModal);
    }

    function closePwaModals() {
      if (desktopModal && desktopModal.classList.contains("visible"))
        UI.closeModal(desktopModal);
      if (iosInstructions && iosInstructions.classList.contains("visible"))
        hideIosInstructions();
    }

    // Initialization
    function init() {
      // Always attach event listener to the install button.
      if (installButton) {
        installButton.addEventListener("click", handleInstallClick);
      }

      if (isStandalone()) {
        if (installBar) installBar.style.display = "none";
        updatePwaUiForInstalledState();
        return;
      }

      // For browsers that support `beforeinstallprompt` (like Chrome on Android)
      if ("onbeforeinstallprompt" in window) {
        window.addEventListener("beforeinstallprompt", (e) => {
          e.preventDefault();
          installPromptEvent = e;
          if (installButton) {
            installButton.disabled = false;
          }
        });

        window.addEventListener("appinstalled", () => {
          console.log("PWA was installed");
          installPromptEvent = null;
          isAppInstalled = true; // Set state
          updatePwaUiForInstalledState();
        });
      }

      // Attach other event listeners
      if (iosCloseButton) {
        iosCloseButton.addEventListener("click", hideIosInstructions);
      }
    }

    function handleInstallClick() {
      // Check if the app is already installed and show an alert.
      if (isAppInstalled) {
        UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
        return;
      }

      if (installPromptEvent) {
        installPromptEvent.prompt();
        installPromptEvent.userChoice.then((choiceResult) => {
          console.log(`PWA prompt user choice: ${choiceResult.outcome}`);
          if (choiceResult.outcome === "accepted") {
            // The 'appinstalled' event will handle the UI change.
          } else {
            // User dismissed the prompt, do nothing.
          }
        });
      } else if (isIOS()) {
        // On iOS, we show instructions.
        showIosInstructions();
      } else if (isDesktop()) {
        showDesktopModal();
      } else {
        // If not on iOS and there's no prompt, the app is likely installed.
        UI.showAlert(Utils.getTranslation("alreadyInstalledText"));
      }
    }

    return { init, handleInstallClick, closePwaModals, isStandalone };
  })();

  /**
   * ==========================================================================
   * 7. EVENT HANDLERS & NOTIFICATIONS
   * ==========================================================================
   */
  const Handlers = (function () {
    function mockToggleLogin() {
      const isLoggedIn = State.get("isUserLoggedIn");
      State.set("isUserLoggedIn", !isLoggedIn);
      UI.updateUIForLoginState();
      const message = !isLoggedIn
        ? Utils.getTranslation("loginSuccess")
        : Utils.getTranslation("logoutSuccess");
      UI.showAlert(message);

      // If we are logging in, close the panel
      if (!isLoggedIn) {
        const loginPanel = document.querySelector("#app-frame > .login-panel");
        if (loginPanel) loginPanel.classList.remove("active");
        const topbar = document.querySelector("#app-frame > .topbar");
        if (topbar) topbar.classList.remove("login-panel-active");
      }
    }

    function handleNotificationClick(event) {
      const item = event.target.closest(".notification-item");
      if (!item) return;

      item.classList.toggle("expanded");
      item.setAttribute("aria-expanded", item.classList.contains("expanded"));

      if (item.classList.contains("unread")) {
        item.classList.remove("unread");
      }
    }

    async function handleLogout(link) {
      if (link.disabled) return;
      link.disabled = true;
      await API.refreshNonce(); // Odśwież nonce PRZED wylogowaniem
      const json = await API.logout();
      if (json.success) {
        State.set("isUserLoggedIn", false);
        UI.showAlert(Utils.getTranslation("logoutSuccess"));
        slidesData.forEach((slide) => (slide.isLiked = false));
        // Po udanym wylogowaniu nonce jest już nieważny, więc nie ma potrzeby go odświeżać ponownie
        // Jeśli będzie potrzebny nowy, zostanie pobrany przy następnej akcji.
        UI.updateUIForLoginState();
      } else {
        UI.showAlert(json.data?.message || "Logout failed.", true);
      }
      link.disabled = false;
    }

    async function handleLikeToggle(button) {
      if (!State.get("isUserLoggedIn")) {
        Utils.vibrateTry();
        UI.showAlert(Utils.getTranslation("likeAlert"));
        return;
      }
      const slideId = button.closest(".webyx-section")?.dataset.slideId;
      const slideData = slidesData.find((s) => s.id === slideId);
      if (!slideData) return;

      const isCurrentlyLiked = !!slideData.isLiked;
      const newLikedState = !isCurrentlyLiked;
      const currentCount = slideData.initialLikes;
      const newCount = newLikedState
        ? currentCount + 1
        : Math.max(0, currentCount - 1);

      // Optimistic UI update
      slideData.isLiked = newLikedState;
      slideData.initialLikes = newCount;
      UI.applyLikeStateToDom(slideData.likeId, newLikedState, newCount);
      button.disabled = true;

      const json = await API.toggleLike(slideData.likeId);

      if (json.success) {
        slideData.isLiked = json.data.status === "liked";
        slideData.initialLikes = json.data.count;
        UI.applyLikeStateToDom(
          slideData.likeId,
          slideData.isLiked,
          slideData.initialLikes,
        );
      } else {
        // Revert
        slideData.isLiked = isCurrentlyLiked;
        slideData.initialLikes = currentCount;
        UI.applyLikeStateToDom(
          slideData.likeId,
          isCurrentlyLiked,
          currentCount,
        );
        UI.showAlert(
          json.data?.message || Utils.getTranslation("likeError"),
          true,
        );
      }
      button.disabled = false;
    }

    function handleShare(button) {
      const section = button.closest(".webyx-section");
      const slideData = slidesData.find(
        (s) => s.id === section.dataset.slideId,
      );
      if (navigator.share && slideData) {
        navigator
          .share({
            title: Utils.getTranslation("shareTitle"),
            text: slideData.description,
            url: window.location.href,
          })
          .catch((err) => {
            if (err.name !== "AbortError") console.error("Share error:", err);
          });
      } else {
        navigator.clipboard
          .writeText(window.location.href)
          .then(() => UI.showAlert(Utils.getTranslation("linkCopied")));
      }
    }

    function handleLanguageToggle() {
      const newLang = State.get("currentLang") === "pl" ? "en" : "pl";
      State.set("currentLang", newLang);
      localStorage.setItem("tt_lang", newLang);
      UI.updateTranslations();
      Notifications.render();
    }

    return {
      handleNotificationClick,
      profileModalTabHandler: (e) => {
        const tab = e.target.closest(".tab");
        if (!tab) return;

        const modal = tab.closest("#tiktok-profile-modal");
        if (!modal) return;

        // Deactivate all tabs and galleries
        modal
          .querySelectorAll(".tab")
          .forEach((t) => t.classList.remove("active"));
        modal
          .querySelectorAll(".video-gallery")
          .forEach((g) => g.classList.remove("active"));

        // Activate clicked tab and corresponding gallery
        tab.classList.add("active");
        const contentId = tab.dataset.tabContent;
        const gallery = modal.querySelector(`#${contentId}`);
        if (gallery) {
          gallery.classList.add("active");
        }
      },
      mainClickHandler: (e) => {
        const target = e.target;
        const actionTarget = target.closest("[data-action]");

        // Handle comment-related actions first
        if (actionTarget && actionTarget.closest(".comment-item")) {
          const commentItem = actionTarget.closest(".comment-item");
          const commentId = commentItem.dataset.commentId;
          const slideId = document.querySelector(".swiper-slide-active")
            ?.dataset.slideId;

          if (!slideId || !commentId) return;

          switch (actionTarget.dataset.action) {
            case "toggle-comment-like": {
              const countEl = commentItem.querySelector(".comment-like-count");
              let currentLikes =
                parseInt(countEl.textContent.replace(/K|M/g, "")) || 0;

              actionTarget.classList.toggle("active");
              const isLiked = actionTarget.classList.contains("active");
              currentLikes += isLiked ? 1 : -1;
              countEl.textContent = Utils.formatCount(currentLikes);

              API.toggleCommentLike(slideId, commentId).then((response) => {
                if (!response.success) {
                  actionTarget.classList.toggle("active"); // Revert on failure
                  currentLikes += isLiked ? -1 : 1;
                  countEl.textContent = Utils.formatCount(currentLikes);
                  UI.showAlert(
                    Utils.getTranslation("failedToUpdateLike"),
                    true,
                  );
                }
              });
              break;
            }
            case "reply-to-comment": {
              const user =
                commentItem.querySelector(".comment-user")?.textContent;
              State.set("replyingToComment", commentId);

              const formContainer = document.querySelector(
                ".comment-form-container",
              );
              let replyContext = formContainer.querySelector(".reply-context");
              if (!replyContext) {
                replyContext = document.createElement("div");
                replyContext.className = "reply-context";
                formContainer.prepend(replyContext);
              }
              const cancelAriaLabel = Utils.getTranslation(
                "cancelReplyAriaLabel",
              );
              replyContext.innerHTML = `${Utils.getTranslation("replyingTo").replace("{user}", user)} <button class="cancel-reply-btn" data-action="cancel-reply" aria-label="${cancelAriaLabel}">&times;</button>`;
              replyContext.style.display = "block";

              document.querySelector("#comment-input").focus();
              break;
            }
            case "edit-comment": {
              const currentText =
                commentItem.querySelector(".comment-text").textContent;
              const newText = prompt(
                Utils.getTranslation("editCommentPrompt"),
                currentText,
              );

              if (newText && newText.trim() !== currentText) {
                API.editComment(slideId, commentId, newText.trim()).then(
                  (response) => {
                    if (response.success) {
                      commentItem.querySelector(".comment-text").textContent =
                        newText.trim();
                      UI.showAlert(
                        Utils.getTranslation("commentUpdateSuccess"),
                      );
                    } else {
                      UI.showAlert(
                        response.data?.message ||
                          Utils.getTranslation("commentUpdateError"),
                        true,
                      );
                    }
                  },
                );
              }
              break;
            }
            case "delete-comment": {
              if (confirm(Utils.getTranslation("deleteCommentConfirm"))) {
                API.deleteComment(slideId, commentId).then((response) => {
                  if (response.success) {
                    commentItem.style.transition = "opacity 0.3s ease-out";
                    commentItem.style.opacity = "0";
                    setTimeout(() => {
                      commentItem.remove();
                      // Update global comment count
                      const slideData = slidesData.find(
                        (s) => s.id === slideId,
                      );
                      if (slideData) {
                        const mainSlideCount = document.querySelector(
                          `.swiper-slide[data-slide-id="${slideId}"] .comment-count`,
                        );
                        if (mainSlideCount) {
                          mainSlideCount.textContent = Utils.formatCount(
                            slideData.initialComments,
                          );
                        }
                      }
                    }, 300);
                    UI.showAlert(Utils.getTranslation("commentDeleteSuccess"));
                  } else {
                    UI.showAlert(
                      response.data?.message ||
                        Utils.getTranslation("commentDeleteError"),
                      true,
                    );
                  }
                });
              }
              break;
            }
          }
          return; // Stop further processing
        }

        const sortTrigger = target.closest(".sort-trigger");
        if (sortTrigger) {
          sortTrigger.parentElement.classList.toggle("open");
          return;
        }

        const sortOption = target.closest(".sort-option");
        if (sortOption) {
          const dropdown = sortOption.closest(".sort-dropdown");
          const newSortOrder = sortOption.dataset.sort;
          if (State.get("commentSortOrder") === newSortOrder) {
            dropdown.classList.remove("open");
            return;
          }

          State.set("commentSortOrder", newSortOrder);
          UI.updateTranslations(); // This will now update the sort dropdown text
          dropdown
            .querySelectorAll(".sort-option")
            .forEach((opt) => opt.classList.remove("active"));
          sortOption.classList.add("active");
          dropdown.classList.remove("open");

          const slideId = document.querySelector(".swiper-slide-active")
            ?.dataset.slideId;
          if (slideId) {
            const modalBody = UI.DOM.commentsModal.querySelector(".modal-body");
            const commentsList = modalBody.querySelector(".comments-list");
            if (commentsList) {
              commentsList.style.opacity = "0.5";
              commentsList.style.transition = "opacity 0.2s ease-in-out";
            }

            API.fetchComments(slideId).then((response) => {
              if (response.success) {
                let comments = response.data;

                if (newSortOrder === "popular") {
                  comments.sort((a, b) => b.likes - a.likes);
                } else {
                  // newest
                  comments.sort(
                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
                  );
                }

                setTimeout(() => {
                  UI.renderComments(comments);
                }, 200);
              }
            });
          }
          return;
        }

        const replyBtn = target.closest(".comment-reply-btn");
        if (replyBtn) {
          const commentItem = replyBtn.closest(".comment-item");
          const commentId = commentItem?.dataset.commentId;
          const user = commentItem?.querySelector(".comment-user")?.textContent;

          State.set("replyingToComment", commentId);

          const formContainer = document.querySelector(
            ".comment-form-container",
          );
          let replyContext = formContainer.querySelector(".reply-context");
          if (!replyContext) {
            replyContext = document.createElement("div");
            replyContext.className = "reply-context";
            formContainer.prepend(replyContext);
          }
          const cancelAriaLabel = Utils.getTranslation("cancelReplyAriaLabel");
          replyContext.innerHTML = `${Utils.getTranslation("replyingTo").replace("{user}", user)} <button class="cancel-reply-btn" aria-label="${cancelAriaLabel}">&times;</button>`;
          replyContext.style.display = "block";

          document.querySelector("#comment-input").focus();
          return;
        }

        const cancelReplyBtn = target.closest(".cancel-reply-btn");
        if (cancelReplyBtn) {
          State.set("replyingToComment", null);
          const replyContext = document.querySelector(".reply-context");
          if (replyContext) replyContext.style.display = "none";
          return;
        }

        if (!actionTarget) {
          return;
        }

        const action = actionTarget.dataset.action;

        const topbar = document.querySelector("#app-frame > .topbar");
        const loginPanel = document.querySelector("#app-frame > .login-panel");
        const loggedInMenu = document.querySelector(
          "#app-frame > .logged-in-menu",
        );

        switch (action) {
          case "go-back":
            const modalToClose = actionTarget.closest(".modal-overlay");
            if (modalToClose) {
              UI.closeModal(modalToClose);
            }
            break;
          case "open-public-profile":
            if (!State.get("isUserLoggedIn")) {
              Utils.vibrateTry();
              UI.showAlert(Utils.getTranslation("profileViewAlert"));
              return;
            }
            const profileSection = actionTarget.closest(".webyx-section");
            if (profileSection) {
              const slideData = slidesData.find(
                (s) => s.id === profileSection.dataset.slideId,
              );
              if (slideData) {
                UI.populateProfileModal(slideData);
                UI.openModal(UI.DOM.tiktokProfileModal);
              }
            }
            break;
          case "toggle-like":
            handleLikeToggle(actionTarget);
            break;
          case "share":
            handleShare(actionTarget);
            break;
          case "toggle-language":
            handleLanguageToggle();
            break;
          case "open-comments-modal": {
            const slideId =
              actionTarget.closest(".webyx-section")?.dataset.slideId;
            if (slideId) {
              const slideData = slidesData.find((s) => s.id === slideId);
              if (slideData) {
              }

              // Show a loading state
              UI.DOM.commentsModal.querySelector(".modal-body").innerHTML =
                '<div class="loading-spinner"></div>';
              API.fetchComments(slideId).then((response) => {
                if (response.success) {
                  let comments = response.data;
                  const sortOrder = State.get("commentSortOrder");
                  if (sortOrder === "popular") {
                    comments.sort((a, b) => b.likes - a.likes);
                  } else {
                    // 'newest'
                    comments.sort(
                      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
                    );
                  }
                  UI.renderComments(comments);
                } else {
                  UI.renderComments([]); // Show empty state on error
                }
              });
            }
            UI.openModal(UI.DOM.commentsModal);
            UI.updateCommentFormVisibility();
            // Scroll to bottom after a short delay to ensure content is rendered
            setTimeout(() => {
              const modalBody =
                UI.DOM.commentsModal.querySelector(".modal-body");
              if (modalBody) {
                modalBody.scrollTop = modalBody.scrollHeight;
              }
            }, 100);
            break;
          }
          case "open-info-modal":
            UI.openModal(UI.DOM.infoModal);
            break;
          case "open-desktop-pwa-modal":
            PWA.openDesktopModal();
            break;
          case "open-ios-pwa-modal":
            PWA.openIosModal();
            break;
          case "install-pwa":
            PWA.handleInstallClick();
            break;
          case "open-account-modal":
            if (loggedInMenu) loggedInMenu.classList.remove("active");
            AccountPanel.openAccountModal();
            break;
          case "close-modal":
            const modal = actionTarget.closest(".modal-overlay");
            if (modal) {
              UI.closeModal(modal);
            } else {
              PWA.closePwaModals();
            }
            break;
          case "close-welcome-modal":
            UI.closeModal(UI.DOM.welcomeModal);
            break;
          case "close-account-modal":
            UI.closeModal(UI.DOM.accountModal);
            break;
          case "logout":
            e.preventDefault();
            handleLogout(actionTarget);
            break;
          case "toggle-main-menu":
            if (State.get("isUserLoggedIn")) {
              if (loggedInMenu) loggedInMenu.classList.toggle("active");
            } else {
              Utils.vibrateTry();
              UI.showAlert(Utils.getTranslation("menuAccessAlert"));
            }
            break;
          case "toggle-login-panel":
            if (!State.get("isUserLoggedIn")) {
              if (UI.DOM.commentsModal.classList.contains("visible")) {
                UI.closeModal(UI.DOM.commentsModal);
              }
              if (loginPanel) loginPanel.classList.toggle("active");
              if (topbar) topbar.classList.toggle("login-panel-active");
            }
            break;
          case "subscribe":
            if (!State.get("isUserLoggedIn")) {
              Utils.vibrateTry();
              UI.showAlert(Utils.getTranslation("subscribeAlert"));
            }
            break;
          case "toggle-notifications":
            if (State.get("isUserLoggedIn")) {
              const popup = UI.DOM.notificationPopup;
              popup.classList.toggle("visible");
              if (popup.classList.contains("visible")) Notifications.render();
            } else {
              Utils.vibrateTry();
              UI.showAlert(Utils.getTranslation("notificationAlert"));
            }
            break;
          case "close-notifications":
            if (UI.DOM.notificationPopup) {
              UI.DOM.notificationPopup.classList.remove("visible");
            }
            break;
          case "show-tip-jar":
            document.querySelector("#bmc-wbtn")?.click();
            break;
          case "play-video":
            const currentSlide = document.querySelector(".swiper-slide-active");
            if (currentSlide) {
              const player = players[currentSlide.dataset.slideId];
              if (player) {
                player.play();
                currentSlide
                  .querySelector(".pause-overlay")
                  .classList.remove("visible");
              }
            }
            break;
        }
      },
      formSubmitHandler: (e) => {
        const loginForm = e.target.closest("form#tt-login-form");
        if (loginForm) {
          e.preventDefault();
          const username = loginForm.querySelector("#tt-username").value;
          const password = loginForm.querySelector("#tt-password").value;
          const submitButton = loginForm.querySelector("#tt-login-submit");

          if (!username || !password) {
            UI.showAlert("Please enter username and password.", true);
            return;
          }

          submitButton.disabled = true;

          API.login({ log: username, pwd: password }).then(async (json) => {
            if (json.success) {
              State.set("isUserLoggedIn", true);
              UI.showAlert(Utils.getTranslation("loginSuccess"));
              await API.refreshNonce();
              await App.fetchAndUpdateSlideData();
              UI.updateUIForLoginState();
            } else {
              UI.showAlert(
                json.data?.message || Utils.getTranslation("loginFailed"),
                true,
              );
            }
            submitButton.disabled = false;
          });
          return;
        }

        const commentForm = e.target.closest("form#comment-form");
        if (commentForm) {
          e.preventDefault();
          const input = commentForm.querySelector("#comment-input");
          if (!input) return;
          const text = input.value.trim();
          if (!text) return;

          const button = commentForm.querySelector('button[type="submit"]');
          if (button) button.disabled = true;

          const slideElement = document.querySelector(".swiper-slide-active");
          const slideId = slideElement?.dataset.slideId;
          const parentId = State.get("replyingToComment");

          if (slideId) {
            API.postComment(slideId, text, parentId).then((postResponse) => {
              if (postResponse.success) {
                input.value = "";
                State.set("replyingToComment", null);
                const replyContext = document.querySelector(".reply-context");
                if (replyContext) replyContext.style.display = "none";

                UI.showToast(Utils.getTranslation("postCommentSuccess"));

                const slideData = slidesData.find((s) => s.id === slideId);
                if (slideData) {
                  UI.renderComments(slideData.comments);

                  const mainSlideCount =
                    slideElement.querySelector(".comment-count");
                  if (mainSlideCount) {
                    mainSlideCount.textContent = Utils.formatCount(
                      slideData.initialComments,
                    );
                  }

                  const commentsTitle =
                    UI.DOM.commentsModal.querySelector("#commentsTitle");
                  if (commentsTitle) {
                    commentsTitle.textContent = `${Utils.getTranslation("commentsModalTitle")} (${slideData.initialComments})`;
                  }

                  const modalBody =
                    UI.DOM.commentsModal.querySelector(".modal-body");
                  if (modalBody) {
                    modalBody.scrollTop = modalBody.scrollHeight;
                  }
                }
              } else {
                UI.showAlert(
                  postResponse.data?.message || "Failed to post comment.",
                  true,
                );
              }
              if (button) button.disabled = false;
              input.focus();
            });
          } else {
            if (button) button.disabled = false;
          }
        }
      },
    };
  })();

  const Notifications = (function () {
    const mockData = [
      {
        id: 1,
        type: "message",
        previewKey: "notif1Preview",
        timeKey: "notif1Time",
        fullKey: "notif1Full",
        unread: true,
      },
      {
        id: 2,
        type: "profile",
        previewKey: "notif2Preview",
        timeKey: "notif2Time",
        fullKey: "notif2Full",
        unread: true,
      },
      {
        id: 3,
        type: "offer",
        previewKey: "notif3Preview",
        timeKey: "notif3Time",
        fullKey: "notif3Full",
        unread: false,
      },
    ];

    const icons = {
      message: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>`,
      profile: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
      offer: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>`,
    };

    return {
      render: () => {
        const listEl =
          UI.DOM.notificationPopup.querySelector(".notification-list");
        const emptyStateEl = UI.DOM.notificationPopup.querySelector(
          ".notification-empty-state",
        );
        listEl.innerHTML = "";
        listEl.appendChild(emptyStateEl);

        if (mockData.length === 0) {
          emptyStateEl.classList.remove("hidden-by-js");
          return;
        }

        emptyStateEl.classList.add("hidden-by-js");
        const fragment = document.createDocumentFragment();

        mockData.forEach((notif) => {
          const item = document.createElement("li");
          item.className = `notification-item ${notif.unread ? "unread" : ""}`;
          item.setAttribute("role", "button");
          item.setAttribute("tabindex", "0");
          item.setAttribute("aria-expanded", "false");

          item.innerHTML = `
                            <div class="notif-header">
                                <div class="notif-icon" aria-hidden="true">${icons[notif.type] || ""}</div>
                                <div class="notif-content-wrapper">
                                    <div class="notif-summary">
                                        <span class="notif-preview">${Utils.getTranslation(notif.previewKey)}</span>
                                        <span class="notif-time">${Utils.getTranslation(notif.timeKey)}</span>
                                    </div>
                                    <div class="unread-dot"></div>
                                    <svg class="expand-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                </div>
                            </div>
                            <div class="notif-full-details">
                                <div class="notif-full-details-content">
                                    ${Utils.getTranslation(notif.fullKey)}
                                </div>
                            </div>
                        `;
          fragment.appendChild(item);
        });
        listEl.appendChild(fragment);
      },
    };
  })();

  /**
   * ==========================================================================
   * 8. ACCOUNT PANEL
   * ==========================================================================
   */
  const AccountPanel = (function () {
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
      userSettings.emailLanguage = lang;
      updateSettingsUI();
    }

    async function saveSettings() {
      const button = document.getElementById("saveSettingsBtn");
      const originalText = button.textContent;
      try {
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span> ${Utils.getTranslation("savingButtonText")}`;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showSuccess(
          "settingsSuccess",
          Utils.getTranslation("settingsUpdateSuccess"),
        );
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
        const result = await loadUserProfile();
        if (result.success) {
          populateProfileForm(result.data);
        } else {
          throw new Error(
            result.data?.message || Utils.getTranslation("profileUpdateError"),
          );
        }
      } catch (error) {
        console.log("Could not load profile data:", error);
        showError("profileError", Utils.getTranslation("profileUpdateError"));
      }
    }

    function populateProfileForm(data) {
      if (data.first_name)
        document.getElementById("firstName").value = data.first_name;
      if (data.last_name)
        document.getElementById("lastName").value = data.last_name;
      if (data.email) document.getElementById("email").value = data.email;
      if (data.display_name)
        document.getElementById("displayName").textContent = data.display_name;
      if (data.email)
        document.getElementById("userEmail").textContent = data.email;
      if (data.avatar) document.getElementById("userAvatar").src = data.avatar;
    }

    // Modal visibility functions
    function openAccountModal() {
      const modal = document.getElementById("accountModal");
      modal.classList.add("visible");
      document.body.style.overflow = "hidden";
      loadInitialProfileData(); // Fetch live data when opening
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
    }

    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/"))
        return showError(
          "profileError",
          Utils.getTranslation("fileSelectImageError"),
        );
      if (file.size > 5 * 1024 * 1024)
        return showError(
          "profileError",
          Utils.getTranslation("fileTooLargeError"),
        );

      const reader = new FileReader();
      reader.onload = function (e) {
        cropImage = new Image();
        cropImage.onload = function () {
          openCropModal();
          initializeCropCanvas();
        };
        cropImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function openCropModal() {
      document.getElementById("cropModal").classList.add("visible");
    }
    function closeCropModal() {
      document.getElementById("cropModal").classList.remove("visible");
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
    }
    function handleTouchStart(event) {
      event.preventDefault();
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        startDrag({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }
    function handleTouchMove(event) {
      event.preventDefault();
      if (event.touches.length === 1 && isDragging) {
        const touch = event.touches[0];
        drag({ clientX: touch.clientX, clientY: touch.clientY });
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

        if (result.success && result.data?.url) {
          const newAvatarUrl = result.data.url + "?t=" + Date.now();
          document.getElementById("userAvatar").src = newAvatarUrl;
          document
            .querySelectorAll(".profile img, .tiktok-symulacja .profile img")
            .forEach((img) => {
              img.src = newAvatarUrl;
            });
          showSuccess(
            "profileSuccess",
            Utils.getTranslation("avatarUpdateSuccess"),
          );
          closeCropModal();
          document.dispatchEvent(
            new CustomEvent("tt:avatar-updated", {
              detail: { url: newAvatarUrl },
            }),
          );
        } else {
          throw new Error(
            result.data?.message || Utils.getTranslation("avatarUpdateError"),
          );
        }
      } catch (error) {
        showError(
          "profileError",
          error.message || Utils.getTranslation("imageProcessingError"),
        );
      } finally {
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    }

    async function apiRequest(action, data = {}) {
      const body = new URLSearchParams({ action, nonce: ajax_object.nonce });
      for (const key in data) {
        body.append(key, data[key]);
      }
      try {
        const response = await fetch(ajax_object.ajax_url, {
          method: "POST",
          body,
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
        const result = await response.json();
        if (result.new_nonce) ajax_object.nonce = result.new_nonce;
        return result;
      } catch (error) {
        console.error(`Błąd API dla akcji "${action}":`, error);
        return { success: false, data: { message: error.message } };
      }
    }
    async function uploadAvatar(dataUrl) {
      return apiRequest("tt_avatar_upload", { image: dataUrl });
    }
    async function updateProfile(data) {
      return apiRequest("tt_profile_update", data);
    }
    async function changePassword(data) {
      return apiRequest("tt_password_change", data);
    }
    async function deleteAccount(confirmText) {
      return apiRequest("tt_account_delete", { confirm_text: confirmText });
    }
    async function loadUserProfile() {
      return apiRequest("tt_profile_get");
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

    return { init, openAccountModal };
  })();

  /**
   * ==========================================================================
   * 9. APP INITIALIZATION
   * ==========================================================================
   */
  const App = (function () {
    function _initializeGlobalListeners() {
      Utils.setAppHeightVar();
      window.addEventListener("resize", Utils.setAppHeightVar);
      window.addEventListener("orientationchange", Utils.setAppHeightVar);

      ["touchstart", "pointerdown", "click", "keydown"].forEach((evt) => {
        document.addEventListener(evt, Utils.recordUserGesture, {
          passive: true,
        });
      });

      document.body.addEventListener("click", Handlers.mainClickHandler);
      document.body.addEventListener("submit", Handlers.formSubmitHandler);

      document
        .querySelectorAll(".modal-overlay:not(#accountModal)")
        .forEach((modal) => {
          modal.addEventListener("click", (e) => {
            if (e.target === modal) UI.closeModal(modal);
          });
          modal
            .querySelector(".modal-close-btn, .topbar-close-btn")
            ?.addEventListener("click", () => UI.closeModal(modal));
        });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const visibleModal = document.querySelector(
            ".modal-overlay.visible:not(#accountModal):not(#cropModal)",
          );
          if (visibleModal) UI.closeModal(visibleModal);
          if (UI.DOM.notificationPopup.classList.contains("visible"))
            UI.DOM.notificationPopup.classList.remove("visible");
        }
      });

      document.addEventListener("click", (event) => {
        const popup = UI.DOM.notificationPopup;
        if (
          popup &&
          popup.classList.contains("visible") &&
          !popup.contains(event.target) &&
          !event.target.closest('[data-action="toggle-notifications"]')
        ) {
          popup.classList.remove("visible");
        }

        const openDropdown = document.querySelector(".sort-dropdown.open");
        if (openDropdown && !openDropdown.contains(event.target)) {
          openDropdown.classList.remove("open");
        }
      });

      UI.DOM.notificationPopup
        .querySelector(".notification-list")
        .addEventListener("click", Handlers.handleNotificationClick);
      UI.DOM.tiktokProfileModal?.addEventListener(
        "click",
        Handlers.profileModalTabHandler,
      );
    }

    async function _fetchAndUpdateSlideData() {
      const json = await API.fetchSlidesData();
      if (json.success && Array.isArray(json.data)) {
        const newDataMap = new Map(
          json.data.map((item) => [String(item.likeId), item]),
        );
        slidesData.forEach((existingSlide) => {
          const updatedInfo = newDataMap.get(String(existingSlide.likeId));
          if (updatedInfo) {
            existingSlide.isLiked = updatedInfo.isLiked;
            existingSlide.initialLikes = updatedInfo.initialLikes;
            UI.applyLikeStateToDom(
              existingSlide.likeId,
              existingSlide.isLiked,
              existingSlide.initialLikes,
            );
          }
        });
      }
    }

    function _startApp(selectedLang) {
      try {
        State.set("currentLang", selectedLang);
        localStorage.setItem("tt_lang", selectedLang);

        UI.renderSlides();
        UI.updateTranslations();

        const handleMediaChange = (swiper) => {
          const activeSlide = swiper.slides[swiper.activeIndex];

          // Pause all videos to prevent background audio.
          document.querySelectorAll(".swiper-slide video").forEach((video) => {
            if (!video.paused) video.pause();
          });

          // Unload all iframes to save resources.
          document
            .querySelectorAll(".swiper-slide iframe")
            .forEach((iframe) => {
              if (iframe.src) {
                if (!iframe.dataset.originalSrc)
                  iframe.dataset.originalSrc = iframe.src;
                iframe.src = "";
              }
            });

          // Play media for the new active slide.
          if (activeSlide) {
            const slideData = slidesData[swiper.realIndex];
            if (slideData && slideData.isIframe) {
              const iframe = activeSlide.querySelector("iframe");
              if (iframe && iframe.dataset.originalSrc)
                iframe.src = iframe.dataset.originalSrc;
            } else {
              const video = activeSlide.querySelector("video");
              if (video) {
                // Nowe wideo nie powinno mieć widocznej nakładki pauzy
                const pauseOverlay =
                  activeSlide.querySelector(".pause-overlay");
                if (pauseOverlay) {
                  pauseOverlay.classList.remove("visible");
                }
                setTimeout(() => {
                  video
                    .play()
                    .catch((error) =>
                      console.log(
                        "Autoplay was prevented for slide " +
                          swiper.activeIndex,
                        error,
                      ),
                    );
                }, 150);
              }
            }
          }
        };

        const swiper = new Swiper(".swiper", {
          direction: "vertical",
          mousewheel: { releaseOnEdges: true },
          loop: true,
          keyboard: { enabled: true, onlyInViewport: false },
          speed: 300,
          on: {
            init: function (swiper) {
              // --- One-time animation on first app load ---

              // Also handle media for the very first slide on init.
              handleMediaChange(swiper);
            },
            slideChange: handleMediaChange,
          },
        });

        setTimeout(() => {
          UI.DOM.preloader.classList.add("preloader-hiding");
          UI.DOM.container.classList.add("ready");
          const pwaInstallBar = document.getElementById("pwa-install-bar");
          const appFrame = document.getElementById("app-frame");
          if (!PWA.isStandalone()) {
            if (pwaInstallBar) {
                pwaInstallBar.classList.add("visible");
                if (appFrame) appFrame.classList.add("app-frame--pwa-visible");
            }
          }
          document.querySelectorAll(".sidebar").forEach((sidebar) => {
            sidebar.classList.add("visible");
          });
          UI.DOM.preloader.addEventListener(
            "transitionend",
            () => {
              UI.DOM.preloader.style.display = "none";
              // Pokaż modal powitalny tylko w przeglądarce, nie w PWA
              if (!PWA.isStandalone() && UI.DOM.welcomeModal) {
                setTimeout(() => {
                  UI.openModal(UI.DOM.welcomeModal);
                }, 300); // Małe opóźnienie dla płynniejszego efektu
              }
            },
            { once: true },
          );
        }, 1000);
      } catch (error) {
        alert(
          "Application failed to start. Error: " +
            error.message +
            "\\n\\nStack: " +
            error.stack,
        );
        console.error("TingTong App Start Error:", error);
      }
    }

    function _initializePreloader() {
      setTimeout(() => UI.DOM.preloader.classList.add("content-visible"), 500);
      UI.DOM.preloader
        .querySelectorAll(".language-selection button")
        .forEach((button) => {
          button.addEventListener(
            "click",
            () => {
              UI.DOM.preloader
                .querySelectorAll(".language-selection button")
                .forEach((btn) => (btn.disabled = true));
              button.classList.add("is-selected");
              setTimeout(() => _startApp(button.dataset.lang), 300);
            },
            { once: true },
          );
        });
    }

    function _setInitialConfig() {
      try {
        const c = navigator.connection || navigator.webkitConnection;
        if (c?.saveData) Config.LOW_DATA_MODE = true;
        if (c?.effectiveType?.includes("2g")) Config.LOW_DATA_MODE = true;
        if (c?.effectiveType?.includes("3g"))
          Config.HLS.maxAutoLevelCapping = 480;
      } catch (_) {}
    }

    return {
      init: () => {
        _setInitialConfig();
        _initializeGlobalListeners();
        AccountPanel.init();
        UI.initGlobalPanels();
        UI.initKeyboardListener();
        PWA.init();
        _initializePreloader();
        document.body.classList.add("loaded");
      },
      fetchAndUpdateSlideData: _fetchAndUpdateSlideData,
    };
  })();

  App.init();
});
