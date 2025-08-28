import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface UseHlsParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string | null;
  onFatalError?: () => void; // Callback to handle fatal errors (e.g., fallback to MP4)
}

const HLS_CONFIG = {
  abrEnabled: true,
  capLevelToPlayerSize: true,
  startLevel: -1,
  abrEwmaFastLive: true,
  maxAutoLevelCapping: undefined, // Let HLS decide by default
  // Add retry configuration for robustness
  manifestLoadErrorMaxRetry: 5,
  manifestLoadErrorRetryDelay: 1000,
  levelLoadErrorMaxRetry: 5,
  levelLoadErrorRetryDelay: 1000,
};

export const useHls = ({ videoRef, src, onFatalError }: UseHlsParams) => {
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!src) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Destroy previous instance if it exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover network errors
              console.log('Attempting to recover from HLS network error...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Attempting to recover from HLS media error...');
              hls.recoverMediaError();
              break;
            default:
              // Cannot recover, trigger fallback
              console.log('Unrecoverable HLS error, triggering fallback.');
              onFatalError?.();
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(src);
      hls.attachMedia(videoElement);
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (e.g., Safari)
      videoElement.src = src;
    }

    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, videoRef, onFatalError]);
};
