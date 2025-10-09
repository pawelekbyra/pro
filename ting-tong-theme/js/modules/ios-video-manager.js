// ═══════════════════════════════════════════════════════════════════
// iOS MEMORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

class IOSVideoManager {
  constructor() {
    this.maxCachedVideos = 3; // iPhone 7 limitation
    this.activeVideos = new Set();
  }

  /**
   * Release video memory
   */
  releaseVideo(videoElement) {
    if (!videoElement) return;

    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.load();

    // Clear blob URLs if any
    const sources = videoElement.querySelectorAll('source');
    sources.forEach(source => {
      if (source.src.startsWith('blob:')) {
        URL.revokeObjectURL(source.src);
      }
    });

    this.activeVideos.delete(videoElement);
    console.log('🎬 Released video memory for element:', videoElement);
  }

  /**
   * Manage video lifecycle based na Swiper state
   */
  manageVideos(swiper) {
    const activeIndex = swiper.activeIndex;

    swiper.slides.forEach((slide, index) => {
      const video = slide.querySelector('video');
      if (!video) return;

      const distance = Math.abs(index - activeIndex);

      if (distance === 0) {
        // Current slide - play
        this.activeVideos.add(video);
      } else if (distance > 2) {
        // Far slides - release
        this.releaseVideo(video);
      }
    });

    // If too many active videos, cleanup oldest
    if (this.activeVideos.size > this.maxCachedVideos) {
      const oldestVideo = this.activeVideos.values().next().value;
      this.releaseVideo(oldestVideo);
    }
  }
}

export const videoManager = new IOSVideoManager();