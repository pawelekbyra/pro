document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.swiper', {
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
                            controls: true,
                            autoplay: false,
                            preload: 'auto',
                        });

                        swiperInstance.players[videoId] = player;
                    }
                });

                const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo && swiperInstance.players[activeVideo.id]) {
                    swiperInstance.players[activeVideo.id].play().catch(e => console.error('Autoplay was prevented.', e));
                }
            },
            transitionEnd: function () {
                const swiperInstance = this;
                Object.values(swiperInstance.players).forEach(player => {
                    player.pause();
                });

                const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo && swiperInstance.players[activeVideo.id]) {
                    swiperInstance.players[activeVideo.id].currentTime(0);
                    swiperInstance.players[activeVideo.id].play().catch(e => console.error('Playback was prevented.', e));
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
});
