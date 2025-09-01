import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface UseHlsParams {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string | null | undefined;
  onFatalError?: () => void; // Callback to handle fatal errors (e.g., fallback to MP4)
}

const HLS_CONFIG = {
  // --- Quality and Buffering ---
  abrEnabled: true,
  capLevelToPlayerSize: true,
  maxBufferLength: 60, // Increased buffer length to 60 seconds
  maxMaxBufferLength: 120, // Increased max buffer length to 120 seconds

  // --- Robustness and Retry Logic ---
  manifestLoadErrorMaxRetry: 10,
  manifestLoadErrorRetryDelay: 2000, // Increased delay to 2 seconds
  levelLoadErrorMaxRetry: 10,
  levelLoadErrorRetryDelay: 2000, // Increased delay to 2 seconds
  fragLoadErrorMaxRetry: 15, // Added retry for fragment loading
  fragLoadErrorRetryDelay: 2000,

  // --- Diagnostics ---
  debug: false, // Set to true for verbose logging during development
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
          console.error('HLS.js fatal error:', {
            type: data.type,
            details: data.details,
            error: data.error,
            reason: data.reason,
          });
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Attempting to recover from HLS network error...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Attempting to recover from HLS media error...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable HLS error. Triggering fallback.');
              onFatalError?.();
              hls.destroy();
              break;
          }
        } else {
          // Non-fatal errors can be logged for monitoring without taking drastic action.
          console.warn('HLS.js non-fatal error:', {
            type: data.type,
            details: data.details,
          });
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
