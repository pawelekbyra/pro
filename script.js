document.addEventListener('DOMContentLoaded', () => {
    const unmuteButton = document.getElementById('unmute-button');
    let swiper; // Declare swiper variable to be accessible in the whole scope

    const handlePlayPause = (player) => {
        if (player.paused()) {
            player.play().catch(e => console.error('Play was prevented.', e));
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
                            muted: true, // Ensure videos start muted
                        });

                        // Add tap-to-play/pause functionality
                        player.on('click', () => handlePlayPause(player));

                        swiperInstance.players[videoId] = player;
                    }
                });

                // Play the first video
                const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo && swiperInstance.players[activeVideo.id]) {
                    swiperInstance.players[activeVideo.id].play().catch(e => console.error('Autoplay was prevented.', e));
                }
            },
            transitionEnd: function () {
                const swiperInstance = this;
                // Pause all videos
                Object.values(swiperInstance.players).forEach(player => {
                    player.pause();
                });

                // Play the video in the active slide
                const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo && swiperInstance.players[activeVideo.id]) {
                    const activePlayer = swiperInstance.players[activeVideo.id];
                    activePlayer.currentTime(0);
                    activePlayer.play().catch(e => console.error('Playback was prevented.', e));
                }
            },
            beforeDestroy: function () {
                const swiperInstance = this;
                Object.values(swiperInstance.players).forEach(player => {
                    if (player) {
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
            if (activeVideo && swiper.players[activeVideo.id]) {
                const activePlayer = swiper.players[activeVideo.id];
                activePlayer.muted(!activePlayer.muted());
                unmuteButton.textContent = activePlayer.muted() ? 'Unmute' : 'Mute';
            }
        });
    }
});
