<?php
/**
 * Theme setup, constants, scripts and styles.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// =========================================================================
// 0. ŁADOWANIE COMPOSER I KLUCZE (NAPRAWIONA LOGIKA POBIERANIA Z WP-CONFIG)
// =========================================================================

// Wymagaj autoloader'a Composera (nadal potrzebny dla klasy Stripe i WebPush)
$composer_autoload = get_template_directory() . '/vendor/autoload.php';
if (file_exists($composer_autoload)) {
    require_once $composer_autoload;
} else {
    // Jeśli nie znaleziono Composera, błąd krytyczny zostanie zalogowany.
    error_log('BŁĄD KRYTYCZNY: Nie znaleziono pliku autoload.php. Uruchom `composer install` lub wgraj katalog `vendor/`.');
}

/* Wyłącz domyślny e-mail powitalny WordPressa przy tworzeniu użytkownika */
if ( ! function_exists( 'wp_new_user_notification' ) ) {
    function wp_new_user_notification( $user_id, $deprecated = '', $notify = '' ) {
        // Ta funkcja jest teraz pusta. Blokuje domyślne powiadomienia WP.
        return;
    }
}

/**
 * Definiuje klucze VAPID, używając stałych z wp-config.php.
 */
function tt_define_vapid_constants_safely() {
    if (defined('VAPID_PUBLIC_KEY') && !defined('TT_VAPID_PUBLIC_KEY')) {
        define('TT_VAPID_PUBLIC_KEY', VAPID_PUBLIC_KEY);
    }
    if (defined('VAPID_PRIVATE_KEY') && !defined('TT_VAPID_PRIVATE_KEY')) {
        define('TT_VAPID_PRIVATE_KEY', VAPID_PRIVATE_KEY);
    }
    if (defined('VAPID_SUBJECT') && !defined('TT_VAPID_SUBJECT')) {
        define('TT_VAPID_SUBJECT', VAPID_SUBJECT);
    }
}
add_action('after_setup_theme', 'tt_define_vapid_constants_safely', 1);

// =========================================================================
// 1. Define Stripe API Keys (NAPRAWA TIMINGU Z UŻYCIEM HOOKA)
// =========================================================================

/**
 * Definiuje klucze Stripe dla motywu, używając stałych z wp-config.php.
 * Funkcja jest uruchamiana za pomocą 'after_setup_theme', co gwarantuje,
 * że stałe zdefiniowane w wp-config.php są już w pełni dostępne.
 */
function tt_define_stripe_constants_safely() {
    // Priorytet dla Klucza Publicznego: Sprawdzamy najpierw STRIPE_PUBLISHABLE_KEY, potem krótszą nazwę.
    $pk_source = defined('STRIPE_PUBLISHABLE_KEY')
        ? STRIPE_PUBLISHABLE_KEY
        : (defined('PUBLISHABLE_KEY') ? PUBLISHABLE_KEY : null);

    if (!defined('TT_STRIPE_PUBLISHABLE_KEY')) {
        define('TT_STRIPE_PUBLISHABLE_KEY', $pk_source);
    }

    // Priorytet dla Klucza Prywatnego: Sprawdzamy STRIPE_SECRET_KEY (najczęstsza nazwa), potem krótszą nazwę.
    $sk_source = defined('STRIPE_SECRET_KEY')
        ? STRIPE_SECRET_KEY
        : (defined('SECRET_KEY') ? SECRET_KEY : null);

    if (!defined('TT_STRIPE_SECRET_KEY')) {
        define('TT_STRIPE_SECRET_KEY', $sk_source);
    }
}
// Kluczowy hak: Wymusza definicję po wczytaniu wp-config.php, ale przed rejestracją skryptów.
add_action('after_setup_theme', 'tt_define_stripe_constants_safely', 1);


// =========================================================================
// 3. SKRYPTY I DANE
// =========================================================================

/**
 * Dodaje skrypty, style i lokalizuje dane dla frontendu.
 */
function tt_enqueue_and_localize_scripts() {
    wp_enqueue_style( 'swiper-css', 'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.css', [], null );
    wp_enqueue_style( 'tingtong-style', get_stylesheet_uri(), [ 'swiper-css' ], null );

    // Kolejkowanie skryptu Stripe.js
    wp_enqueue_script( 'stripe-js', 'https://js.stripe.com/v3/', [], null, true );

    wp_enqueue_script( 'swiper-js', 'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.js', [], null, true );
    // UPEWNIJ SIĘ, ŻE stripe-js JEST W ZALEŻNOŚCIACH
    wp_enqueue_script( 'tingtong-app-script', get_template_directory_uri() . '/js/app.js', [ 'swiper-js', 'stripe-js' ], time(), true );

    // LOKALIZACJA DANYCH
    wp_localize_script(
        'tingtong-app-script',
        'TingTongData',
        [
            'isLoggedIn' => is_user_logged_in(),
            'slides'     => tt_get_slides_data(),
            // W tym miejscu używamy stałej PHP, która musi być zdefiniowana w wp-config.php
            'stripePk'   => defined('TT_STRIPE_PUBLISHABLE_KEY') ? TT_STRIPE_PUBLISHABLE_KEY : null,
            'vapidPk'    => defined('TT_VAPID_PUBLIC_KEY') ? TT_VAPID_PUBLIC_KEY : null,
            'fcTenantId' => defined('FASTCOMMENTS_TENANT_ID') ? FASTCOMMENTS_TENANT_ID : null,
            'fcRegion'   => defined('FASTCOMMENTS_REGION') ? FASTCOMMENTS_REGION : null,
            'fcWidgetId' => defined('FASTCOMMENTS_WIDGET_ID') ? FASTCOMMENTS_WIDGET_ID : null,
        ]
    );

    wp_localize_script(
        'tingtong-app-script',
        'ajax_object',
        [
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'tt_ajax_nonce' ),
        ]
    );

    wp_localize_script(
        'tingtong-app-script',
        'TingTongConfig',
        [
            'serviceWorkerUrl' => home_url('/?tt_sw=1'),
            'themeUrl'         => get_template_directory_uri(),
        ]
    );
}
add_action( 'wp_enqueue_scripts', 'tt_enqueue_and_localize_scripts' );

/**
 * Add type="module" to the app script tag.
 */
function tt_add_module_type_to_script( $tag, $handle, $src ) {
    if ( 'tingtong-app-script' === $handle ) {
        $tag = str_replace( '<script ', '<script type="module" ', $tag );
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'tt_add_module_type_to_script', 10, 3 );

/**
 * Dodaje wsparcie dla podstawowych funkcji motywu.
 */
add_action(
    'after_setup_theme',
    function () {
        add_theme_support( 'title-tag' );
    }
);
