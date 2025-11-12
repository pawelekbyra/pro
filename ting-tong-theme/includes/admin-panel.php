<?php
/**
 * Admin panel features, such as the Push Center.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// ============================================================================
// TING TONG PUSH CENTER - PANEL ADMINISTRACYJNY
// ============================================================================

/**
 * Dodaje stronę "Ting Tong Push Center" do menu w panelu administracyjnym.
 */
function tt_add_push_panel() {
    add_menu_page(
        'Ting Tong Push Center',
        'Push Center',
        'manage_options',
        'ting_tong_push_center',
        'tt_render_push_panel',
        'dashicons-bell',
        25
    );
}
add_action('admin_menu', 'tt_add_push_panel');

/**
 * Renderuje zawartość panelu "Ting Tong Push Center".
 */
function tt_render_push_panel() {
    global $wpdb;
    $subscriptions_table = $wpdb->prefix . 'tt_push_subscriptions';
    $total_subscriptions = $wpdb->get_var("SELECT COUNT(*) FROM {$subscriptions_table}");

    ?>
    <div class="wrap">
        <h1>Ting Tong Push Center</h1>
        <p>Panel do wysyłania masowych powiadomień Web Push do subskrybentów.</p>

        <div id="push-dashboard">
            <div id="push-form-container">
                <form id="tt-push-form">
                    <?php wp_nonce_field('tt_admin_send_push_nonce', 'tt_push_nonce'); ?>

                    <h2><span class="dashicons dashicons-admin-generic"></span> Ustawienia Powiadomienia</h2>

                    <table class="form-table">
                        <tr valign="top">
                            <th scope="row"><label for="tt_push_title">Tytuł</label></th>
                            <td><input type="text" id="tt_push_title" name="tt_push_title" class="regular-text" maxlength="50" required />
                            <p class="description">Nagłówek powiadomienia (max 50 znaków).</p></td>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><label for="tt_push_body">Treść</label></th>
                            <td><textarea id="tt_push_body" name="tt_push_body" rows="4" class="large-text" maxlength="150" required></textarea>
                            <p class="description">Główna treść wiadomości (max 150 znaków).</p></td>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><label for="tt_push_url">Docelowy URL</label></th>
                            <td><input type="url" id="tt_push_url" name="tt_push_url" class="regular-text" placeholder="https://app.com/slide-005" />
                            <p class="description">Link, który otworzy się po kliknięciu. Zostaw puste, aby otworzyć stronę główną.</p></td>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><label for="tt_push_badge">Licznik Odznaki</label></th>
                            <td><input type="number" id="tt_push_badge" name="tt_push_badge" class="small-text" min="1" step="1" />
                            <p class="description">Wartość numeryczna dla ikony aplikacji (Badge API).</p></td>
                        </tr>
                    </table>

                    <h2><span class="dashicons dashicons-admin-users"></span> Targetowanie</h2>

                    <table class="form-table">
                        <tr valign="top">
                            <th scope="row">Język</th>
                            <td>
                                <select name="tt_push_language" id="tt_push_language">
                                    <option value="all">Wszystkie</option>
                                    <option value="pl_PL">Polski (pl_PL)</option>
                                    <option value="en_GB">Angielski (en_GB)</option>
                                </select>
                                <p class="description">Filtruj użytkowników na podstawie ich ustawień językowych w profilu.</p>
                            </td>
                        </tr>
                        <tr valign="top">
                            <th scope="row">Grupa Docelowa</th>
                            <td>
                                <fieldset>
                                    <label><input type="radio" name="tt_push_target" value="all" checked="checked" /> Wszyscy Subskrybenci</label><br>
                                    <label><input type="radio" name="tt_push_target" value="patrons" /> Tylko Patroni (dokonali co najmniej jednej donacji)</label><br>
                                    <label><input type="radio" name="tt_push_target" value="incomplete_profile" /> Tylko Wymagający Uzupełnienia Profilu</label>
                                </fieldset>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('Wyślij Powiadomienia'); ?>
                </form>
            </div>
            <div id="push-summary-container">
                <div class="summary-box">
                    <h2><span class="dashicons dashicons-chart-bar"></span> Podsumowanie</h2>
                    <p><strong>Liczba subskrypcji:</strong> <span id="total-subscriptions"><?php echo esc_html($total_subscriptions); ?></span></p>
                    <hr>
                    <div id="push-result-log" style="display:none;">
                        <h3>Wynik Ostatniej Wysyłki:</h3>
                        <div id="log-content"></div>
                    </div>
                     <div id="push-spinner" style="display:none; text-align:center;">
                        <span class="spinner is-active" style="float:none;"></span>
                        <p>Wysyłanie w toku...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <style>
        #push-dashboard { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        #push-form-container { background: #fff; padding: 20px; border-radius: 4px; }
        #push-summary-container .summary-box { background: #fff; padding: 20px; border-radius: 4px; }
        #log-content { max-height: 300px; overflow-y: auto; background: #f9f9f9; border: 1px solid #ccc; padding: 10px; margin-top: 10px; }
        .log-success { color: green; } .log-error { color: red; }
    </style>
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('#tt-push-form').on('submit', function(e) {
                e.preventDefault();

                var formData = $(this).serialize();
                var logContainer = $('#log-content');
                var resultLog = $('#push-result-log');
                var spinner = $('#push-spinner');

                spinner.show();
                resultLog.hide();
                logContainer.html('');

                $.ajax({
                    type: 'POST',
                    url: ajaxurl,
                    data: formData + '&action=tt_admin_send_push',
                    success: function(response) {
                        spinner.hide();
                        if (response.success) {
                            var summary = '<p class="log-success"><strong>Sukces!</strong></p>';
                            summary += '<p>Wysłano pomyślnie: ' + response.data.sent_count + '</p>';
                            summary += '<p>Wygasłe i usunięte: ' + response.data.expired_count + '</p>';
                            logContainer.html(summary);
                        } else {
                            logContainer.html('<p class="log-error"><strong>Błąd:</strong> ' + response.data.message + '</p>');
                        }
                        resultLog.show();
                    },
                    error: function() {
                        spinner.hide();
                        logContainer.html('<p class="log-error"><strong>Błąd:</strong> Wystąpił błąd serwera.</p>');
                        resultLog.show();
                    }
                });
            });
        });
    </script>
    <?php
}

/**
 * Przetwarza żądanie AJAX do wysyłki powiadomień z panelu admina.
 */
function tt_admin_send_push_handler() {
    // Weryfikacja uprawnień i nonce
    if (!current_user_can('manage_options') || !check_ajax_referer('tt_admin_send_push_nonce', 'tt_push_nonce', false)) {
        wp_send_json_error(['message' => 'Brak uprawnień.'], 403);
        return;
    }

    // Pobranie i walidacja danych
    $title = isset($_POST['tt_push_title']) ? sanitize_text_field($_POST['tt_push_title']) : '';
    $body = isset($_POST['tt_push_body']) ? sanitize_textarea_field($_POST['tt_push_body']) : '';
    $url = isset($_POST['tt_push_url']) ? esc_url_raw($_POST['tt_push_url']) : home_url('/');
    $badge = isset($_POST['tt_push_badge']) ? absint($_POST['tt_push_badge']) : 0;
    $language = isset($_POST['tt_push_language']) ? sanitize_text_field($_POST['tt_push_language']) : 'all';
    $target = isset($_POST['tt_push_target']) ? sanitize_text_field($_POST['tt_push_target']) : 'all';

    if (empty($title) || empty($body)) {
        wp_send_json_error(['message' => 'Tytuł i treść są wymagane.'], 400);
        return;
    }

    global $wpdb;
    $subs_table = $wpdb->prefix . 'tt_push_subscriptions';
    $users_table = $wpdb->prefix . 'users';
    $usermeta_table = $wpdb->prefix . 'usermeta';
    $donations_table = $wpdb->prefix . 'tt_donations';

    $query = "SELECT s.* FROM {$subs_table} s";
    $params = [];

    if ($language !== 'all') {
        $query .= " JOIN {$usermeta_table} um ON s.user_id = um.user_id AND um.meta_key = 'locale' AND um.meta_value = %s";
        $params[] = $language;
    }

    if ($target === 'patrons') {
        $query .= " JOIN {$donations_table} d ON s.user_id = d.user_id";
    } elseif ($target === 'incomplete_profile') {
        $query .= " JOIN {$usermeta_table} um_profile ON s.user_id = um_profile.user_id AND um_profile.meta_key = 'tt_first_login_completed' AND um_profile.meta_value = '0'";
    }

    $query .= " GROUP BY s.id"; // Uniknięcie duplikatów

    $subscriptions = $wpdb->get_results($wpdb->prepare($query, $params));

    $sent_count = 0;
    $expired_count = 0;

    foreach ($subscriptions as $subscription) {
        $result = tt_send_push_notification($subscription, $title, $body, $badge, $url);
        if (isset($result['status']) && $result['status'] === 'success') {
            $sent_count++;
        } elseif (isset($result['status']) && $result['status'] === 'expired') {
            $expired_count++;
        }
    }

    wp_send_json_success([
        'sent_count' => $sent_count,
        'expired_count' => $expired_count,
    ]);
}
add_action('wp_ajax_tt_admin_send_push', 'tt_admin_send_push_handler');
