<?php
/**
 * AJAX handlers for FastComments SSO.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Generates the SSO payload for a logged-in user for FastComments.
 */
function tt_generate_sso_token_callback() {
    // 1. Verify nonce for security
    if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'tt_ajax_nonce' ) ) {
        wp_send_json_error( [ 'message' => 'Błąd weryfikacji nonce.' ], 403 );
        return;
    }

    // 2. Check if user is logged in
    if ( ! is_user_logged_in() ) {
        wp_send_json_success( null ); // Not an error, just no SSO data for guests
        return;
    }

    // 3. Check for required FastComments constants
    if ( ! defined( 'FASTCOMMENTS_SSO_SECRET_KEY' ) || ! defined( 'FASTCOMMENTS_TENANT_ID' ) ) {
        wp_send_json_error( [ 'message' => 'Brak konfiguracji FastComments po stronie serwera.' ], 500 );
        return;
    }

    // 4. Get current user's data
    $user = wp_get_current_user();
    if ( ! $user || $user->ID === 0 ) {
        wp_send_json_success( null ); // Should not happen if is_user_logged_in passed, but as a safeguard
        return;
    }

    // 5. Build the user data object for SSO
    $user_data_for_sso = [
        'id'          => (string) $user->ID,
        'email'       => $user->user_email,
        'username'    => $user->display_name,
        'avatar'      => tt_get_user_avatar_url( $user->ID ),
        'optedIn'     => true, // User has agreed to terms by creating an account
        'displayLabel' => 'Patron', // Custom label for logged-in users
        // 'websiteUrl' => get_author_posts_url($user->ID), // Optional: Link to user's profile page
        'isAdmin'     => user_can( $user, 'manage_options' ),
    ];

    // 6. Convert to JSON
    $user_data_json = wp_json_encode( $user_data_for_sso );

    // 7. Generate the secure hash (HMAC-SHA256)
    $hash = hash_hmac( 'sha256', $user_data_json, FASTCOMMENTS_SSO_SECRET_KEY );

    // 8. Base64 encode the JSON payload
    $user_data_base64 = base64_encode( $user_data_json );

    // 9. Send the successful response
    wp_send_json_success( [
        'userDataJSONBase64' => $user_data_base64,
        'verificationHash'   => $hash,
    ] );
}

add_action( 'wp_ajax_tt_generate_sso_token', 'tt_generate_sso_token_callback' );
// No nopriv action needed, as this is only for logged-in users.
