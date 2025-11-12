<?php
/**
 * Plik functions.php dla motywu Ting Tong.
 *
 * Ten plik działa jako 'loader' dla modularnej struktury funkcji motywu.
 * Wszystkie funkcjonalności są podzielone na mniejsze pliki w folderze /includes/.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

$theme_includes_path = get_template_directory() . '/includes/';

// Podstawowa konfiguracja motywu, skrypty i style
require_once $theme_includes_path . 'theme-setup.php';

// Tworzenie tabel w bazie danych
require_once $theme_includes_path . 'database.php';

// Funkcje pomocnicze, dane symulacyjne i logika awatarów
require_once $theme_includes_path . 'utils.php';

// Handlery AJAX dla autentykacji i profilu użytkownika
require_once $theme_includes_path . 'ajax-auth.php';

// Handlery AJAX dla komentarzy i polubień
require_once $theme_includes_path . 'ajax-comments.php';

// Handlery AJAX i webhooki dla integracji z płatnościami Stripe
require_once $theme_includes_path . 'ajax-payments.php';
