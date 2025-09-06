document.addEventListener('DOMContentLoaded', function () {
    // Initialize Video.js on all video elements
    const players = [];
    const videoElements = document.querySelectorAll('.video-js');
    videoElements.forEach((videoEl, index) => {
        const player = videojs(videoEl, {
            controls: true,
            autoplay: false, // We will control autoplay manually
            preload: 'auto'
        });
        players.push(player);
    });

    // Initialize Swiper
    const swiper = new Swiper('.swiper', {
        direction: 'vertical',
        loop: true,
        on: {
            // This event fires when the transition to a new slide ends
            slideChangeTransitionEnd: function () {
                // Pause all videos
                players.forEach(player => player.pause());
                // Get the current slide's video player
                const activeIndex = this.realIndex; // Use realIndex for loop mode
                const activePlayer = players[activeIndex];
                // Play the active video
                if (activePlayer) {
                    activePlayer.play().catch(error => {
                        console.error("Video play failed:", error);
                    });
                }
            },
        },
    });

    // Add click-to-toggle-play functionality
    document.querySelectorAll('.swiper-slide').forEach((slide, index) => {
        slide.addEventListener('click', function() {
            const player = players[index];
            if (player) {
                if (player.paused()) {
                    player.play().catch(error => console.error("Video play failed:", error));
                } else {
                    player.pause();
                }
            }
        });
    });

    // Initial play for the first slide
    if (players.length > 0) {
        // Find the player for the initial active slide (index 0)
        const initialPlayer = players[swiper.realIndex];
        if (initialPlayer) {
            initialPlayer.play().catch(error => {
                console.log("Initial autoplay was prevented. User interaction is required.");
            });
        }
    }
});
