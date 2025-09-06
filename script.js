document.addEventListener('DOMContentLoaded', () => {
    const unmuteButton = document.getElementById('unmute-button');
    let swiper;

    // A helper function to manage play/pause
    const handlePlayPause = (player) => {
        if (player.paused()) {
            player.play().catch(e => console.error('User-initiated play was prevented.', e));
        } else {
            player.pause();
        }
    };

    swiper = new Swiper('.swiper', {
        direction: 'vertical',
        loop: true,
        grabCursor: true,
        keyboard: true,
        on: {
            init: function () {
                const swiperInstance = this;
                swiperInstance.players = {};

                swiperInstance.slides.forEach((slide, index) => {
                    const videoEl = slide.querySelector('.video-js');
                    if (videoEl) {
                        const videoId = `video-${index}`;
                        videoEl.id = videoId;

                        const player = videojs(videoEl, {
                            controls: false,
                            preload: 'auto',
                            loop: true,
                            muted: true,
                        });

                        swiperInstance.players[videoId] = player;

                        // Use the 'ready' event to ensure the player is fully initialized
                        player.ready(function() {
                            // 'this' is the player instance
                            this.on('click', () => handlePlayPause(this));

                            // Autoplay the first video when it's ready
                            if (index === swiperInstance.realIndex) {
                                this.play().catch(e => console.error('Autoplay was prevented on init.', e));
                            }
                        });
                    }
                });
            },
            transitionEnd: function () {
                const swiperInstance = this;

                // Pause all video players
                Object.values(swiperInstance.players).forEach(player => {
                    if (player && !player.isDisposed() && !player.paused()) {
                        player.pause();
                    }
                });

                // Get the active slide's video player
                const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo && swiperInstance.players[activeVideo.id]) {
                    const activePlayer = swiperInstance.players[activeVideo.id];

                    // Play the active video if it's ready and paused
                    if (activePlayer && !activePlayer.isDisposed()) {
                        activePlayer.currentTime(0);
                        activePlayer.play().catch(e => console.error('Playback was prevented on slide change.', e));
                    }
                }
            },
            beforeDestroy: function () {
                const swiperInstance = this;
                Object.values(swiperInstance.players).forEach(player => {
                    if (player && !player.isDisposed()) {
                        player.dispose();
                    }
                });
                swiperInstance.players = {};
            },
        },
    });

    // Unmute button functionality
    if (unmuteButton && swiper) {
        unmuteButton.addEventListener('click', () => {
            const activeSlide = swiper.slides[swiper.activeIndex];
            const activeVideo = activeSlide.querySelector('video');
            if (activeVideo && swiper.players && swiper.players[activeVideo.id]) {
                const activePlayer = swiper.players[activeVideo.id];
                if (activePlayer && !activePlayer.isDisposed()) {
                    activePlayer.muted(!activePlayer.muted());
                    unmuteButton.textContent = activePlayer.muted() ? 'Unmute' : 'Mute';
                }
            }
        });
    }
});
