import React, { useState, useEffect, useRef } from 'react';

interface BottomBarProps {
  user: string;
  description: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

const BottomBar: React.FC<BottomBarProps> = ({ user, description, videoRef, isActive }) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sync progress bar with video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;
    const updateProgress = () => {
      if (!isDragging && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [videoRef, isActive, isDragging]);

  const updateScrubber = (clientX: number) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const newProgress = ((clientX - rect.left) / rect.width) * 100;
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(clampedProgress);
    videoRef.current.currentTime = (clampedProgress / 100) * videoRef.current.duration;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateScrubber(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateScrubber(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const progressFillClassName = `h-full bg-yellow-400 rounded-full transition-all duration-100 ease-linear ${isDragging ? 'no-transition' : ''}`;
  const progressHandleClassName = `absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${isDragging ? 'no-transition' : ''}`;

  return (
    <div
      className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-end text-white"
      style={{
        position: 'relative', // Needed for absolute positioning of progress bar
        minHeight: 'var(--bottombar-base-height)',
        padding: '10px 10px calc(10px + var(--safe-area-bottom)) 12px',
        paddingTop: '20px', // Add padding to not overlap text with progress bar
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
      }}
    >
      <div
        ref={progressRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute left-0 w-full h-10 cursor-pointer group"
        style={{ top: '-10px' }} // Position it above the bar content, adjusted for new padding
      >
        <div className="absolute left-0 w-full h-1 bg-white/25 rounded-full group-hover:h-1.5 transition-all" style={{top: '50%', transform: 'translateY(-50%)'}}>
          <div className={progressFillClassName} style={{ width: `${progress}%` }}></div>
        </div>
        <div
          className={progressHandleClassName}
          style={{
            top: '50%',
            left: `${progress}%`,
            backgroundColor: 'hsl(var(--primary))',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
          }}
        ></div>
      </div>

      <div className="text-info">
        <h3 className="text-lg font-bold leading-tight mb-1">@{user}</h3>
        <p className="text-sm leading-snug whitespace-normal">{description}</p>
      </div>
    </div>
  );
};

export default BottomBar;
