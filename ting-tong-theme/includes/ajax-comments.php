<?php

// Silence is golden.
// adding new code from here

add_action('wp_ajax_tt_post_comment', 'tt_comment_controller');
add_action('wp_ajax_nopriv_tt_post_comment', 'tt_comment_controller');
add_action('wp_ajax_tt_get_comments', 'tt_comment_controller');
add_action('wp_ajax_nopriv_tt_get_comments', 'tt_comment_controller');

function tt_comment_controller() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tt_comments';

    check_ajax_referer('tt_ajax_nonce', 'nonce');

    $action = $_POST['action'];

    if ($action === 'tt_post_comment') {
        $slide_id = intval($_POST['slide_id']);
        $content = sanitize_textarea_field($_POST['content']);
        $user_id = get_current_user_id();

        $result = $wpdb->insert(
            $table_name,
            array(
                'slide_id' => $slide_id,
                'user_id' => $user_id,
                'content' => $content,
                'date' => current_time('mysql')
            ),
            array(
                '%d',
                '%d',
                '%s',
                '%s'
            )
        );

        if ($result) {
            $new_comment = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $wpdb->insert_id));

            $user_data = get_userdata($new_comment->user_id);
            $new_comment->author_name = $user_data ? $user_data->display_name : 'Anonymous';
            $new_comment->author_avatar = get_avatar_url($new_comment->user_id);
            $new_comment->timestamp = human_time_diff(strtotime($new_comment->date), current_time('timestamp')) . ' ago';

            wp_send_json_success($new_comment);
        } else {
            wp_send_json_error('Failed to add comment.');
        }
    }

    if ($action === 'tt_get_comments') {
        $slide_id = intval($_POST['slide_id']);
        $comments = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table_name WHERE slide_id = %d ORDER BY date DESC", $slide_id));

        foreach ($comments as $comment) {
            $user_data = get_userdata($comment->user_id);
            $comment->author_name = $user_data ? $user_data->display_name : 'Anonymous';
            $comment->author_avatar = get_avatar_url($comment->user_id);
            $comment->timestamp = human_time_diff(strtotime($comment->date), current_time('timestamp')) . ' ago';
        }

        wp_send_json_success($comments);
    }

    wp_die();
}
