# Ting Tong Theme

A custom WordPress theme for the Ting Tong application, converted from a static HTML project. This theme is designed as a single-page application (SPA) with a TikTok-style vertical swipe interface for viewing video content.

## Features

- **SPA-like Experience**: The theme uses a vertical swiper powered by SwiperJS to create a seamless, app-like browsing experience without page reloads.
- **Dynamic Content Loading**: Slides and their content are dynamically generated using JavaScript, with data passed from the WordPress backend.
- **Progressive Web App (PWA)**: Includes support for PWA installation, allowing users to add the site to their home screen for an app-like experience.
- **User Authentication**: A complete user authentication system with login, logout, and registration functionalities.
- **Interactive UI Components**:
    - **Modals**: A rich set of modals for comments, user profiles, information, and notifications.
    - **Dynamic Sidebars**: Interactive sidebars with buttons for liking, commenting, sharing, and more.
- **Localization**: The theme supports both Polish and English, with a language selector and a structured translation system in JavaScript.
- **Mock Data for Standalone Development**: The theme is configured to use mock data when `TingTongData` is not provided by WordPress, allowing for frontend development without a live backend.
- **AJAX-Powered Actions**: User actions like liking, commenting, and updating profiles are handled asynchronously via AJAX.

## Project Structure

The theme is composed of several key files:

- `index.php`: The main template file. It contains the HTML structure for the application, including the Swiper container, slide templates, and all the modals.
- `functions.php`: Handles the enqueuing of scripts and styles, and passes data from PHP to JavaScript using `wp_localize_script`. It also includes the mock data for the slides.
- `style.css`: Contains all the styles for the theme, including the theme's metadata.
- `script.js`: The core JavaScript file that powers the application. It's organized into modules for managing state, UI, API calls, and event handling.
- `header.php` / `footer.php`: Standard WordPress template files.

## Getting Started

To use this theme, follow these steps:

1.  Place the `ting-tong-theme` directory in your WordPress `wp-content/themes` folder.
2.  Activate the theme from the WordPress admin panel under "Appearance" > "Themes".
3.  The theme is now active and will display the TikTok-style interface on your site's front page.

## Frontend Development

The frontend is built with a modular JavaScript architecture. The main `script.js` file is organized into several key components:

- **Config**: Contains configuration options and the translation strings for both supported languages.
- **State**: A simple state management object to keep track of the application's state, such as the current language, logged-in status, and current slide.
- **Utils**: A collection of utility functions for tasks like translation, number formatting, and handling user gestures.
- **API**: A module for handling all AJAX requests to the WordPress backend. It includes fallback mock data for standalone development.
- **UI**: A comprehensive module for managing all UI elements, including rendering slides, modals, and updating the DOM based on the application's state.
- **PWA**: A module for handling Progressive Web App functionalities, including the installation prompt.
- **Handlers**: A module that centralizes all event handling for the application.
- **App**: The main application module that initializes the theme and ties all the other modules together.

### Standalone Development

The theme is designed to be developed without a live WordPress backend. If the `TingTongData` and `ajax_object` global objects are not defined, `script.js` will automatically fall back to using mock data. This allows for easy frontend development and testing.

## Backend Interaction

The theme uses `wp_localize_script` in `functions.php` to pass data from PHP to JavaScript. The `TingTongData` object contains all the necessary information for the slides, as well as the user's logged-in status. The `ajax_object` provides the AJAX URL and a nonce for secure communication.

All asynchronous actions are handled via AJAX calls to the WordPress backend. The API module in `script.js` defines all the available actions and their corresponding functions.