<?php
/**
 * Theme functions and definitions
 *
 * @package TingTongTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Enqueue scripts and styles.
 */
function tingtong_enqueue_scripts() {
	// Enqueue main stylesheet.
	wp_enqueue_style(
		'tingtong-style',
		get_stylesheet_uri(),
		array(),
		'1.0.0'
	);

	// Enqueue Swiper CSS from CDN.
	wp_enqueue_style(
		'swiper-css',
		'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.css',
		array(),
		'12.0.2'
	);

	// Enqueue Swiper JS from CDN.
	wp_enqueue_script(
		'swiper-js',
		'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.js',
		array(),
		'12.0.2',
		true
	);

	// Enqueue main theme script.
	wp_enqueue_script(
		'tingtong-script',
		get_template_directory_uri() . '/script.js',
		array( 'jquery', 'swiper-js' ),
		'1.0.0',
		true
	);

	// Prepare data to be passed to the script.
	$script_data = array(
		'ajax_url'   => admin_url( 'admin-ajax.php' ),
		'nonce'      => wp_create_nonce( 'tt_ajax_nonce' ),
		'isLoggedIn' => is_user_logged_in(),
		'slides'     => array(
			array(
				'id'              => 'slide1',
				'access'          => 'public',
				'initialLikes'    => 10,
				'isLiked'         => false,
				'initialComments' => 4,
				'isIframe'        => false,
				'mp4Url'          => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
				'user'            => 'Filmik 1',
				'description'     => 'Podpis do filmiku 1',
				'avatar'          => 'https://i.pravatar.cc/100?u=1',
				'likeId'          => '101',
				'comments'        => array(
					array(
						'id'        => 'c1-1',
						'parentId'  => null,
						'user'      => 'Kasia',
						'avatar'    => 'https://i.pravatar.cc/100?u=10',
						'text'      => 'Niesamowite ujęcie! 🐰',
						'timestamp' => '2023-10-27T10:00:00Z',
						'likes'     => 15,
						'isLiked'   => false,
						'canEdit'   => true,
					),
				),
			),
			array(
				'id'              => 'slide2',
				'access'          => 'secret',
				'initialLikes'    => 20,
				'isLiked'         => false,
				'initialComments' => 2,
				'isIframe'        => false,
				'mp4Url'          => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
				'user'            => 'Paweł Polutek',
				'description'     => 'Podpis do filmiku 2',
				'avatar'          => 'https://i.pravatar.cc/100?u=2',
				'likeId'          => '102',
				'comments'        => array(),
			),
			array(
				'id'              => 'slide3',
				'access'          => 'pwa',
				'initialLikes'    => 30,
				'isLiked'         => false,
				'initialComments' => 0,
				'isIframe'        => false,
				'mp4Url'          => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
				'user'            => 'Test Video',
				'description'     => 'A test video slide.',
				'avatar'          => 'https://i.pravatar.cc/100?u=3',
				'likeId'          => '103',
				'comments'        => array(),
			),
		),
	);

	// Localize the script with the data.
	wp_localize_script( 'tingtong-script', 'TingTongData', $script_data );

	// Localize ajax object for backward compatibility with the script.
	wp_localize_script(
		'tingtong-script',
		'ajax_object',
		array(
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'tt_ajax_nonce' ),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'tingtong_enqueue_scripts' );

/**
 * Add theme support for basic features.
 */
function tingtong_theme_support() {
	// Add support for title tags.
	add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'tingtong_theme_support' );