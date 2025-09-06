document.addEventListener('DOMContentLoaded', () => {
    let hlsInstances = [];

    // --- HLS.js Initialization (no changes needed here) ---
    const initializeHls = (videoElement) => {
        const hlsSource = videoElement.getAttribute('data-hls-source');
        if (hlsSource) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(hlsSource);
                hls.attachMedia(videoElement);
                hlsInstances.push({ video: videoElement, hls: hls });
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = hlsSource;
            }
        }
    };

    // --- Custom Controls Creation (no changes needed here) ---
    const createCustomControls = (slide) => {
        const video = slide.querySelector('video');
        video.controls = false; // Explicitly hide default controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';

        // ... (The entire control creation logic is the same as before)
        // Progress Bar
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar-container';
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBarContainer.appendChild(progressBar);

        // Buttons Container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons-container';

        // Left Controls
        const leftControls = document.createElement('div');
        leftControls.className = 'left-controls';
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'control-button play-pause-btn';
        playPauseBtn.innerHTML = '&#x25B6;'; // Play icon

        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'volume-container';
        const muteBtn = document.createElement('button');
        muteBtn.className = 'control-button mute-btn';
        muteBtn.innerHTML = '&#x1f50a;'; // Volume icon
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = 0;
        volumeSlider.max = 1;
        volumeSlider.step = 0.01;
        volumeSlider.value = video.volume;
        volumeSlider.className = 'volume-slider';

        volumeContainer.appendChild(muteBtn);
        volumeContainer.appendChild(volumeSlider);
        leftControls.appendChild(playPauseBtn);
        leftControls.appendChild(volumeContainer);

        // Right Controls
        const rightControls = document.createElement('div');
        rightControls.className = 'right-controls';
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'control-button fullscreen-btn';
        fullscreenBtn.innerHTML = '&#x26F6;'; // Fullscreen icon

        rightControls.appendChild(fullscreenBtn);

        // Assemble Controls
        buttonsContainer.appendChild(leftControls);
        buttonsContainer.appendChild(rightControls);
        controlsContainer.appendChild(progressBarContainer);
        controlsContainer.appendChild(buttonsContainer);
        slide.appendChild(controlsContainer);

        // --- Event Listeners for Controls ---
        const togglePlayPause = () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        };

        playPauseBtn.addEventListener('click', togglePlayPause);
        video.addEventListener('click', togglePlayPause);

        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '&#x1f507;' : '&#x1f50a;';
        });

        volumeSlider.addEventListener('input', (e) => {
            video.volume = e.target.value;
            video.muted = e.target.value === '0';
            muteBtn.innerHTML = video.muted ? '&#x1f507;' : '&#x1f50a;';
        });

        video.addEventListener('timeupdate', () => {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${progress}%`;
        });

        progressBarContainer.addEventListener('click', (e) => {
            const rect = progressBarContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            video.currentTime = (x / width) * video.duration;
        });

        fullscreenBtn.addEventListener('click', () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) { /* Safari */
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) { /* IE11 */
                video.msRequestFullscreen();
            }
        });

         video.addEventListener('play', () => {
            playPauseBtn.innerHTML = '&#x23F8;'; // Pause icon
        });

        video.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '&#x25B6;'; // Play icon
        });
    };

    // --- Initialize Controls and HLS for all slides ---
    document.querySelectorAll('.video-slide').forEach(slide => {
        const video = slide.querySelector('video');
        initializeHls(video);
        createCustomControls(slide);
    });

    // --- Swiper Initialization ---
    const swiper = new Swiper('.swiper', {
        // Options
        direction: 'vertical',
        loop: true,
        mousewheel: true,

        // Events
        on: {
            // Event when the slide transition starts
            slideChangeTransitionStart: function () {
                // Pause all videos
                document.querySelectorAll('.swiper-slide video').forEach(video => {
                    video.pause();
                });
            },
            // Event when the slide transition ends
            slideChangeTransitionEnd: function () {
                // Play the video in the active slide
                const activeSlide = document.querySelector('.swiper-slide-active');
                if (activeSlide) {
                    const video = activeSlide.querySelector('video');
                    if (video) {
                         video.play().catch(error => {
                            console.warn("Autoplay was prevented, trying again muted.", error);
                            video.muted = true;
                            video.play();
                        });
                    }
                }
            },
        },
    });

    // --- Initial Play ---
    // Manually trigger play for the very first slide after initialization
    const initialActiveSlide = document.querySelector('.swiper-slide-active');
    if (initialActiveSlide) {
        const firstVideo = initialActiveSlide.querySelector('video');
        if(firstVideo) {
            firstVideo.play().catch(error => {
                console.warn("Initial autoplay was prevented, trying again muted.", error);
                firstVideo.muted = true;
                firstVideo.play();
            });
        }
    }
});
