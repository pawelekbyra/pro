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
                controls: false, // Controls are hidden via CSS, but this is cleaner
                autoplay: true, // Start muted and autoplay
                muted: true, // Muted by default to allow autoplay
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
                    players.forEach((player) => {
                        const slide = player.el().closest('.swiper-slide');
                        if (slide && slide.classList.contains('swiper-slide-active')) {
                            // Play the video and unmute it
                            player.play().catch(error => console.error("Could not play video:", error));
                            player.muted(false);
                        } else {
                            player.pause();
                        }
                    });
                },
            },
        });

        // --- Initial Play ---
        // The first video should autoplay because of the `autoplay: true` option.
        // We just need to ensure it's unmuted after the initial interaction.
        if (players.length > 0) {
            const activePlayer = players[swiper.realIndex];
            if (activePlayer) {
                activePlayer.muted(false); // Unmute the first video
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
