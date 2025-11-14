<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1, minimum-scale=1, interactive-widget=overlays-content">

    <?php
        // Nowa funkcja generująca dynamiczne meta tagi na podstawie preferencji językowych crawlera.
        if ( function_exists( 'tt_render_dynamic_meta_tags' ) ) {
            tt_render_dynamic_meta_tags();
        }
    ?>
    <link rel="manifest" href="<?php echo get_template_directory_uri(); ?>/manifest.json">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <link rel="preconnect" href="https://pawelperfect.pl" crossorigin>
    <link rel="preconnect" href="https://i.pravatar.cc" crossorigin>
    <link rel="dns-prefetch" href="//pawelperfect.pl">
    <link rel="dns-prefetch" href="//i.pravatar.cc">

    <script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="pawelperfect" data-description="Support me on Buy me a coffee!" data-message="" data-color="#FF5F5F" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>