import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Coffee, Bot, Rat, Gamepad2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { debounce } from '@/lib/utils';

interface BottomBarProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

const BottomBar: React.FC<BottomBarProps> = ({ videoRef, isActive }) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { addToast } = useToast();

  const handleTipClick = () => {
    const bmcButton = document.querySelector('[data-id="pawelperfect"]') as HTMLElement;
    if (bmcButton) {
        (bmcButton as HTMLElement).click();
    } else {
      addToast('BuyMeACoffee widget not found.', 'error');
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    const handleTimeUpdate = () => {
      if (!isDragging && video.duration && isFinite(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const debouncedTimeUpdate = debounce(handleTimeUpdate, 100);

    video.addEventListener('timeupdate', debouncedTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', debouncedTimeUpdate);
    };
  }, [videoRef, isActive, isDragging]);

  // Re-integrate scrubber logic
  const handleScrub = (clientX: number) => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar || !video.duration || !isFinite(video.duration)) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));

    setProgress(percent);
    video.currentTime = (percent / 100) * video.duration;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleScrub(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleScrub(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // The main container for the bottom bar, styled to match the prototype
  return (
    <div
      className="absolute bottom-0 left-0 w-full z-[105] flex flex-col justify-start text-white px-3"
      style={{
        paddingTop: '10px',
        paddingBottom: 'calc(10px + var(--safe-area-bottom))',
        minHeight: 'var(--bottombar-base-height)',
        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
      }}
    >
      {/* This div represents the '.video-progress' container from the prototype */}
      <div
        ref={progressBarRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute left-0 w-full h-10 cursor-pointer group"
        style={{ top: '-16px' }} // Reduced the gap
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Video progress bar"
      >
        {/* Track for the progress bar */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-[2px] transition-all group-hover:h-[6px]">
            {/* Filled portion of the progress bar */}
            <div
              className="h-full bg-yellow-400 rounded-[2px]"
              style={{ width: `${progress}%`, transition: isDragging ? 'none' : 'width 0.1s linear' }}
            />
        </div>
        {/* Draggable dot/handle */}
        <div
          className="absolute top-1/2 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full opacity-100"
          style={{
            left: `${progress}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
            transition: isDragging ? 'none' : 'left 0.1s linear',
          }}
        />
      </div>

      {/* New Button Panel */}
      <div className="flex justify-around items-center pt-2">
        {/* Using a wrapper for each button to control touch area and alignment easily */}
        <div className="flex-1 flex justify-center">
          <button onClick={() => { /* Placeholder for Gierki action */ }} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Gamepad2 size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">Gierki</span>
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <button onClick={() => { /* Placeholder for Monsta action */ }} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Rat size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">Monsta</span>
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <button onClick={() => { /* Placeholder for Robert action */ }} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Bot size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">Robert</span>
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <button onClick={handleTipClick} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Coffee size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">{t('tipText') || 'Tip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
