<?php
/**
 * Database table creation.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
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

    // Tabela: Donacje
    $table_name_donations = $wpdb->prefix . 'tt_donations';
    $sql_donations        = "CREATE TABLE {$table_name_donations} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        payment_intent_id VARCHAR(255) NOT NULL,
        amount_cents BIGINT UNSIGNED NOT NULL,
        currency VARCHAR(10) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_payment_intent (payment_intent_id(191)),
        KEY idx_user_id (user_id)
    ) {$charset_collate};";
    dbDelta($sql_donations);
    update_option('tt_donations_db_version', '1.0');

    // Tabela: Subskrypcje Web Push
    $table_name_push = $wpdb->prefix . 'tt_push_subscriptions';
    $sql_push = "CREATE TABLE {$table_name_push} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        endpoint VARCHAR(512) NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_endpoint (endpoint(191)),
        KEY idx_user_id (user_id)
    ) {$charset_collate};";
    dbDelta($sql_push);
    update_option('tt_push_subscriptions_db_version', '1.0');

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
            || get_option( 'tt_comment_likes_db_version' ) !== '1.0'
            || get_option('tt_donations_db_version') !== '1.0'
            || get_option('tt_push_subscriptions_db_version') !== '1.0') {
            tt_create_database_tables();
        }
    }
);
