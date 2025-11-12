<?php
/**
 * PWA features: Service Worker, Manifest, Web Push.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// --- Subskrypcje Web Push ---

/**
 * Obsługuje żądanie AJAX do zapisania subskrypcji Web Push dla zalogowanych i gości.
 * Dla gości używa user_id = 0.
 */
function tt_ajax_save_push_subscription_callback() {
    // Ręczna weryfikacja nonce z nagłówka dla żądań JSON
    $nonce = isset($_SERVER['HTTP_X_WP_NONCE']) ? $_SERVER['HTTP_X_WP_NONCE'] : '';
    if (!wp_verify_nonce($nonce, 'tt_ajax_nonce')) {
        wp_send_json_error(['message' => 'Błąd weryfikacji nonce.'], 403);
        return;
    }

    // FIX: Usunięto warunek if (!is_user_logged_in()), aby umożliwić gościom subskrypcję.

    // Odczytaj dane z ciała żądania JSON
    $subscription_data = json_decode(file_get_contents('php://input'), true);
    if (empty($subscription_data['endpoint']) || empty($subscription_data['keys']['p256dh']) || empty($subscription_data['keys']['auth'])) {
        wp_send_json_error(['message' => 'Nieprawidłowe dane subskrypcji.'], 400);
        return;
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'tt_push_subscriptions';

    // FIX: get_current_user_id() zwróci 0 dla gości, co jest poprawną wartością.
    $user_id = get_current_user_id();
    $endpoint = esc_url_raw($subscription_data['endpoint']);
    $p256dh = sanitize_text_field($subscription_data['keys']['p256dh']);
    $auth = sanitize_text_field($subscription_data['keys']['auth']);

    $existing_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table_name} WHERE endpoint = %s", $endpoint));

    $data = [
        'user_id' => $user_id, // Używamy ID (lub 0)
        'endpoint' => $endpoint,
        'p256dh' => $p256dh,
        'auth' => $auth,
    ];

    if ($existing_id) {
        // Jeśli subskrypcja (endpoint) już istnieje, zaktualizuj ją
        $wpdb->update($table_name, $data, ['id' => $existing_id]);
    } else {
        // W przeciwnym razie, wstaw nową
        $wpdb->insert($table_name, $data);
    }

    wp_send_json_success(['message' => 'Subskrypcja zapisana pomyślnie.']);
}

// FIX: Rejestracja handlera dla zalogowanych (wp_ajax_) i niezalogowanych (wp_ajax_nopriv_)
add_action('wp_ajax_tt_save_push_subscription', 'tt_ajax_save_push_subscription_callback');
add_action('wp_ajax_nopriv_tt_save_push_subscription', 'tt_ajax_save_push_subscription_callback');

// ============================================================================
// SERVICE WORKER AT ROOT
// ============================================================================
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
    add_rewrite_rule('^manifest\\.json$', 'index.php?tt_manifest=1', 'top');
    add_rewrite_rule('^tt-manifest\\.json$', 'index.php?tt_manifest=1', 'top');
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

/**
 * Wysyła powiadomienie Web Push do pojedynczej subskrypcji.
 *
 * @param object $subscription_data Obiekt subskrypcji z bazy danych.
 * @param string $title Tytuł powiadomienia.
 * @param string $body Treść powiadomienia.
 * @param int    $badge_count Liczba na odznace aplikacji.
 * @param string $url URL do otwarcia po kliknięciu.
 * @return array Wynik wysyłki.
 */
function tt_send_push_notification($subscription_data, $title, $body, $badge_count = 0, $url = '') {
    if (!defined('TT_VAPID_PUBLIC_KEY') || !defined('TT_VAPID_PRIVATE_KEY') || !defined('TT_VAPID_SUBJECT')) {
        return ['status' => 'error', 'message' => 'VAPID keys not configured.'];
    }

    $auth = [
        'VAPID' => [
            'subject' => TT_VAPID_SUBJECT,
            'publicKey' => TT_VAPID_PUBLIC_KEY,
            'privateKey' => TT_VAPID_PRIVATE_KEY,
        ],
    ];

    $webPush = new WebPush($auth);

    $payload = json_encode([
        'title' => $title,
        'body' => $body,
        'badge' => (int) $badge_count,
        'icon' => get_template_directory_uri() . '/assets/icons/icon-192x192.svg',
        'data' => ['url' => $url ?: home_url('/')]
    ]);

    $subscription = Subscription::create([
        'endpoint' => $subscription_data->endpoint,
        'publicKey' => $subscription_data->p256dh,
        'authToken' => $subscription_data->auth,
    ]);

    $report = $webPush->sendOneNotification($subscription, $payload);

    if ($report->isSuccess()) {
        return ['status' => 'success'];
    } else {
        // Jeśli subskrypcja wygasła, usuń ją
        if ($report->getResponse() && $report->getResponse()->getStatusCode() === 410) {
            global $wpdb;
            $wpdb->delete($wpdb->prefix . 'tt_push_subscriptions', ['id' => $subscription_data->id]);
            return ['status' => 'expired'];
        }
        return ['status' => 'failed', 'message' => $report->getReason()];
    }
}
