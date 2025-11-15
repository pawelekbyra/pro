<?php
/**
 * Utility functions.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
* Tworzy nowego uzytkownika WordPress, jeśli nie istnieje, lub zwraca istniejącego.
* Ustawia flagę tt_first_login_completed na 0, aby wymusić uzupełnienie profilu.
*
* @param string $email Adres email uzytkownika.
* @return WP_User|WP_Error Obiekt uzytkownika lub błąd.
*/
function tt_create_user_from_email_if_not_exists($email, $locale = 'en_GB') {
if (empty($email) || !is_email($email)) {
return new WP_Error('invalid_email', 'Nieprawidłowy adres email.');
}

// 1. Sprawdź, czy uzytkownik juz istnieje
$user = get_user_by('email', $email);

if ($user) {
        // Zaktualizuj locale, nawet jeśli użytkownik już istnieje
        if (get_user_meta($user->ID, 'locale', true) !== $locale) {
            wp_update_user(['ID' => $user->ID, 'locale' => $locale]);
        }
        return $user;
    }

// 2. Generuj unikalną nazwę uzytkownika (wymagana przez WordPress)
$username_base = sanitize_user(explode('@', $email)[0], true);
$username = $username_base;
$i = 1;
while (username_exists($username)) {
$username = $username_base . $i;
$i++;
}

// 3. Ustaw stałe hasło (lub wygenerowane, jeśli chcesz bezpieczniejsze)
// Zgodnie z życzeniem, ustawiamy stałe hasło: tingtong
$password = 'tingtong'; // <-- STAŁE HASŁO

// 4. Utwórz uzytkownika (domyślnie rola 'subscriber')
$user_id = wp_create_user($username, $password, $email);

if (is_wp_error($user_id)) {
return $user_id;
}

$new_user = get_user_by('id', $user_id);

// 5. Ustaw stan profilu:
// a) Ustaw flagę profilu jako NIEKOMPLETNĄ (0), aby wymusić modal pierwszego logowania.
update_user_meta($user_id, 'tt_first_login_completed', 0);

// b) Zadbaj o to, by pola first_name i last_name były PUSTE (choć domyślnie takie są, to jest to zabezpieczenie)
update_user_meta($user_id, 'first_name', '');
update_user_meta($user_id, 'last_name', '');

// c) Ustaw display_name
    wp_update_user([
        'ID' => $user_id,
        'display_name' => $username,
        'locale' => $locale // USTAW LOKALIZACJĘ
    ]);

// 6. W tym miejscu nalezy DODAĆ WYSYŁKĘ EMAILA z loginem i hasłem (np. 'tingtong').
// UWAGA: Użycie stałego hasła 'tingtong' jest mniej bezpieczne, ale ułatwia logowanie.
// Zawsze powiadom użytkownika, że musi zmienić hasło w modalu.

return $new_user;
}


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


/**
 * Zwraca tablicę symulowanych postów.
 *
 * @return array
 */
function tt_get_simulated_posts() {
    $author_pawel = [
        'name'        => 'Paweł Polutek',
        'description' => 'Cześć! Jestem Paweł Polutek, entuzjasta technologii webowych i twórca tej aplikacji. Dzielę się tutaj moimi eksperymentami i projektami. Zapraszam do oglądania!',
        'avatar'      => get_template_directory_uri() . '/assets/img/avatar-pawel-polutek.png',
        'is_vip'      => true,
        'bio'         => 'Pasjonat-odkrywca zaginionych światów i niestrudzony badacz alternatywnych rzeczywistości.'
    ];

    return [
        [
            'post_id'      => 1,
            'post_title'   => 'Big Buck Bunny',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'access'       => 'public',
            'comments'     => 10,
            'author'       => $author_pawel,
            'post_content' => 'Królik w akcji!',
        ],
        [
            'post_id'      => 2,
            'post_title'   => 'Elephants Dream',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            'access'       => 'secret',
            'comments'     => 20,
            'author'       => $author_pawel,
            'post_content' => 'Sen słonia, tylko dla zalogowanych.',
        ],
        [
            'post_id'      => 3,
            'post_title'   => 'For Bigger Blazes',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'access'       => 'pwa-secret',
            'comments'     => 30,
            'author'       => $author_pawel,
            'post_content' => 'Tajemniczy film tylko dla użytkowników PWA.',
        ],
        [
            'post_id'      => 4,
            'post_title'   => 'Are You Satisfied (Marina and the Diamonds cover)',
            'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            'access'       => 'public',
            'comments'     => 15,
            'author'       => $author_pawel,
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
 * Generuje mockowe komentarze.
 *
 * @param int $count Liczba komentarzy do wygenerowania.
 * @return array
 */
function tt_generate_mock_comments($count) {
    $comments = [];
    $users = [
        ['name' => 'Anna Kowalska', 'avatar' => 'https://i.pravatar.cc/100?u=anna'],
        ['name' => 'Piotr Nowak', 'avatar' => 'https://i.pravatar.cc/100?u=piotr'],
        ['name' => 'Katarzyna Wiśniewska', 'avatar' => 'https://i.pravatar.cc/100?u=kasia'],
        ['name' => 'Tomasz Wójcik', 'avatar' => 'https://i.pravatar.cc/100?u=tomek'],
        ['name' => 'Ewa Dąbrowska', 'avatar' => 'https://i.pravatar.cc/100?u=ewa'],
        ['name' => 'Marcin Lewandowski', 'avatar' => 'https://i.pravatar.cc/100?u=marcin'],
    ];
    $texts = [
        'To jest absolutnie fantastyczne! Dziękuję za udostępnienie.',
        'Świetny materiał wideo, naprawdę daje do myślenia. Czekam na więcej!',
        'Nie mogę się doczekać, co będzie dalej. Trzymam kciuki za projekt!',
        'Bardzo inspirujące i motywujące. Oby tak dalej! :)',
        'Haha, to jest genialne! Poprawiło mi humor na cały dzień.',
        'Wow, jakość produkcji jest na najwyższym poziomie. Profesjonalna robota!',
        'Czy ktoś wie, jaka to piosenka w tle? Jest niesamowita.',
        'Zgadzam się z poprzednimi komentarzami. Super robota!',
        'Mam pytanie: czy planujesz zrobić z tego serię? Bo ja bym oglądał!',
        'To jest jeden z najlepszych filmików, jakie ostatnio widziałem. Szacun!',
    ];

    $comment_id_counter = 1;
    $parent_comments = [];

    // Create 4 parent comments
    for ($i = 0; $i < 4; $i++) {
        $user_data = $users[array_rand($users)];
        $comment = [
            'id'        => $comment_id_counter,
            'parentId'  => null,
            'user'      => $user_data['name'],
            'avatar'    => $user_data['avatar'],
            'text'      => $texts[array_rand($texts)],
            'image_url' => null,
            'timestamp' => (new DateTime("-{$comment_id_counter} hours"))->format(DateTime::ATOM),
            'likes'     => rand(0, 150),
            'isLiked'   => (bool) rand(0, 1),
            'canEdit'   => false,
        ];
        $comments[] = $comment;
        $parent_comments[] = $comment_id_counter;
        $comment_id_counter++;
    }

    // Create replies for each parent comment
    foreach ($parent_comments as $parent_id) {
        $replies_count = rand(1, 3);
        for ($j = 0; $j < $replies_count; $j++) {
            $user_data = $users[array_rand($users)];
            $comment = [
                'id'        => $comment_id_counter,
                'parentId'  => $parent_id,
                'user'      => $user_data['name'],
                'avatar'    => $user_data['avatar'],
                'text'      => $texts[array_rand($texts)],
                'image_url' => null,
                'timestamp' => (new DateTime("-{$comment_id_counter} minutes"))->format(DateTime::ATOM),
                'likes'     => rand(0, 50),
                'isLiked'   => (bool) rand(0, 1),
                'canEdit'   => false,
            ];
            $comments[] = $comment;
            $comment_id_counter++;
        }
    }

    // Sortuj komentarze po dacie (najnowsze na dole)
    usort($comments, function($a, $b) {
        return strtotime($a['timestamp']) - strtotime($b['timestamp']);
    });

    return $comments;
}


// ============================================================================
// CUSTOM AVATAR LOGIC
// ============================================================================

/**
 * Gets a user's custom avatar URL, falling back to the site default.
 * This is the primary function to get a user's avatar for API responses.
 *
 * @param int|WP_User $user_id User ID or WP_User object.
 * @return string The URL of the avatar.
 */
function tt_get_user_avatar_url($user_id) {
    if ($user_id instanceof WP_User) {
        $user_id = $user_id->ID;
    }

    if ( ! is_numeric($user_id) || $user_id <= 0) {
        return get_template_directory_uri() . '/jajk.png';
    }

    $custom_avatar_url = get_user_meta($user_id, 'tt_avatar_url', true);

    if (!empty($custom_avatar_url) && filter_var($custom_avatar_url, FILTER_VALIDATE_URL)) {
        return $custom_avatar_url;
    }

    // Fallback to the default if no custom avatar is found.
    return get_template_directory_uri() . '/jajk.png';
}

/**
 * Filters the avatar data to use a custom uploaded avatar or a local default.
 * This function bypasses Gravatar and enforces a local default avatar
 * for users who have not uploaded their own.
 *
 * @param array $args Arguments passed to get_avatar_data().
 * @param mixed $id_or_email The user identifier.
 * @return array The modified arguments.
 */
function tt_custom_avatar_filter($args, $id_or_email) {
    // We only want to filter on the front-end
    if (is_admin()) {
        return $args;
    }

    $user_id = false;
    if ($id_or_email instanceof WP_User) {
        $user_id = $id_or_email->ID;
    } elseif (is_numeric($id_or_email)) {
        $user_id = (int) $id_or_email;
    } elseif (is_string($id_or_email) && is_email($id_or_email)) {
        $user = get_user_by('email', $id_or_email);
        if ($user) {
            $user_id = $user->ID;
        }
    } elseif ($id_or_email instanceof WP_Comment) {
        $user_id = (int) $id_or_email->user_id;
    }

    $default_avatar_url = get_template_directory_uri() . '/jajk.png';

    if ($user_id) {
        // Check for the custom uploaded avatar URL first
        $custom_avatar_url = get_user_meta($user_id, 'tt_avatar_url', true);
        if (!empty($custom_avatar_url) && filter_var($custom_avatar_url, FILTER_VALIDATE_URL)) {
            $args['url'] = $custom_avatar_url;
        } else {
            // User exists but has no custom avatar, use our default
            $args['url'] = $default_avatar_url;
        }
    } else {
        // User not found or comment from a guest, use our default
        $args['url'] = $default_avatar_url;
    }

    // Force 'found' to be true to prevent Gravatar fallback
    $args['found_avatar'] = true;

    return $args;
}
add_filter('pre_get_avatar_data', 'tt_custom_avatar_filter', 99, 2);

/**
 * Generuje obiekt SSO dla FastComments zgodnie z dokumentacją.
 *
 * @param WP_User|null $user Obiekt użytkownika WordPress.
 * @return array|null Obiekt SSO lub null w przypadku braku klucza.
 */
function tt_fastcomments_generate_sso_token($user) {
    if (!defined('FASTCOMMENTS_SSO_SECRET_KEY')) {
        error_log('BŁĄD FASTCOMMENTS: Brak stałej FASTCOMMENTS_SSO_SECRET_KEY.');
        return null;
    }

    $secret_key = FASTCOMMENTS_SSO_SECRET_KEY;

    // Zalogowany użytkownik
    if ($user && $user->ID !== 0) {
        $userData = [
            'id'       => (string) $user->ID,
            'email'    => $user->user_email,
            'username' => $user->display_name,
            'avatar'   => tt_get_user_avatar_url($user->ID),
        ];

        $userDataJSON = json_encode($userData);
        $userDataJSONBase64 = base64_encode($userDataJSON);
        $timestamp = time();
        $verificationHash = hash_hmac('sha256', $timestamp . $userDataJSONBase64, $secret_key);

        return [
            'userDataJSONBase64' => $userDataJSONBase64,
            'verificationHash'   => $verificationHash,
            'timestamp'          => $timestamp,
            'loginURL'           => '#', // URL zostanie obsłużony przez JS
            'logoutURL'          => wp_logout_url(home_url()),
        ];
    }

    // Gość
    return [
        'loginURL' => '#', // URL zostanie obsłużony przez JS
    ];
}
