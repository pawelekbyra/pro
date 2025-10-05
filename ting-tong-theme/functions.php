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
			'post_title'   => 'Paweł Polutek',
			'post_content' => 'To jest dynamicznie załadowany opis dla pierwszego slajdu. Działa!',
			'video_url'    => 'https://pawelperfect.pl/wp-content/uploads/2025/07/17169505-hd_1080_1920_30fps.mp4',
			'access'       => 'public',
			'avatar'       => 'https://i.pravatar.cc/100?u=pawel',
		],
		[
			'post_id'      => 2,
			'post_title'   => 'Web Dev',
			'post_content' => 'Kolejny slajd, kolejne wideo. #efficiency',
			'video_url'    => 'https://pawelperfect.pl/wp-content/uploads/2025/07/4434150-hd_1080_1920_30fps-1.mp4',
			'access'       => 'public',
			'avatar'       => 'https://i.pravatar.cc/100?u=webdev',
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
	wp_enqueue_style( 'swiper-css', 'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.css', [], '12.0.2' );
	wp_enqueue_style( 'tingtong-style', get_stylesheet_uri(), [ 'swiper-css' ], '1.0.1' );

	wp_enqueue_script( 'swiper-js', 'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.js', [], '12.0.2', true );
	wp_enqueue_script( 'tingtong-script', get_template_directory_uri() . '/script.js', [ 'jquery', 'swiper-js' ], '1.0.1', true );

	wp_localize_script(
		'tingtong-script',
		'TingTongData',
		[
			'isLoggedIn' => is_user_logged_in(),
			'slides'     => tt_get_slides_data(),
		]
	);

	wp_localize_script(
		'tingtong-script',
		'ajax_object',
		[
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'tt_ajax_nonce' ),
		]
	);
}
add_action( 'wp_enqueue_scripts', 'tt_enqueue_and_localize_scripts' );

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
add_action( 'wp_ajax_nopriv_tt_ajax_login', function () {
	check_ajax_referer( 'tt_ajax_nonce', 'nonce' );

	$login_data = [
		'user_password' => isset( $_POST['pwd'] ) ? $_POST['pwd'] : '',
		'remember'      => true,
	];

	$user_login = isset( $_POST['log'] ) ? wp_unslash( $_POST['log'] ) : '';

	if ( is_email( $user_login ) ) {
		$login_data['user_login'] = sanitize_email( $user_login );
	} else {
		$login_data['user_login'] = sanitize_user( $user_login );
	}

	$user = wp_signon( $login_data, is_ssl() );

	if ( is_wp_error( $user ) ) {
		wp_send_json_error( [ 'message' => 'Błędne dane logowania.' ] );
	} else {
		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true, is_ssl() );
		wp_send_json_success( [ 'message' => 'Zalogowano pomyślnie.' ] );
	}
} );
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
add_action( 'wp_ajax_tt_get_comments', function() {
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

    if (empty($slide_id) || empty($text)) {
        wp_send_json_error(['message' => 'Brakujące dane.'], 400);
    }

    $comments_table = $wpdb->prefix . 'tt_comments';
    $wpdb->insert($comments_table, [
        'slide_id'  => $slide_id,
        'user_id'   => get_current_user_id(),
        'content'   => $text,
        'parent_id' => $parent_id,
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
    check_ajax_referer('tt_ajax_nonce', 'nonce');
    if ( ! is_user_logged_in() ) {
        wp_send_json_error(['message' => 'not_logged_in'], 401);
    }
    $dataUrl = isset($_POST['image']) ? trim( wp_unslash($_POST['image']) ) : '';
    if (empty($dataUrl) || strpos($dataUrl, 'data:image') !== 0) {
        wp_send_json_error(['message' => 'Brak lub błędny obraz.'], 400);
    }
    if ( ! preg_match('#^data:(image/[^;]+);base64,(.+)$#', $dataUrl, $m) ) {
        wp_send_json_error(['message' => 'Nieprawidłowy format obrazu.'], 400);
    }
    $mime = strtolower($m[1]);
    $bin = base64_decode($m[2]);
    if ( ! $bin || strlen($bin) > 2 * 1024 * 1024) {
        wp_send_json_error(['message' => 'Błąd dekodowania lub plik za duży.'], 400);
    }
    if ( ! function_exists('wp_handle_sideload') ) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
    }
    $u = wp_get_current_user();
    $ext = ($mime === 'image/png') ? 'png' : 'jpg';
    $filename = 'tt-avatar-' . (int) $u->ID . '-' . time() . '.' . $ext;
    $tmp = wp_tempnam($filename);
    file_put_contents($tmp, $bin);
    $file_array = ['name' => $filename, 'type' => $mime, 'tmp_name' => $tmp, 'error' => 0, 'size' => filesize($tmp)];
    $file = wp_handle_sideload($file_array, ['test_form' => false]);
    @unlink($tmp);
    if (isset($file['error'])) {
        wp_send_json_error(['message' => 'Upload nieudany: ' . $file['error']], 500);
    }
    $attach_id = wp_insert_attachment(['post_mime_type' => $mime, 'post_title' => $filename, 'post_content' => '', 'post_status' => 'inherit'], $file['file']);
    if (is_wp_error($attach_id)) {
        wp_send_json_error(['message' => 'Nie można utworzyć załącznika.'], 500);
    }
    wp_update_attachment_metadata($attach_id, wp_generate_attachment_metadata($attach_id, $file['file']));
    update_user_meta($u->ID, 'tt_avatar_id',  $attach_id);
    $url = wp_get_attachment_url($attach_id);
    update_user_meta($u->ID, 'tt_avatar_url', esc_url_raw($url));
    wp_send_json_success(['url' => $url, 'attachment_id' => $attach_id]);
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
 * Wyłącza cachowanie strony poprzez wysyłanie odpowiednich nagłówków.
 */
function tt_disable_caching() {
    if (!is_user_logged_in()) {
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
    }
}
add_action('init', 'tt_disable_caching');

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