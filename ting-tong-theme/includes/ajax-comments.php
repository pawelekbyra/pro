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
            $display_data = tt_get_comment_display_data($new_comment);
            wp_send_json_success($display_data);
        } else {
            wp_send_json_error('Failed to add comment.');
        }
    }

    if ($action === 'tt_get_comments') {
        $slide_id = intval($_POST['slide_id']);
        $comments = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table_name WHERE slide_id = %d ORDER BY date DESC", $slide_id));
        $processed_comments = array_map('tt_get_comment_display_data', $comments);
        wp_send_json_success($processed_comments);
    }

    wp_die();
}
