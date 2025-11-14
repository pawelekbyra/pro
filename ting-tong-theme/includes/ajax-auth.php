<?php
/**
 * AJAX handlers for authentication and user profile management.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// --- Logowanie, wylogowanie, odświeżanie danych ---
add_action( 'wp_ajax_tt_get_slides_data_ajax', function() {
    check_ajax_referer( 'tt_ajax_nonce', 'nonce' );
    wp_send_json_success( tt_get_slides_data() );
});
add_action('wp_ajax_nopriv_tt_ajax_login', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');

    $login_data = [
        'user_password' => isset($_POST['pwd']) ? $_POST['pwd'] : '',
        'remember'      => true,
    ];

    $user_login = isset($_POST['log']) ? wp_unslash($_POST['log']) : '';

    if (is_email($user_login)) {
        $login_data['user_login'] = sanitize_email($user_login);
    } else {
        $login_data['user_login'] = sanitize_user($user_login);
    }

    $user = wp_signon($login_data, is_ssl());

    if (is_wp_error($user)) {
        $error_code = $user->get_error_code();
        $error_message = 'Błędne dane logowania. Spróbuj ponownie.';

        if ($error_code === 'invalid_username' || $error_code === 'invalid_email') {
            $error_message = 'Użytkownik o podanej nazwie lub e-mailu nie istnieje.';
        } elseif ($error_code === 'incorrect_password') {
            $error_message = 'Podane hasło jest nieprawidłowe. Sprawdź je i spróbuj jeszcze raz.';
        }

        wp_send_json_error(['message' => $error_message]);
    } else {
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true, is_ssl());

        // Przygotuj pełne dane użytkownika
        $u = wp_get_current_user();
        $first_name = trim(get_user_meta($u->ID, 'first_name', true));
        $last_name = trim(get_user_meta($u->ID, 'last_name', true));

        // KLUCZOWA LOGIKA: Sprawdź flagę pierwszego logowania
        $is_profile_complete = ! empty($first_name) && ! empty($last_name);
        $requires_setup = ! $is_profile_complete;

        $user_data = [
            'user_id'             => (int) $u->ID,
            'username'            => $u->user_login,
            'email'               => $u->user_email,
            'display_name'        => $u->display_name,
            'first_name'          => (string) $first_name,
            'last_name'           => (string) $last_name,
            'avatar'              => tt_get_user_avatar_url($u->ID),
            'email_consent'       => (bool) get_user_meta($u->ID, 'tt_email_consent', true),
            'email_language'      => (string) get_user_meta($u->ID, 'tt_email_language', true) ?: 'pl',
            'is_profile_complete' => $is_profile_complete,
        ];

        // Zwróć odpowiedź
        wp_send_json_success([
            'message'                      => 'Zalogowano pomyślnie.',
            'userData'                     => $user_data,
            'slidesData'                   => tt_get_slides_data(),
            'new_nonce'                    => wp_create_nonce('tt_ajax_nonce'),
            'requires_first_login_setup'   => $requires_setup, // NOWA FLAGA
        ]);
    }
});
/**
 * Obsługuje żądanie wylogowania użytkownika.
 * Ta funkcja jest wywoływana zarówno dla zalogowanych, jak i niezalogowanych użytkowników,
 * aby zapewnić spójność stanu po stronie klienta, nawet jeśli sesja wygasła.
 */
function tt_ajax_logout_callback() {
    // Sprawdź nonce, jeśli został dostarczony, ale nie przerywaj, jeśli go nie ma.
    // Pozwala to na obsługę sytuacji, gdy sesja już wygasła.
    if ( isset( $_REQUEST['nonce'] ) ) {
        check_ajax_referer( 'tt_ajax_nonce', 'nonce' );
    }

    // Jeśli użytkownik jest zalogowany, wyloguj go.
    if ( is_user_logged_in() ) {
        wp_logout();
    }

    // Zawsze zwracaj sukces, aby klient mógł zaktualizować swój stan.
    // Generujemy nowy nonce dla sesji gościa.
    wp_send_json_success( [
        'message'   => 'Wylogowano pomyślnie.',
        'new_nonce' => wp_create_nonce( 'tt_ajax_nonce' ),
    ] );
}
add_action( 'wp_ajax_tt_ajax_logout', 'tt_ajax_logout_callback' );
add_action( 'wp_ajax_nopriv_tt_ajax_logout', 'tt_ajax_logout_callback' );

/**
 * AJAX: Aktualizuje pole 'locale' dla zalogowanego użytkownika na podstawie przełącznika języka.
 */
add_action('wp_ajax_tt_update_locale', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz być zalogowany.'], 401);
    }

    $user_id = get_current_user_id();
    $new_locale = isset($_POST['locale']) ? sanitize_text_field(wp_unslash($_POST['locale'])) : '';

    // Akceptowalne formaty: pl_PL, en_GB, lub pusta wartość (domyślny język instalacji WP)
    if (!in_array($new_locale, ['pl_PL', 'en_GB', ''])) {
        wp_send_json_error(['message' => 'Nieprawidłowa lokalizacja.'], 400);
    }

    $res = wp_update_user([
        'ID'     => $user_id,
        'locale' => $new_locale, // Zapis standardowego pola 'locale'
    ]);

    if (is_wp_error($res)) {
        wp_send_json_error(['message' => $res->get_error_message() ?: 'Błąd aktualizacji lokalizacji WP.'], 500);
    }

    wp_send_json_success([
        'message' => 'Lokalizacja została zaktualizowana.',
        'locale'  => $new_locale,
    ]);
});
add_action( 'wp_ajax_tt_refresh_nonce', function() {
    wp_send_json_success(['nonce' => wp_create_nonce( 'tt_ajax_nonce' )]);
} );
add_action( 'wp_ajax_nopriv_tt_refresh_nonce', function() {
    wp_send_json_success(['nonce' => wp_create_nonce( 'tt_ajax_nonce' )]);
});


// --- Zarządzanie profilem użytkownika ---
add_action('wp_ajax_tt_profile_get', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if ( ! is_user_logged_in() ) {
        wp_send_json_error(['message' => 'not_logged_in'], 401);
    }
    $u = wp_get_current_user();
    $first_name = trim(get_user_meta($u->ID, 'first_name', true));
    $last_name = trim(get_user_meta($u->ID, 'last_name', true));
    $is_profile_complete = ! empty($first_name) && ! empty($last_name);

    wp_send_json_success([
        'user_id'             => (int) $u->ID,
        'username'            => $u->user_login,
        'email'               => $u->user_email,
        'display_name'        => $u->display_name,
        'first_name'          => (string) $first_name,
        'last_name'           => (string) $last_name,
        'avatar'              => tt_get_user_avatar_url($u->ID),
        'is_profile_complete' => $is_profile_complete,
        'new_nonce'           => wp_create_nonce('tt_ajax_nonce'),
    ]);
});
add_action('wp_ajax_nopriv_tt_profile_get', function () {
    wp_send_json_error(['message' => 'not_logged_in'], 401);
});
add_action('wp_ajax_tt_profile_update', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if ( ! is_user_logged_in() ) {
        wp_send_json_error(['message' => 'not_logged_in'], 401);
    }
    $u = wp_get_current_user();
    $first = isset($_POST['first_name']) ? sanitize_text_field( wp_unslash($_POST['first_name']) ) : '';
    $last  = isset($_POST['last_name'])  ? sanitize_text_field( wp_unslash($_POST['last_name']) )  : '';
    $email = isset($_POST['email'])      ? sanitize_email( wp_unslash($_POST['email']) ) : '';

    if (empty($first) || empty($last) || empty($email)) {
        wp_send_json_error(['message' => 'Wszystkie pola są wymagane.'], 400);
    }
    if ( ! is_email($email) ) {
        wp_send_json_error(['message' => 'Nieprawidłowy adres e-mail.'], 400);
    }
    $exists = email_exists($email);
    if ($exists && (int) $exists !== (int) $u->ID) {
        wp_send_json_error(['message' => 'Ten e-mail jest już zajęty.'], 409);
    }

    update_user_meta($u->ID, 'first_name', $first);
    update_user_meta($u->ID, 'last_name',  $last);
    $display_name = trim($first . ' ' . $last);
    $res = wp_update_user([
        'ID'           => $u->ID,
        'user_email'   => $email,
        'display_name' => $display_name ?: $u->display_name,
    ]);

    if (is_wp_error($res)) {
        wp_send_json_error(['message' => $res->get_error_message() ?: 'Błąd aktualizacji.'], 500);
    }
    wp_send_json_success([
        'display_name' => $display_name ?: $u->display_name,
        'first_name'   => $first,
        'last_name'    => $last,
        'email'        => $email,
        'avatar'       => tt_get_user_avatar_url($u->ID),
    ]);
});
add_action('wp_ajax_tt_avatar_upload', function () {
    try {
        // Logika weryfikacji Nonce dla JSON
        $nonce = '';
        if (isset($_SERVER['HTTP_X_WP_NONCE'])) {
            $nonce = $_SERVER['HTTP_X_WP_NONCE'];
        } elseif (isset($_REQUEST['nonce'])) {
            $nonce = $_REQUEST['nonce'];
        }

        if (!wp_verify_nonce($nonce, 'tt_ajax_nonce')) {
            wp_send_json_error(['message' => 'Błąd weryfikacji nonce.'], 403);
            return;
        }


        if ( ! is_user_logged_in() ) {
            wp_send_json_error(['message' => 'Brak uprawnień: Musisz być zalogowany.'], 401);
        }

        // Odczytaj dane JSON
        $json_data = json_decode(file_get_contents('php://input'), true);
        $dataUrl = isset($json_data['image']) ? trim($json_data['image']) : '';


        if ( ! preg_match('#^data:(image/(?:png|jpeg|gif|webp));base64,(.+)$#', $dataUrl, $matches) ) {
            wp_send_json_error(['message' => 'Błąd formatu: Oczekiwano obrazu PNG, JPEG lub GIF.'], 400);
        }

        $mime = strtolower($matches[1]);
        $bin = base64_decode($matches[2]);
        if ( ! $bin || strlen($bin) > 5 * 1024 * 1024) { // Zwiększony limit do 5MB
            wp_send_json_error(['message' => 'Błąd pliku: Obraz jest uszkodzony lub za duży (limit 5MB).'], 400);
        }

        if ( ! function_exists('wp_handle_sideload') ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $u = wp_get_current_user();

        $mime_to_ext = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
        ];
        $ext = isset($mime_to_ext[$mime]) ? $mime_to_ext[$mime] : 'jpg';

        $filename = 'tt-avatar-' . (int) $u->ID . '-' . time() . '.' . $ext;

        $upload_dir = wp_upload_dir();
        $tmp_path = trailingslashit($upload_dir['path']) . $filename;

        $write_result = file_put_contents($tmp_path, $bin);
        if ($write_result === false) {
            wp_send_json_error(['message' => 'Błąd zapisu: Nie można zapisać pliku tymczasowego.'], 500);
        }

        $file_array = ['name' => $filename, 'type' => $mime, 'tmp_name' => $tmp_path, 'error' => 0, 'size' => filesize($tmp_path)];
        $file = wp_handle_sideload($file_array, ['test_form' => false]);

        if (isset($file['error'])) {
            @unlink($tmp_path);
            wp_send_json_error(['message' => 'Błąd WordPress: ' . $file['error']], 500);
        }

        $attach_id = wp_insert_attachment(['post_mime_type' => $mime, 'post_title' => $filename, 'post_content' => '', 'post_status' => 'inherit'], $file['file']);
        if (is_wp_error($attach_id)) {
            @unlink($file['file']);
            wp_send_json_error(['message' => 'Błąd bazy danych: Nie można utworzyć załącznika.'], 500);
        }

        $attach_data = wp_generate_attachment_metadata($attach_id, $file['file']);
        wp_update_attachment_metadata($attach_id, $attach_data);

        // Usuń stary avatar, jeśli istnieje
        $old_avatar_id = get_user_meta($u->ID, 'tt_avatar_id', true);
        if ($old_avatar_id && (int) $old_avatar_id !== (int) $attach_id) {
            wp_delete_attachment((int) $old_avatar_id, true);
        }

        update_user_meta($u->ID, 'tt_avatar_id', $attach_id);
        $url = wp_get_attachment_url($attach_id);
        update_user_meta($u->ID, 'tt_avatar_url', esc_url_raw($url));

        wp_send_json_success(['url' => $url, 'attachment_id' => $attach_id]);

    } catch (Exception $e) {
        // Złap wszystkie błędy krytyczne (w tym błędy parsowania, itp.)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            wp_send_json_error(['message' => 'Krytyczny błąd serwera: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        } else {
            wp_send_json_error(['message' => 'Wystąpił nieoczekiwany błąd serwera.'], 500);
        }
    }
});
add_action('wp_ajax_tt_password_change', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message'=>'not_logged_in'], 401);
    }
    $u = wp_get_current_user();
    $cur = isset($_POST['current_password']) ? (string) wp_unslash($_POST['current_password']) : '';
    $n1  = isset($_POST['new_password_1'])   ? (string) wp_unslash($_POST['new_password_1'])   : '';
    $n2  = isset($_POST['new_password_2'])   ? (string) wp_unslash($_POST['new_password_2'])   : '';
    if (empty($cur) || empty($n1) || empty($n2) || $n1 !== $n2 || strlen($n1) < 8) {
        wp_send_json_error(['message' => 'Sprawdź pola hasła (min. 8 znaków, muszą być identyczne).'], 400);
    }
    require_once ABSPATH . 'wp-includes/pluggable.php';
    if (!wp_check_password($cur, $u->user_pass, $u->ID)) {
        wp_send_json_error(['message' => 'Aktualne hasło jest nieprawidłowe.'], 403);
    }
    wp_set_password($n1, $u->ID);
    wp_send_json_success(['message' => 'Hasło zmienione. Zaloguj się ponownie.']);
});
add_action('wp_ajax_tt_save_settings', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz być zalogowany.'], 401);
    }

    $user_id = get_current_user_id();
    $email_consent = isset($_POST['email_consent']) ? rest_sanitize_boolean($_POST['email_consent']) : false;
    $email_language = isset($_POST['email_language']) ? sanitize_text_field($_POST['email_language']) : 'pl';

    // Walidacja języka
    if (!in_array($email_language, ['pl', 'en'])) {
        $email_language = 'pl';
    }

    update_user_meta($user_id, 'tt_email_consent', $email_consent);
    update_user_meta($user_id, 'tt_email_language', $email_language);

    wp_send_json_success(['message' => 'Ustawienia zapisane.']);
});

add_action('wp_ajax_tt_account_delete', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message'=>'not_logged_in'], 401);
    }
    $u = wp_get_current_user();
    $confirm = isset($_POST['confirm_text']) ? trim((string) wp_unslash($_POST['confirm_text'])) : '';
    if ($confirm !== 'USUWAM KONTO') {
        wp_send_json_error(['message' => 'Aby potwierdzić, wpisz dokładnie: USUWAM KONTO'], 400);
    }
    if (user_can($u, 'administrator')) {
        wp_send_json_error(['message' => 'Konto administratora nie może być usunięte.'], 403);
    }
    require_once ABSPATH . 'wp-admin/includes/user.php';
    if (!wp_delete_user($u->ID)) {
        wp_send_json_error(['message' => 'Nie udało się usunąć konta.'], 500);
    }
    wp_logout();
    wp_send_json_success(['message' => 'Konto usunięte.']);
});

add_action('wp_ajax_tt_complete_profile', function () {
// 1. Zabezpieczenia
check_ajax_referer('tt_ajax_nonce', 'nonce');
if (!is_user_logged_in()) {
wp_send_json_error(['message' => 'Musisz być zalogowany, aby uzupełnić profil.'], 401);
}

$u = wp_get_current_user();
$user_id = $u->ID;

// 2. Walidacja i pobranie danych
$first_name = isset($_POST['first_name']) ? sanitize_text_field(wp_unslash($_POST['first_name'])) : '';
$last_name = isset($_POST['last_name']) ? sanitize_text_field(wp_unslash($_POST['last_name'])) : '';
$new_password = isset($_POST['new_password']) ? wp_unslash($_POST['new_password']) : '';
$email_consent = isset($_POST['email_consent']) && $_POST['email_consent'] === 'true' ? 1 : 0;
$email_language = isset($_POST['email_language']) ? sanitize_text_field($_POST['email_language']) : 'pl';

if (empty($first_name) || empty($last_name)) {
wp_send_json_error(['message' => 'Imię i nazwisko są wymagane.'], 400);
}
if (strlen($new_password) < 8) {
wp_send_json_error(['message' => 'Hasło musi mieć co najmniej 8 znaków.'], 400);
}

// 3. Aktualizacja danych użytkownika
update_user_meta($user_id, 'first_name', $first_name);
update_user_meta($user_id, 'last_name', $last_name);
update_user_meta($user_id, 'tt_email_consent', $email_consent);
update_user_meta($user_id, 'tt_email_language', $email_language);

// Ustawienie display_name
$display_name = trim($first_name . ' ' . $last_name);
wp_update_user(['ID' => $user_id, 'display_name' => $display_name]);

// Ustawienie nowego hasła
wp_set_password($new_password, $user_id);

// 4. Oznacz profil jako kompletny (Kluczowe dla wyłączenia modala przy następnym logowaniu)
update_user_meta($user_id, 'tt_first_login_completed', 1);

// 5. Przygotowanie danych do odpowiedzi (zgodne z oczekiwaniami frontendu)
$updated_user_data = [
'user_id' => (int) $user_id,
'username' => $u->user_login,
'email' => $u->user_email,
'display_name' => $display_name,
'first_name' => $first_name,
'last_name' => $last_name,
'avatar' => get_avatar_url($user_id, ['size' => 96]),
'is_profile_complete' => true,
'email_consent' => $email_consent,
'email_language' => $email_language,
];

// 6. Zwrócenie sukcesu
wp_send_json_success([
'message' => 'Profil został pomyślnie ukończony.',
'userData' => $updated_user_data,
'new_nonce' => wp_create_nonce('tt_ajax_nonce'),
]);
});

/**
* AJAX: Generuje token SSO dla FastComments (dla zalogowanych lub gości).
*/
add_action('wp_ajax_tt_fastcomments_sso_token', 'tt_fastcomments_sso_token_callback');
add_action('wp_ajax_nopriv_tt_fastcomments_sso_token', 'tt_fastcomments_sso_token_callback');

function tt_fastcomments_sso_token_callback() {
// Nonce jest sprawdzane przez AuthManager.js
// check_ajax_referer('tt_ajax_nonce', 'nonce');

$user = wp_get_current_user();
$sso_token = tt_fastcomments_generate_sso_token($user);

if (!$sso_token) {
wp_send_json_error(['message' => 'Failed to generate SSO token.'], 500);
}

wp_send_json_success($sso_token);
}
