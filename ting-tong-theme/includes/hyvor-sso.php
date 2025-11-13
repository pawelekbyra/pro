<?php
/**
 * Hyvor Talk SSO Helper Functions.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Publiczne ID Twojej strony w Hyvor Talk (Jawne, zgodnie z instrukcją)
define( 'HYVOR_WEBSITE_ID_PUBLIC', 14495 );
// Klucz prywatny do generowania HASH jest ładowany z wp-config.php jako HYVOR_TALK_SSO_KEY

/**
 * Generuje obiekt danych użytkownika i hash SSO dla Hyvor Talk.
 * Wymaga stałej HYVOR_TALK_SSO_KEY z wp-config.php.
 *
 * @param int $user_id ID użytkownika.
 * @return array|bool Zwraca tablicę z sso_user i sso_hash lub false.
 */
function tt_hyvor_generate_sso_data( $user_id ) {
	// Sprawdzenie, czy klucz prywatny jest zdefiniowany (Kluczowe dla bezpieczeństwa)
	if ( ! defined( 'HYVOR_TALK_SSO_KEY' ) || ! $user_id ) {
		return false;
	}

	$u = get_userdata( $user_id );
	if ( ! $u ) {
		return false;
	}

    // Upewnienie się, że email jest obecny, ponieważ Hyvor Talk go wymaga
    $email = $u->user_email ?: '';

	// 1. Zbuduj obiekt danych użytkownika (wymagany przez Hyvor Talk)
	$user_data = [
		'timestamp'   => time(),
		'id'          => (int) $u->ID,
		'name'        => $u->display_name ?: $u->user_login,
		'email'       => $email,
		// Zakładam, że funkcja tt_get_user_avatar_url jest dostępna w includes/utils.php
		'picture_url' => function_exists('tt_get_user_avatar_url') ? tt_get_user_avatar_url( $user_id ) : '',
	];

	// 2. Zakoduj obiekt do formatu Base64 (sso-user)
	$sso_user = base64_encode( json_encode( $user_data ) );

	// 3. Generuj podpis (sso-hash) za pomocą tajnego klucza
	$sso_hash = hash_hmac( 'sha256', $sso_user, HYVOR_TALK_SSO_KEY );

	return [
		'sso_user' => $sso_user,
		'sso_hash' => $sso_hash,
	];
}

/**
 * Akcja AJAX do pobierania danych SSO.
 */
function tt_hyvor_get_sso() {
	// Sprawdzenie czy jest zalogowany
    if ( is_user_logged_in() ) {
        $sso_data = tt_hyvor_generate_sso_data( get_current_user_id() );
    } else {
        $sso_data = false;
    }

	if ( $sso_data ) {
		wp_send_json_success( array_merge( [ 'is_logged_in' => true ], $sso_data ) );
	} else {
		// Zwróć puste dane dla niezalogowanych
		wp_send_json_success( [ 'is_logged_in' => false ] );
	}
}
add_action( 'wp_ajax_tt_hyvor_get_sso', 'tt_hyvor_get_sso' );
add_action( 'wp_ajax_nopriv_tt_hyvor_get_sso', 'tt_hyvor_get_sso' );
