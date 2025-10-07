<?php
/**
 * Plik functions.php dla motywu Ting Tong.
 *
 * Zawiera całą logikę backendową dla aplikacji opartej na WordPressie.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Zabezpieczenie przed bezpośrednim dostępem.
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
 * Pobiera dane slajdów, które zostaną przekazane do frontendu.
 */
function tt_get_slides_data() {
	$user_id = get_current_user_id();

	// Symulujemy pobieranie postów z bazy danych
	$simulated_posts = [
		[
			'post_id'      => 1,
			'post_title'   => 'Big Buck Bunny',
			'post_content' => 'Królik w akcji!',
			'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
			'access'       => 'public',
			'comments'     => 10,
			'avatar'       => 'https://i.pravatar.cc/100?u=bunny',
		],
		[
			'post_id'      => 2,
			'post_title'   => 'Elephants Dream',
			'post_content' => 'Sen słonia, tylko dla zalogowanych.',
			'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
			'access'       => 'secret',
			'comments'     => 20,
			'avatar'       => 'https://i.pravatar.cc/100?u=elephant',
		],
		[
			'post_id'      => 3,
			'post_title'   => 'For Bigger Blazes',
			'post_content' => 'Tajemniczy film tylko dla użytkowników PWA.',
			'video_url'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
			'access'       => 'pwa-secret',
			'comments'     => 30,
			'avatar'       => 'https://i.pravatar.cc/100?u=blaze',
		],
	];

	$slides_data = [];
	foreach ( $simulated_posts as $post ) {
		$slide_id = 'slide-' . str_pad( $post['post_id'], 3, '0', STR_PAD_LEFT );

		$slides_data[] = [
			'id'              => $slide_id,
			'likeId'          => (string) $post['post_id'],
			'user'            => $post['post_title'],
			'description'     => $post['post_content'],
			'mp4Url'          => $post['video_url'],
			'avatar'          => $post['avatar'],
			'access'          => $post['access'],
			'initialLikes'    => tt_likes_get_count( $post['post_id'] ),
			'isLiked'         => tt_likes_user_has( $post['post_id'], $user_id ),
			'initialComments' => tt_comments_get_count( $slide_id ),
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

	wp_enqueue_script( 'swiper-js', 'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.js', [], null, true );
	wp_enqueue_script( 'tingtong-app-script', get_template_directory_uri() . '/js/app.js', [ 'swiper-js' ], null, true );

	wp_localize_script(
		'tingtong-app-script',
		'TingTongData',
		[
			'isLoggedIn' => is_user_logged_in(),
			'slides'     => tt_get_slides_data(),
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
        wp_send_json_error(['message' => 'Błędne dane logowania.']);
    } else {
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true, is_ssl());

        // Przygotuj pełne dane użytkownika
        $u = wp_get_current_user();
        $first_name = get_user_meta($u->ID, 'first_name', true);
        $last_name = get_user_meta($u->ID, 'last_name', true);

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
            'is_profile_complete' => ! empty($first_name) && ! empty($last_name),
        ];

        // Zwróć odpowiedź
        wp_send_json_success([
            'message'    => 'Zalogowano pomyślnie.',
            'userData'   => $user_data,
            'slidesData' => tt_get_slides_data(),
            'new_nonce'  => wp_create_nonce('tt_ajax_nonce'),
        ]);
    }
});
add_action( 'wp_ajax_tt_ajax_logout', function () {
	check_ajax_referer( 'tt_ajax_nonce', 'nonce' );
	wp_logout();
	wp_send_json_success( [ 'message' => 'Wylogowano pomyślnie.' ] );
} );
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
add_action('wp_ajax_tt_get_comments', function() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    global $wpdb;
    $slide_id = isset($_POST['slide_id']) ? sanitize_text_field($_POST['slide_id']) : '';
    if (empty($slide_id)) {
        wp_send_json_error(['message' => 'Brak ID slajdu.'], 400);
    }

    $user_id = get_current_user_id();
    $comments_table = $wpdb->prefix . 'tt_comments';
    $results = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$comments_table} WHERE slide_id = %s ORDER BY created_at ASC",
        $slide_id
    ));

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
});

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
    wp_send_json_success([
        'user_id'      => (int) $u->ID,
        'username'     => $u->user_login,
        'email'        => $u->user_email,
        'display_name' => $u->display_name,
        'first_name'   => (string) get_user_meta($u->ID, 'first_name', true),
        'last_name'    => (string) get_user_meta($u->ID, 'last_name',  true),
        'avatar'       => get_avatar_url($u->ID, ['size' => 96]),
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


// =========================================================================
// 5. SHORTCODES I FILTRY
// =========================================================================

/**
 * Shortcode [tt_login_form] generujący formularz dla AJAX.
 */
add_shortcode( 'tt_login_form', function() {
	if ( is_user_logged_in() ) {
		return '<p style="padding: 20px; text-align: center;">Jesteś już zalogowany.</p>';
	}
	return '<form name="loginform" class="login-form" action="#" method="post">
        <p><label for="user_login">Nazwa użytkownika lub e-mail</label><input type="text" name="log" id="user_login" class="input" value="" size="20" required autocomplete="username"></p>
        <p><label for="user_pass">Hasło</label><input type="password" name="pwd" id="user_pass" class="input" value="" size="20" required autocomplete="current-password"></p>
        <p><input type="submit" name="wp-submit" id="wp-submit" class="button button-primary" value="Zaloguj się"></p>
    </form>';
});

/**
 * Filtr get_avatar_url, aby preferować niestandardowy avatar.
 */
add_filter('get_avatar_url', function ($url, $id_or_email, $args) {
    $user_id = 0;
    if (is_numeric($id_or_email)) $user_id = (int) $id_or_email;
    elseif (is_object($id_or_email) && isset($id_or_email->user_id)) $user_id = (int) $id_or_email->user_id;
    elseif (is_string($id_or_email) && ($user = get_user_by('email', $id_or_email))) $user_id = (int) $user->ID;

    if ($user_id > 0) {
        $custom = get_user_meta($user_id, 'tt_avatar_url', true);
        if ($custom) return esc_url($custom);
    }
    return $url;
}, 10, 3);

/**
 * Handler AJAX do uzupełniania profilu po pierwszym logowaniu.
 * Aktualizuje imię, nazwisko, hasło i preferencje email.
 */
add_action('wp_ajax_tt_complete_profile', function () {
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Musisz być zalogowany.'], 401);
    }

    $u = wp_get_current_user();

    // Sanityzacja i walidacja danych wejściowych
    $first_name = isset($_POST['first_name']) ? sanitize_text_field(wp_unslash($_POST['first_name'])) : '';
    $last_name = isset($_POST['last_name']) ? sanitize_text_field(wp_unslash($_POST['last_name'])) : '';
    $new_password = isset($_POST['new_password']) ? wp_unslash($_POST['new_password']) : '';
    $email_consent = isset($_POST['email_consent']) ? filter_var($_POST['email_consent'], FILTER_VALIDATE_BOOLEAN) : false;
    $email_language = isset($_POST['email_language']) && in_array($_POST['email_language'], ['pl', 'en']) ? $_POST['email_language'] : 'pl';

    if (empty($first_name) || empty($last_name)) {
        wp_send_json_error(['message' => 'Imię i nazwisko są wymagane.'], 400);
    }

    // Aktualizacja metadanych użytkownika
    update_user_meta($u->ID, 'first_name', $first_name);
    update_user_meta($u->ID, 'last_name', $last_name);
    update_user_meta($u->ID, 'tt_email_consent', $email_consent);
    update_user_meta($u->ID, 'tt_email_language', $email_language);

    // Aktualizacja display_name
    $display_name = trim($first_name . ' ' . $last_name);
    if (!empty($display_name)) {
        wp_update_user(['ID' => $u->ID, 'display_name' => $display_name]);
    }

    // Aktualizacja hasła (jeśli zostało podane)
    if (!empty($new_password)) {
        if (strlen($new_password) < 8) {
            wp_send_json_error(['message' => 'Hasło musi mieć co najmniej 8 znaków.'], 400);
        }
        wp_set_password($new_password, $u->ID);
    }

    // Przygotuj zaktualizowane dane użytkownika do zwrotu
    $updated_user_data = [
        'user_id'             => (int) $u->ID,
        'username'            => $u->user_login,
        'email'               => $u->user_email,
        'display_name'        => $display_name,
        'first_name'          => $first_name,
        'last_name'           => $last_name,
        'avatar'              => get_avatar_url($u->ID, ['size' => 96]),
        'email_consent'       => $email_consent,
        'email_language'      => $email_language,
        'is_profile_complete' => true, // Profil jest teraz kompletny
    ];

    wp_send_json_success([
        'message'   => 'Profil został pomyślnie zaktualizowany.',
        'userData'  => $updated_user_data,
        'new_nonce' => wp_create_nonce('tt_ajax_nonce'),
    ]);
});
// Dodaj do functions.php
add_filter('rest_authentication_errors', function($result) {
    if (!empty($result)) {
        return $result;
    }
    return true;
});
