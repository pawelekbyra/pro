import { useState, useEffect } from 'react';

interface VideoPlayback {
  isPlaying: boolean;
}

export const useVideoPlayback = (
  videoRef: React.RefObject<HTMLVideoElement>
): VideoPlayback => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Set initial state based on the video's current state
    setIsPlaying(!video.paused);

    return () => {
      // Clean up listeners when the component unmounts or ref changes
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  return { isPlaying };
};
