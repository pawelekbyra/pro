document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.swiper', {
        // Configure Swiper
        direction: 'vertical',
        loop: true,
        grabCursor: true,
        keyboard: true,

        // Event listeners
        on: {
            // This event fires right after Swiper initialization
            init: function () {
                // The first slide is active by default, play its video.
                const activeSlide = this.slides[this.activeIndex];
                const video = activeSlide.querySelector('video');
                if (video) {
                    // Muted videos can usually play without user interaction.
                    video.play().catch(error => {
                        console.error("Initial video playback failed:", error);
                    });
                }
            },
            // This event fires after a slide transition ends
            transitionEnd: function () {
                // Pause all videos first.
                // Looping through all slides ensures we pause videos in duplicated slides as well.
                this.slides.forEach(slide => {
                    const video = slide.querySelector('video');
                    if (video) {
                        video.pause();
                        video.currentTime = 0; // Reset video to the beginning
                    }
                });

                // Play the video in the currently active slide.
                const activeSlide = this.slides[this.activeIndex];
                const activeVideo = activeSlide.querySelector('video');
                if (activeVideo) {
                    activeVideo.play().catch(error => {
                        console.error("Video playback on slide change failed:", error);
                    });
                }
            },
        },
    });
});
