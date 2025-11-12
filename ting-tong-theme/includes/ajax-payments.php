<?php
/**
 * AJAX handlers for Stripe payment integration.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// ============================================================================
// STRIPE PAYMENT INTEGRATION
// ============================================================================

// 4. AJAX Handler for Creating a Payment Intent
function tt_create_payment_intent() {
    // --- TYMCZASOWY KOD DIAGNOSTYCZNY (USUŃ PO NAPRAWIE BŁĘDU) ---
    // Wymusza wyświetlanie błędów PHP
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    // --- KONIEC TYMCZASOWEGO KODU DIAGNOSTYCZNEGO ---

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
        $country_code_hint = isset($_POST['country_code_hint']) ? sanitize_text_field($_POST['country_code_hint']) : null; // POBIERZ HINT

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

        $metadata = [];
        if ($country_code_hint) {
            $metadata['country_hint'] = $country_code_hint; // ZAPIS HINTU W METADANYCH
        }

        $payment_intent = \Stripe\PaymentIntent::create([
            'amount' => $amount_in_cents,
            'currency' => $currency,
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => $metadata, // PRZEKAŻ METADANE
        ]);

        wp_send_json_success(['clientSecret' => $payment_intent->client_secret]);

    } catch (Exception $e) {
        // Błąd API Stripe'a (np. zły klucz lub nieprawidłowy format danych)
        wp_send_json_error(['message' => 'Stripe API Error: ' . $e->getMessage()], 500);
    }
}
add_action('wp_ajax_tt_create_payment_intent', 'tt_create_payment_intent');
add_action('wp_ajax_nopriv_tt_create_payment_intent', 'tt_create_payment_intent'); // Umożliwienie płatności bez logowania

/**
 * Obsługuje potwierdzenie sukcesu napiwku po stronie klienta.
 * Jego główną rolą jest potwierdzenie, że proces na froncie się zakończył.
 * Główna logika (tworzenie użytkownika) jest obsługiwana przez webhook.
 */
function tt_handle_tip_success() {
    check_ajax_referer('tt_ajax_nonce', 'nonce');

    $payment_intent_id = isset($_POST['payment_intent_id']) ? sanitize_text_field($_POST['payment_intent_id']) : '';

    if (empty($payment_intent_id)) {
        wp_send_json_error(['message' => 'Brak ID Payment Intent.'], 400);
        return;
    }

    // Można dodać logowanie w celu debugowania
    // error_log('Potwierdzenie sukcesu napiwku dla Payment Intent: ' . $payment_intent_id);

    wp_send_json_success(['message' => 'Tip success acknowledged.']);
}
add_action('wp_ajax_tt_handle_tip_success', 'tt_handle_tip_success');
add_action('wp_ajax_nopriv_tt_handle_tip_success', 'tt_handle_tip_success');

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
$webhook_secret = defined('STRIPE_WEBHOOK_SECRET') ? STRIPE_WEBHOOK_SECRET : null;
if (empty($webhook_secret)) {
    header('HTTP/1.1 500 Missing Webhook Secret', true, 500);
    error_log('BŁĄD KRYTYCZNY STRIPE: Brak zdefiniowanej stałej STRIPE_WEBHOOK_SECRET w wp-config.php.');
    exit();
}
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$event = null;

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

$email = null;
$country_code = null;
$payment_intent_id = null;

// KROK 2: Ujednolicona ekstrakcja danych na podstawie typu zdarzenia
switch ($event->type) {
    case 'payment_intent.succeeded':
        $intent = $event->data->object;
        $email = $intent->receipt_email;
        $payment_intent_id = $intent->id;
        // W tym wypadku country_code_hint musi być pobrany w Kroku 3
        break;
    case 'checkout.session.completed':
        $session = $event->data->object;
        $email = $session->customer_details->email ?? null;
        // POBIERZ KOD KRAJU Z ADRESU BILLINGOWEGO (PRIORYTET)
        $country_code = $session->customer_details->address->country ?? null;
        $payment_intent_id = $session->payment_intent ?? null;
        break;
    default:
        header('HTTP/1.1 200 OK');
        exit();
}

// KROK 3: Uzupełnienie country_code z metadanych PaymentIntent, jeśli brakuje (FALLBACK)
if (empty($country_code) && !empty($payment_intent_id) && defined('TT_STRIPE_SECRET_KEY')) {
    try {
        \Stripe\Stripe::setApiKey(TT_STRIPE_SECRET_KEY);
        $intent_from_api = \Stripe\PaymentIntent::retrieve($payment_intent_id);
        // Wykorzystujemy metadaną 'country_hint' ustawioną w tt_create_payment_intent
        $country_code = $intent_from_api->metadata['country_hint'] ?? null;
        $amount_cents = $intent_from_api->amount;
        $currency = $intent_from_api->currency;
    } catch (Exception $e) {
        error_log('STRIPE WEBHOOK: Failed to retrieve PI metadata: ' . $e->getMessage());
    }
}


// KROK 4: Główna logika biznesowa (tworzenie użytkownika i ustawianie lokalizacji)
if (!empty($email)) {

    // Ustawienie Lokalizacji WP
    $locale = 'en_GB'; // DOMYŚLNY EN_GB
    $country_code_upper = strtoupper($country_code);

    // Jeśli kod kraju to 'PL', ustaw lokalizację na polski (pl_PL)
    if (!empty($country_code_upper) && $country_code_upper === 'PL') {
        $locale = 'pl_PL';
    }

    // Utwórz/pobierz uzytkownika WP, przekazując ustaloną lokalizację
    $user_or_error = tt_create_user_from_email_if_not_exists($email, $locale);

    if (is_wp_error($user_or_error)) {
        error_log('STRIPE WEBHOOK: WP User Creation Failed for ' . $email . ': ' . $user_or_error->get_error_message());
    } else {
        $user_id = $user_or_error->ID;
        global $wpdb;
        $table_name = $wpdb->prefix . 'tt_donations';
        $wpdb->insert($table_name, [
            'user_id' => $user_id,
            'payment_intent_id' => $payment_intent_id,
            'amount_cents' => $amount_cents,
            'currency' => $currency,
        ]);
        error_log('STRIPE WEBHOOK: Patron User ' . $email . ' created or retrieved successfully. Set locale to: ' . $locale . ' (Country: ' . ($country_code ?: 'N/A') . ')');
    }
} else {
     error_log('STRIPE WEBHOOK: Missing email in processed event. Cannot create user.');
}


// KROK 5: Zawsze zwracaj 200 OK, jeśli przetwarzanie było pomyślnie.
header('HTTP/1.1 200 OK');
exit();
}

add_action('wp_ajax_nopriv_tt_get_crowdfunding_stats', function() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tt_donations';

    $patrons_count = $wpdb->get_var("SELECT COUNT(DISTINCT user_id) FROM {$table_name}");

    $total_pln_cents = $wpdb->get_var($wpdb->prepare("SELECT SUM(amount_cents) FROM {$table_name} WHERE currency = %s", 'pln'));
    $total_eur_cents = $wpdb->get_var($wpdb->prepare("SELECT SUM(amount_cents) FROM {$table_name} WHERE currency = %s", 'eur'));

    // Przelicznik PLN na EUR
    $pln_to_eur_rate = 4.5;
    $collected_eur = ($total_eur_cents / 100) + (($total_pln_cents / 100) / $pln_to_eur_rate);

    wp_send_json_success([
        'patrons_count' => (int) $patrons_count,
        'collected_eur' => round($collected_eur, 2),
    ]);
});
