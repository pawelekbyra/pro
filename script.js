document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const startButton = document.getElementById('start-button');
    const swiperContainer = document.querySelector('.swiper');

    let swiper;
    const players = [];

    // --- Main initialization function, triggered by user interaction ---
    function initializeApp() {
        // Hide splash screen and show the main content
        splashScreen.style.display = 'none';
        swiperContainer.style.display = 'block';

        // --- Initialize all Video.js players ---
        const videoElements = document.querySelectorAll('.video-js');
        videoElements.forEach((videoEl, index) => {
            const player = videojs(videoEl, {
                controls: true,
                autoplay: false, // We will control autoplay manually via Swiper
                muted: false,
                fluid: true, // Makes the player responsive
                playsinline: true,
                 loop: true,
            });
            players.push(player);
        });

        // --- Swiper Initialization ---
        swiper = new Swiper('.swiper', {
            direction: 'vertical',
            loop: true,
            mousewheel: true,
            on: {
                // When transition ends, play the active video
                slideChangeTransitionEnd: function () {
                    players.forEach((player, index) => {
                        // The loop index might not match the player index directly
                        // if swiper.realIndex is not what we think. Let's use the slide index.
                        const slide = player.el().closest('.swiper-slide');
                        if (slide && slide.classList.contains('swiper-slide-active')) {
                            player.play().catch(error => {
                                console.error("Could not play video with sound, even after interaction.", error);
                            });
                        } else {
                            player.pause();
                        }
                    });
                },
            },
        });

        // --- Initial Play ---
        // Play the first video after initialization
        if (players.length > 0) {
            // Find the player in the initially active slide
            const activeSlide = document.querySelector('.swiper-slide-active');
            if(activeSlide) {
                const activePlayerEl = activeSlide.querySelector('.video-js');
                const activePlayer = players.find(p => p.el() === activePlayerEl);
                if (activePlayer) {
                    activePlayer.play().catch(error => {
                       console.error("Initial play failed", error);
                    });
                }
            }
        }
    }

    // --- Event Listener for the start button ---
    startButton.addEventListener('click', () => {
        // A "hack" to unlock audio on mobile browsers.
        // We create a dummy audio context and play a silent buffer.
        // This should be done right after the first user interaction.
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const audioCtx = new AudioContext();
            const buffer = audioCtx.createBuffer(1, 1, 22050);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(0);
            // Resume context if it's suspended
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        initializeApp();
    });
});
