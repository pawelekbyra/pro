<?php
/**
 * AJAX handlers for comments and likes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

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
