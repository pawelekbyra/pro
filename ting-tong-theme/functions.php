<?php
/**
 * Plik functions.php dla motywu Ting Tong.
 *
 * Zawiera całą logikę backendową dla aplikacji opartej na WordPressie.
 */

// =========================================================================
// 0. ŁADOWANIE COMPOSER I KLUCZE (NAPRAWIONA LOGIKA POBIERANIA Z WP-CONFIG)
// =========================================================================

// Wymagaj autoloader'a Composera (nadal potrzebny dla klasy Stripe)
$composer_autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($composer_autoload)) {
    require_once $composer_autoload;
} else {
    // Jeśli nie znaleziono Composera, błąd krytyczny zostanie zalogowany.
    error_log('BŁĄD KRYTYCZNY STRIPE: Nie znaleziono pliku autoload.php. Wgraj katalog vendor/ na serwer.');
}

/* Wyłącz domyślny e-mail powitalny WordPressa przy tworzeniu użytkownika */
if ( ! function_exists( 'wp_new_user_notification' ) ) {
    function wp_new_user_notification( $user_id, $deprecated = '', $notify = '' ) {
        // Ta funkcja jest teraz pusta. Blokuje domyślne powiadomienia WP.
        return;
    }
}

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Zabezpieczenie przed bezpośrednim dostępem.
}

// =========================================================================
// 1. Define Stripe API Keys (NAPRAWA TIMINGU Z UŻYCIEM HOOKA)
// =========================================================================

/**
 * Definiuje klucze Stripe dla motywu, używając stałych z wp-config.php.
 * Funkcja jest uruchamiana za pomocą 'after_setup_theme', co gwarantuje,
 * że stałe zdefiniowane w wp-config.php są już w pełni dostępne.
 */
function tt_define_stripe_constants_safely() {
    // Klucz publiczny: Jeśli globalna stała PUBLISHABLE_KEY istnieje, użyj jej.
    if (!defined('TT_STRIPE_PUBLISHABLE_KEY')) {
        $pk_value = defined('PUBLISHABLE_KEY') ? PUBLISHABLE_KEY : 'pk_test_YOUR_PUBLISHABLE_KEY';
        define('TT_STRIPE_PUBLISHABLE_KEY', $pk_value);
    }

    // Klucz prywatny: Jeśli globalna stała SECRET_KEY istnieje, użyj jej.
    if (!defined('TT_STRIPE_SECRET_KEY')) {
        $sk_value = defined('SECRET_KEY') ? SECRET_KEY : 'sk_test_YOUR_SECRET_KEY';
        define('TT_STRIPE_SECRET_KEY', $sk_value);
    }
}
// Kluczowy hak: Wymusza definicję po wczytaniu wp-config.php, ale przed rejestracją skryptów.
add_action('after_setup_theme', 'tt_define_stripe_constants_safely', 1);

/**
* Tworzy нового uzytkownika WordPress, jeśli nie istnieje, lub zwraca istniejącego.
* Ustawia flagę tt_first_login_completed na 0, aby wymusić uzupełnienie profilu.
*
* @param string $email Adres email uzytkownika.
* @return WP_User|WP_Error Obiekt uzytkownika lub błąd.
*/
function tt_create_user_from_email_if_not_exists($email) {
if (empty($email) || !is_email($email)) {
return new WP_Error('invalid_email', 'Nieprawidłowy adres email.');
}

// 1. Sprawdź, czy uzytkownik juz istnieje
$user = get_user_by('email', $email);

if ($user) {
return $user; // Uzytkownik istnieje, zwróć go
}

// 2. Generuj unikalną nazwę uzytkownika
$username_base = sanitize_user(explode('@', $email)[0], true);
$username = $username_base;
$i = 1;
while (username_exists($username)) {
$username = $username_base . $i;
$i++;
}

// 3. Generuj hasło (tymczasowe, które zostanie zmienione w FirstLoginModal)
$password = wp_generate_password(12, false);

// 4. Utwórz uzytkownika (domyślnie rola 'subscriber')
$user_id = wp_create_user($username, $password, $email);

if (is_wp_error($user_id)) {
return $user_id;
}

$new_user = get_user_by('id', $user_id);

// 5. Ustaw flagę profilu jako NIEKOMPLETNĄ (0), aby wymusić modal pierwszego logowania.
// ZGODNIE Z LOGIKĄ FRONTENDU, to jest kluczowe.
update_user_meta($user_id, 'tt_first_login_completed', 0);

// 6. Ustaw display_name
wp_update_user(['ID' => $user_id, 'display_name' => $username]);

// 7. W tym miejscu nalezy DODAĆ WYSYŁKĘ EMAILA z loginem i tymczasowym hasłem.
// (Na potrzeby instrukcji, funkcja ta jest pominięta).

return $new_user;
}

// =========================================================================
// 1. TWORZENIE TABEL BAZY DANYCH
// =========================================================================

/**
 * Główna funkcja do tworzenia wszystkich niestandardowych tabel przy aktywacji motywu.
 */
function tt_create_database_tables() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset_collate = $wpdb->get_charset_collate();

    // Tabela: Polubienia slajdów
    $table_name_likes = $wpdb->prefix . 'tt_likes';
    $sql_likes        = "CREATE TABLE {$table_name_likes} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        item_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_user_item (user_id, item_id),
        KEY idx_item (item_id)
    ) {$charset_collate};";
    dbDelta( $sql_likes );
    update_option( 'tt_likes_db_version', '1.0' );

    // Tabela: Komentarze
    $table_name_comments = $wpdb->prefix . 'tt_comments';
    $sql_comments        = "CREATE TABLE {$table_name_comments} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        slide_id VARCHAR(255) NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        parent_id BIGINT UNSIGNED DEFAULT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(500) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_slide_id (slide_id(191)),
        KEY idx_user_id (user_id)
    ) {$charset_collate};";
    dbDelta( $sql_comments );
    update_option( 'tt_comments_db_version', '1.0' );

    // Tabela: Polubienia komentarzy
    $table_name_comment_likes = $wpdb->prefix . 'tt_comment_likes';
    $sql_comment_likes        = "CREATE TABLE {$table_name_comment_likes} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        comment_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_user_comment (user_id, comment_id),
        KEY idx_comment_id (comment_id)
    ) {$charset_collate};";
    dbDelta( $sql_comment_likes );
    update_option( 'tt_comment_likes_db_version', '1.0' );

    // Rejestracja reguły dla webhooka i odświeżenie reguł
    add_rewrite_rule('^tt-webhook/stripe$', 'index.php?tt-webhook-type=stripe', 'top');
    flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'tt_create_database_tables' );

/**
 * Fallback: upewnij się, że tabele istnieją.
 */
add_action(
    'init',
    function () {
        if ( get_option( 'tt_likes_db_version' ) !== '1.0'
            || get_option( 'tt_comments_db_version' ) !== '1.0'
            || get_option( 'tt_comment_likes_db_version' ) !== '1.0' ) {
            tt_create_database_tables();
        }
    }
);

// =========================================================================
// 2. FUNKCJE POMOCNICZE (POLUBIENIA I KOMENTARZE)
// =========================================================================

// --- Polubienia slajdów ---
function tt_likes_get_count( $item_id ) {
    global $wpdb;
    return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}tt_likes WHERE item_id = %d", $item_id ) );
}

function tt_likes_user_has( $item_id, $user_id ) {
    if ( ! $user_id ) {
        return false;
    }
    global $wpdb;
    return (bool) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}tt_likes WHERE item_id = %d AND user_id = %d", $item_id, $user_id ) );
}

// --- Komentarze ---
function tt_comments_get_count( $slide_id ) {
    global $wpdb;
    return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}tt_comments WHERE slide_id = %s", $slide_id ) );
}

// --- Polubienia komentarzy ---
function tt_comment_likes_get_count( $comment_id ) {
    global $wpdb;
    return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}tt_comment_likes WHERE comment_id = %d", $comment_id ) );
}

function tt_comment_likes_user_has( $comment_id, $user_id ) {
    if ( ! $user_id ) {
        return false;
    }
    global $wpdb;
    return (bool) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}tt_comment_likes WHERE comment_id = %d AND user_id = %d", $comment_id, $user_id ) );
}


// =========================================================================
// 3. SKRYPTY I DANE
// =========================================================================

/**
 * Zwraca tablicę symulowanych postów.
 *
 * @return array
 */
function tt_get_simulated_posts() {
    return [
        [
            'post_id'      => 1,
            'post_title'   => 'Big Buck Bunny',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'access'       => 'public',
            'comments'     => 10,
            'author'       => [
                'name'        => 'Big Buck Bunny',
                'description' => 'Oficjalny profil Big Buck Bunny. Zobaczcie moje przygody!',
                'avatar'      => 'https://i.pravatar.cc/100?u=bunny',
                'is_vip'      => false,
            ],
            'post_content' => 'Królik w akcji!',
        ],
        [
            'post_id'      => 2,
            'post_title'   => 'Elephants Dream',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            'access'       => 'secret',
            'comments'     => 20,
            'author'       => [
                'name'        => 'Elephants Dream',
                'description' => 'Twórcy filmu "Elephants Dream". Dzielimy się kulisami naszej pracy.',
                'avatar'      => 'https://i.pravatar.cc/100?u=elephant',
                'is_vip'      => false,
            ],
            'post_content' => 'Sen słonia, tylko dla zalogowanych.',
        ],
        [
            'post_id'      => 3,
            'post_title'   => 'For Bigger Blazes',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'access'       => 'pwa-secret',
            'comments'     => 30,
            'author'       => [
                'name'        => 'For Bigger Blazes',
                'description' => 'Profil poświęcony filmom z efektami specjalnymi. Tylko dla fanów PWA!',
                'avatar'      => 'https://i.pravatar.cc/100?u=blaze',
                'is_vip'      => false,
            ],
            'post_content' => 'Tajemniczy film tylko dla użytkowników PWA.',
        ],
        [
            'post_id'      => 4,
            'post_title'   => 'Are You Satisfied (Marina and the Diamonds cover)',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            'access'       => 'public',
            'comments'     => 15,
            'author'       => [
                'name'        => 'Paweł Polutek',
                'description' => 'Cześć! Jestem Paweł Polutek, entuzjasta technologii webowych i twórca tej aplikacji. Dzielę się tutaj moimi eksperymentami i projektami. Zapraszam do oglądania!',
                'avatar'      => get_template_directory_uri() . '/assets/img/avatar-pawel-polutek.png',
                'is_vip'      => true,
            ],
            'post_content' => 'Jedna z moich ulubionych piosenek w moim wykonaniu. Mam nadzieję, że się Wam spodoba!',
        ],
    ];
}

/**
 * Pobiera dane slajdów, które zostaną przekazane do frontendu.
 */
function tt_get_slides_data() {
    $user_id         = get_current_user_id();
    $simulated_posts = tt_get_simulated_posts();
    $slides_data     = [];

    foreach ( $simulated_posts as $post ) {
        $slide_id = 'slide-' . str_pad( $post['post_id'], 3, '0', STR_PAD_LEFT );

        $slides_data[] = [
            'id'              => $slide_id,
            'likeId'          => (string) $post['post_id'],
            'title'           => $post['post_title'],
            'author'          => $post['author'],
            'description'     => $post['post_content'],
            'mp4Url'          => $post['video_url'],
            'access'          => $post['access'],
            'initialLikes'    => tt_likes_get_count( $post['post_id'] ),
            'isLiked'         => tt_likes_user_has( $post['post_id'], $user_id ),
            'initialComments' => $post['comments'],
        ];
    }
    return $slides_data;
}

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
            'stripePk'   => defined('TT_STRIPE_PUBLISHABLE_KEY') ? TT_STRIPE_PUBLISHABLE_KEY : 'pk_test_YOUR_PUBLISHABLE_KEY',
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
            'serviceWorkerUrl' => home_url('/sw.js'),
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

// =========================================================================
// 4. HANDLERY AJAX
// =========================================================================

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
            'avatar'              => get_avatar_url($u->ID, ['size' => 96]),
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
add_action( 'wp_ajax_tt_refresh_nonce', function() {
    wp_send_json_success(['nonce' => wp_create_nonce( 'tt_ajax_nonce' )]);
} );
add_action( 'wp_ajax_nopriv_tt_refresh_nonce', function() {
    wp_send_json_success(['nonce' => wp_create_nonce( 'tt_ajax_nonce' )]);
});


// --- Polubienia slajdów ---
add_action( 'wp_ajax_toggle_like', function () {
    check_ajax_referer( 'tt_ajax_nonce', 'nonce' );
    if ( ! is_user_logged_in() ) {
        wp_send_json_error( [ 'message' => 'Musisz się zalogować, aby polubić.' ], 401 );
    }
    $item_id = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;
    if ( ! $item_id ) {
        wp_send_json_error( [ 'message' => 'Brak ID elementu.' ], 400 );
    }
    $user_id = get_current_user_id();
    global $wpdb;
    $table_name = $wpdb->prefix . 'tt_likes';
    if ( tt_likes_user_has( $item_id, $user_id ) ) {
        $wpdb->delete( $table_name, [ 'item_id' => $item_id, 'user_id' => $user_id ] );
        $status = 'unliked';
    } else {
        $wpdb->insert( $table_name, [ 'item_id' => $item_id, 'user_id' => $user_id ] );
        $status = 'liked';
    }
    wp_send_json_success( [ 'status' => $status, 'count'  => tt_likes_get_count( $item_id ) ] );
} );

// --- Komentarze ---
/**
 * Generuje mockowe komentarze.
 *
 * @param int $count Liczba komentarzy do wygenerowania.
 * @return array
 */
function tt_generate_mock_comments($count) {
    $comments = [];
    $users = ['Anna', 'Piotr', 'Kasia', 'Tomek', 'Ewa'];
    $texts = [
        'To jest super!',
        'Świetny filmik, dzięki!',
        'Nie mogę się doczekać kolejnych.',
        'Bardzo inspirujące :)',
        'Haha, dobre!',
    ];

    for ($i = 1; $i <= $count; $i++) {
        $user = $users[array_rand($users)];
        $comments[] = [
            'id'        => $i,
            'parentId'  => null,
            'user'      => $user,
            'avatar'    => 'https://i.pravatar.cc/100?u=' . urlencode($user),
            'text'      => $texts[array_rand($texts)],
            'image_url' => null,
            'timestamp' => (new DateTime("-{$i} minutes"))->format(DateTime::ATOM),
            'likes'     => rand(0, 50),
            'isLiked'   => (bool) rand(0, 1),
            'canEdit'   => false,
        ];
    }
    return $comments;
}

function tt_ajax_get_comments_callback() {
    if (is_user_logged_in()) {
        check_ajax_referer('tt_ajax_nonce', 'nonce');
    }

    global $wpdb;
    $slide_id = isset($_POST['slide_id']) ? sanitize_text_field($_POST['slide_id']) : '';
    if (empty($slide_id)) {
        wp_send_json_error(['message' => 'Brak ID slajdu.'], 400);
    }

    // Sprawdzenie, czy dla danego slajdu są prawdziwe komentarze
    $user_id = get_current_user_id();
    $comments_table = $wpdb->prefix . 'tt_comments';
    $results = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$comments_table} WHERE slide_id = %s ORDER BY created_at ASC",
        $slide_id
    ));

    if (empty($results)) {
        // Jeśli nie ma prawdziwych komentarzy, wygeneruj mockowe
        $post_id = (int) filter_var($slide_id, FILTER_SANITIZE_NUMBER_INT);
        $simulated_posts = tt_get_simulated_posts();
        $post_data = null;
        foreach ($simulated_posts as $post) {
            if ($post['post_id'] === $post_id) {
                $post_data = $post;
                break;
            }
        }
        $comment_count = $post_data ? $post_data['comments'] : 0;
        wp_send_json_success(tt_generate_mock_comments($comment_count));
        return;
    }

    $comments = [];
    foreach ($results as $c) {
        $author_data = get_userdata($c->user_id);
        $comments[] = [
            'id'        => (int) $c->id,
            'parentId'  => $c->parent_id ? (int) $c->parent_id : null,
            'user'      => $author_data ? $author_data->display_name : 'Użytkownik',
            'avatar'    => $author_data ? get_avatar_url($c->user_id) : '',
            'text'      => esc_textarea($c->content),
            'image_url' => isset($c->image_url) ? esc_url($c->image_url) : null,
            'timestamp' => (new DateTime($c->created_at))->format(DateTime::ATOM),
            'likes'     => tt_comment_likes_get_count($c->id),
            'isLiked'   => tt_comment_likes_user_has($c->id, $user_id),
            'canEdit'   => (int) $c->user_id === $user_id || current_user_can('manage_options'),
        ];
    }
    wp_send_json_success($comments);
}
add_action('wp_ajax_tt_get_comments', 'tt_ajax_get_comments_callback');
add_action('wp_ajax_nopriv_tt_get_comments', 'tt_ajax_get_comments_callback');

add_action('wp_ajax_tt_post_comment', function() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz się zalogować.'], 401);
    }

    global $wpdb;
    $slide_id = isset($_POST['slide_id']) ? sanitize_text_field($_POST['slide_id']) : '';
    $text = isset($_POST['text']) ? sanitize_textarea_field(wp_unslash($_POST['text'])) : '';
    $parent_id = isset($_POST['parent_id']) && !empty($_POST['parent_id']) ? absint($_POST['parent_id']) : null;
    $image_url = isset($_POST['image_url']) ? esc_url_raw($_POST['image_url']) : null;

    if (empty($slide_id) || (empty($text) && empty($image_url))) {
        wp_send_json_error(['message' => 'Brakujące dane.'], 400);
    }

    $comments_table = $wpdb->prefix . 'tt_comments';

    $wpdb->insert($comments_table, [
        'slide_id'  => $slide_id,
        'user_id'   => get_current_user_id(),
        'content'   => $text,
        'parent_id' => $parent_id,
        'image_url' => $image_url,
    ]);

    $new_comment_id = $wpdb->insert_id;
    $user_data = get_userdata(get_current_user_id());
    $new_comment_count = tt_comments_get_count($slide_id);

    wp_send_json_success([
        'id'        => $new_comment_id,
        'parentId'  => $parent_id,
        'user'      => $user_data->display_name,
        'avatar'    => get_avatar_url($user_data->ID),
        'text'      => $text,
        'image_url' => $image_url,
        'timestamp' => (new DateTime())->format(DateTime::ATOM),
        'likes'     => 0,
        'isLiked'   => false,
        'canEdit'   => true,
        'new_comment_count' => $new_comment_count,
    ]);
});

add_action('wp_ajax_tt_edit_comment', function() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz się zalogować.'], 401);
    }

    global $wpdb;
    $comment_id = isset($_POST['comment_id']) ? absint($_POST['comment_id']) : 0;
    $new_text = isset($_POST['text']) ? sanitize_textarea_field(wp_unslash($_POST['text'])) : '';

    if (empty($comment_id) || empty($new_text)) {
        wp_send_json_error(['message' => 'Brakujące dane.'], 400);
    }

    $comments_table = $wpdb->prefix . 'tt_comments';
    $comment = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM {$comments_table} WHERE id = %d", $comment_id));

    if (!$comment || ((int) $comment->user_id !== get_current_user_id() && !current_user_can('manage_options'))) {
        wp_send_json_error(['message' => 'Brak uprawnień.'], 403);
    }

    $wpdb->update($comments_table, ['content' => $new_text], ['id' => $comment_id]);

    // Po aktualizacji, pobierz pełne dane komentarza, aby zwrócić je do frontendu
    $updated_comment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$comments_table} WHERE id = %d", $comment_id));
    $author_data = get_userdata($updated_comment->user_id);
    $user_id = get_current_user_id();

    $comment_data = [
        'id'        => (int) $updated_comment->id,
        'parentId'  => $updated_comment->parent_id ? (int) $updated_comment->parent_id : null,
        'user'      => $author_data ? $author_data->display_name : 'Użytkownik',
        'avatar'    => $author_data ? get_avatar_url($updated_comment->user_id) : '',
        'text'      => esc_textarea($updated_comment->content),
        'timestamp' => (new DateTime($updated_comment->created_at))->format(DateTime::ATOM),
        'likes'     => tt_comment_likes_get_count($updated_comment->id),
        'isLiked'   => tt_comment_likes_user_has($updated_comment->id, $user_id),
        'canEdit'   => (int) $updated_comment->user_id === $user_id || current_user_can('manage_options'),
    ];

    wp_send_json_success($comment_data);
});

add_action('wp_ajax_tt_delete_comment', function() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz się zalogować.'], 401);
    }

    global $wpdb;
    $comment_id = isset($_POST['comment_id']) ? absint($_POST['comment_id']) : 0;
    if (empty($comment_id)) {
        wp_send_json_error(['message' => 'Brak ID komentarza.'], 400);
    }

    $comments_table = $wpdb->prefix . 'tt_comments';
    $comment = $wpdb->get_row($wpdb->prepare("SELECT user_id, slide_id FROM {$comments_table} WHERE id = %d", $comment_id));

    if (!$comment || ((int) $comment->user_id !== get_current_user_id() && !current_user_can('manage_options'))) {
        wp_send_json_error(['message' => 'Brak uprawnień.'], 403);
    }

    $slide_id = $comment->slide_id;

    // Usuń polubienia i sam komentarz
    $wpdb->delete($wpdb->prefix . 'tt_comment_likes', ['comment_id' => $comment_id]);
    $wpdb->delete($comments_table, ['id' => $comment_id]);
    // Opcjonalnie: usuń odpowiedzi
    $wpdb->delete($comments_table, ['parent_id' => $comment_id]);

    // Zwróć nową liczbę komentarzy dla slajdu
    $new_comment_count = tt_comments_get_count($slide_id);
    wp_send_json_success(['new_count' => $new_comment_count]);
});

add_action('wp_ajax_tt_toggle_comment_like', function() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz się zalogować.'], 401);
    }

    global $wpdb;
    $comment_id = isset($_POST['comment_id']) ? absint($_POST['comment_id']) : 0;
    if (empty($comment_id)) {
        wp_send_json_error(['message' => 'Brak ID komentarza.'], 400);
    }

    $user_id = get_current_user_id();
    $likes_table = $wpdb->prefix . 'tt_comment_likes';

    if (tt_comment_likes_user_has($comment_id, $user_id)) {
        $wpdb->delete($likes_table, ['comment_id' => $comment_id, 'user_id' => $user_id]);
        $isLiked = false;
    } else {
        $wpdb->insert($likes_table, ['comment_id' => $comment_id, 'user_id' => $user_id]);
        $isLiked = true;
    }

    wp_send_json_success([
        'isLiked' => $isLiked,
        'likes'   => tt_comment_likes_get_count($comment_id),
    ]);
});

// --- Upload obrazu do komentarza ---
add_action('wp_ajax_tt_upload_comment_image', function() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');

    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz się zalogować.'], 401);
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        wp_send_json_error(['message' => 'Nie przesłano pliku.'], 400);
    }

    $file = $_FILES['image'];

    // Walidacja typu
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowed_types)) {
        wp_send_json_error(['message' => 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, GIF, WEBP'], 400);
    }

    // Walidacja rozmiaru (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        wp_send_json_error(['message' => 'Plik jest za duży. Maksymalny rozmiar: 5MB'], 400);
    }

    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');

    $upload_overrides = [
        'test_form' => false,
        'mimes' => [
            'jpg|jpeg|jpe' => 'image/jpeg',
            'gif' => 'image/gif',
            'png' => 'image/png',
            'webp' => 'image/webp'
        ]
    ];

    $movefile = wp_handle_upload($file, $upload_overrides);

    if (isset($movefile['error'])) {
        wp_send_json_error(['message' => $movefile['error']], 500);
    }

    // Utwórz attachment
    $attachment = [
        'post_mime_type' => $movefile['type'],
        'post_title' => sanitize_file_name(pathinfo($movefile['file'], PATHINFO_FILENAME)),
        'post_content' => '',
        'post_status' => 'inherit'
    ];

    $attach_id = wp_insert_attachment($attachment, $movefile['file']);

    if (is_wp_error($attach_id)) {
        wp_send_json_error(['message' => 'Nie udało się utworzyć załącznika.'], 500);
    }

    $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
    wp_update_attachment_metadata($attach_id, $attach_data);

    wp_send_json_success([
        'url' => $movefile['url'],
        'attachment_id' => $attach_id
    ]);
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
        'avatar'              => get_avatar_url($u->ID, ['size' => 96]),
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
        'avatar'       => get_avatar_url($u->ID, ['size' => 96]),
    ]);
});
add_action('wp_ajax_tt_avatar_upload', function () {
    try {
        check_ajax_referer('tt_ajax_nonce', 'nonce');
        if ( ! is_user_logged_in() ) {
            wp_send_json_error(['message' => 'Brak uprawnień: Musisz być zalogowany.'], 401);
        }

        $dataUrl = isset($_POST['image']) ? trim( wp_unslash($_POST['image']) ) : '';
        if (empty($dataUrl) || strpos($dataUrl, 'data:image') !== 0) {
            wp_send_json_error(['message' => 'Błąd danych: Nieprawidłowy format data URL.'], 400);
        }

        if ( ! preg_match('#^data:(image/(?:png|jpeg|gif));base64,(.+)$#', $dataUrl, $matches) ) {
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
        $ext = ($mime === 'image/png') ? 'png' : 'jpg'; // Uproszczenie dla najczęstszych typów
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

    } catch (Throwable $e) {
        // Złap wszystkie błędy krytyczne (w tym błędy parsowania, itp.)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            wp_send_json_error(['message' => 'Krytyczny błąd serwera: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        } else {
            wp_send_json_error(['message' => 'Wystąpił nieoczekiwany błąd serwera.'], 500);
        }
    }
});
// KOREKTA: Filtr awatara musi być wywołany wcześnie, aby działał globalnie
add_filter('pre_get_avatar_data', 'tt_custom_avatar_filter', 10, 2);

function tt_custom_avatar_filter($args, $id_or_email) {
    $user_id = 0;
    if (is_object($id_or_email) && isset($id_or_email->user_id)) {
        $user_id = $id_or_email->user_id;
    } elseif (is_numeric($id_or_email)) {
        $user_id = (int) $id_or_email;
    } elseif (is_string($id_or_email)) {
        $user = get_user_by('email', $id_or_email);
        if ($user) {
            $user_id = $user->ID;
        }
    }

    if ($user_id > 0) {
        // Sprawdź, czy użytkownik ma wgrany niestandardowy awatar
        $custom_avatar_url = get_user_meta($user_id, 'tt_avatar_url', true);
        if (!empty($custom_avatar_url)) {
            $args['url'] = $custom_avatar_url;
            return $args; // Zwróć niestandardowy awatar
        }
    }

    // Jeśli nie ma niestandardowego awatara, użyj domyślnego pliku 'jajk.png'
    $default_avatar_url = get_template_directory_uri() . '/assets/img/jajk.png';
    $args['url'] = $default_avatar_url;
    $args['found_avatar'] = true; // Zapobiegaj dalszemu przetwarzaniu przez Gravatar

    return $args;
}


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


// ============================================================================
// STRIPE PAYMENT INTEGRATION
// ============================================================================

// 4. AJAX Handler for Creating a Payment Intent
function tt_create_payment_intent() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');

    // Weryfikacja: jeśli Composer nie załadował Stripe, to będzie błąd 500.
    if (!class_exists('\\Stripe\\Stripe')) {
        wp_send_json_error(['message' => 'Stripe PHP library not found. Ensure Composer is installed and autoloader is included in functions.php.'], 500);
        return;
    }

    try {
        // Używamy klucza SECRET, który musi być zdefiniowany w wp-config.php
        \Stripe\Stripe::setApiKey(TT_STRIPE_SECRET_KEY);

        $amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0;
        $currency = isset($_POST['currency']) ? strtolower($_POST['currency']) : 'pln';

        // Validate amount according to the minimum rule
        $min_amount = ($currency === 'pln') ? 5.00 : 1.00;

        if ($amount < $min_amount) {
            $error_message = sprintf(
                'The minimum amount for this currency is %s %s.',
                number_format($min_amount, 2),
                strtoupper($currency)
            );
            wp_send_json_error(['message' => $error_message], 400);
            return;
        }

        // Stripe expects amount in the smallest currency unit (e.g., cents, groszy)
        $amount_in_cents = round($amount * 100);

        $payment_intent = \Stripe\PaymentIntent::create([
            'amount' => $amount_in_cents,
            'currency' => $currency,
            'automatic_payment_methods' => ['enabled' => true],
        ]);

        wp_send_json_success(['clientSecret' => $payment_intent->client_secret]);

    } catch (Exception $e) {
        // Błąd API Stripe'a (np. zły klucz lub nieprawidłowy format danych)
        wp_send_json_error(['message' => 'Stripe API Error: ' . $e->getMessage()], 500);
    }
}
add_action('wp_ajax_tt_create_payment_intent', 'tt_create_payment_intent');
add_action('wp_ajax_nopriv_tt_create_payment_intent', 'tt_create_payment_intent'); // Umożliwienie płatności bez logowania


// ============================================================================
// SERVICE WORKER AT ROOT
// ============================================================================
add_action('init', function() {
    add_rewrite_rule('^sw\\.js$', 'index.php?tt_sw=1', 'top');
});

add_filter('query_vars', function($vars) {
    $vars[] = 'tt_sw';
    return $vars;
});

add_action('template_redirect', function() {
    if (get_query_var('tt_sw')) {
        header('Content-Type: application/javascript; charset=utf-8');
        header('Service-Worker-Allowed: /');

        $sw_path = get_template_directory() . '/sw.js';
        if (file_exists($sw_path)) {
            readfile($sw_path);
        }
        exit;
    }
});

// ============================================================================
// DYNAMICZNY MANIFEST PWA
// ============================================================================

/**
 * Rejestracja endpoint dla manifestu PWA
 */
add_action('init', function() {
    add_rewrite_rule('^manifest\.json$', 'index.php?tt_manifest=1', 'top');
    add_rewrite_rule('^tt-manifest\.json$', 'index.php?tt_manifest=1', 'top');
});

/**
 * Dodaj query var dla manifestu
 */
add_filter('query_vars', function($vars) {
    $vars[] = 'tt_manifest';
    return $vars;
});

/**
 * Obsługa żądania manifestu PWA
 */
add_action('template_redirect', function() {
    if (get_query_var('tt_manifest')) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=3600'); // Cache na 1h

        $icon_base_url = get_template_directory_uri() . '/assets/icons/';

        $manifest = [
            'name' => get_bloginfo('name') . ' - Ting Tong',
            'short_name' => 'TingTong',
            'description' => 'Aplikacja wideo w stylu TikTok',
            'start_url' => home_url('/?pwa=1'),
            'scope' => home_url('/'),
            'display' => 'standalone',
            'orientation' => 'portrait',
            'background_color' => '#000000',
            'theme_color' => '#ff0055',
            'icons' => [
                [
                    'src' => $icon_base_url . 'icon-192x192.svg',
                    'sizes' => '192x192',
                    'type' => 'image/svg+xml',
                    'purpose' => 'any maskable'
                ],
                [
                    'src' => $icon_base_url . 'icon-512x512.svg',
                    'sizes' => '512x512',
                    'type' => 'image/svg+xml',
                    'purpose' => 'any maskable'
                ]
            ]
        ];

        echo json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }
});

/**
 * OPCJONALNE: Detekcja PWA mode dla specjalnej logiki
 */
add_action('wp', function() {
    if (isset($_GET['pwa']) && $_GET['pwa'] === '1') {
        // PWA mode detected - możesz tutaj dodać specjalną logikę
        // np. ukryć header/footer WordPress, wyłączyć niepotrzebne skrypty itp.
    }
});

// ============================================================================
// STRIPE WEBHOOK HANDLER
// ============================================================================

/**
* Rejestracja dedykowanego endpointu dla webhooków Stripe.
* Endpoint: /?tt-webhook=stripe
*/
add_action('init', function() {
// Uzywamy add_rewrite_rule zamiast add_rewrite_endpoint, dla większej kompatybilności i prostoty URL.
add_rewrite_rule('^tt-webhook/stripe$', 'index.php?tt-webhook-type=stripe', 'top');
});

add_filter('query_vars', function($vars) {
$vars[] = 'tt-webhook-type';
return $vars;
});

add_action('template_redirect', function() {
$webhook_type = get_query_var('tt-webhook-type');

if ($webhook_type === 'stripe') {
tt_handle_stripe_webhook_logic();
exit;
}
});

/**
* Główna funkcja do przetwarzania webhooków.
* Uruchamiana na serwerze po potwierdzeniu płatności przez Stripe.
*/
function tt_handle_stripe_webhook_logic() {
// Wymagaj autoloader'a Composera i Stripe
$composer_autoload = get_template_directory() . '/vendor/autoload.php';
if (!file_exists($composer_autoload)) {
header('HTTP/1.1 500 Stripe library not loaded', true, 500);
error_log('BŁĄD KRYTYCZNY STRIPE: Nie znaleziono pliku autoload.php.');
exit();
}
require_once $composer_autoload;

// ⚠️ KRYTYCZNE: ZMIEŃ NA SWÓJ TAJNY KLUCZ WEBHOOKA
// Ten klucz znajdziesz w Panelu Stripe -> Developers -> Webhooks -> [Twój endpoint] -> Signing secret.
$webhook_secret = defined('STRIPE_WEBHOOK_SECRET') ? STRIPE_WEBHOOK_SECRET : 'whsec_YOUR_STRIPE_WEBHOOK_SECRET';

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$event = null;

if ($webhook_secret === 'whsec_YOUR_STRIPE_WEBHOOK_SECRET') {
error_log('BŁĄD KONFIGURACJI: STRIPE_WEBHOOK_SECRET nie jest ustawiony w functions.php.');
}

// KROK 1: Weryfikacja sygnatury (kluczowa dla bezpieczeństwa)
try {
$event = \Stripe\Webhook::constructEvent(
$payload, $sig_header, $webhook_secret
);
} catch (\UnexpectedValueException $e) {
header('HTTP/1.1 400 Invalid payload', true, 400);
error_log('Stripe Webhook Error (Payload): ' . $e->getMessage());
exit();
} catch (\Stripe\Exception\SignatureVerificationException $e) {
header('HTTP/1.1 403 Invalid signature', true, 403);
error_log('Stripe Webhook Error (Signature): ' . $e->getMessage());
exit();
} catch (Exception $e) {
header('HTTP/1.1 500 Server Error', true, 500);
error_log('Stripe Webhook Error (General): ' . $e->getMessage());
exit();
}

// KROK 2: Obsługa zdarzenia
switch ($event->type) {
case 'payment_intent.succeeded':
$intent = $event->data->object;
$email = $intent->receipt_email;

if (empty($email)) {
// Jeśli brakuje emaila (co jest rzadkie po stronie Stripe), zwracamy błąd, aby Stripe ponowił próbę
header('HTTP/1.1 500 Email is missing from Payment Intent', true, 500);
error_log('STRIPE WEBHOOK: payment_intent.succeeded - Email is missing for PI: ' . $intent->id);
exit();
}

// Utwórz/pobierz uzytkownika WP
$user_or_error = tt_create_user_from_email_if_not_exists($email);

if (is_wp_error($user_or_error)) {
// Płatność jest OK, więc zwracamy 200, ale logujemy błąd WP
error_log('STRIPE WEBHOOK: WP User Creation Failed for ' . $email . ': ' . $user_or_error->get_error_message());
} else {
error_log('STRIPE WEBHOOK: Patron User ' . $email . ' created or retrieved successfully.');
}

break;
case 'checkout.session.completed':
// Alternatywny scenariusz dla Checkout Session
$session = $event->data->object;
$email = $session->customer_details->email ?? null;

if ($email) {
$user_or_error = tt_create_user_from_email_if_not_exists($email);
if (is_wp_error($user_or_error)) {
error_log('STRIPE WEBHOOK: Checkout Session - WP User Creation Failed for ' . $email . ': ' . $user_or_error->get_error_message());
}
}
break;
default:
// Zdarzenia, które ignorujemy
break;
}

// KROK 3: Zawsze zwracaj 200 OK, jeśli przetwarzanie było pomyślne.
header('HTTP/1.1 200 OK');
exit();
}