// components/BottomBar.tsx
import React, { useState, useRef } from 'react';
import { Coffee, Bot, Rat, Gamepad2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useVideoGrid } from '@/context/VideoGridContext';

const BottomBar: React.FC = () => {
  const { state, seekVideo } = useVideoGrid();
  const { videoCurrentTime, videoDuration } = state;
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { addToast } = useToast();

  const progress = videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0;

  const handleTipClick = () => {
    const bmcButton = document.querySelector('[data-id="pawelperfect"]') as HTMLElement;
    if (bmcButton) {
        (bmcButton as HTMLElement).click();
    } else {
      addToast('BuyMeACoffee widget not found.', 'error');
    }
  };

  const handleScrub = (clientX: number) => {
    const bar = progressBarRef.current;
    if (!bar || videoDuration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const newTime = (percent / 100) * videoDuration;
    seekVideo(newTime);
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

  return (
    <div
      className="absolute bottom-0 left-0 w-full z-[105] flex flex-col justify-start text-white px-3"
      style={{
        paddingBottom: 'calc(10px + var(--safe-area-bottom))',
        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
        minHeight: 'var(--bottombar-height)',
      }}
    >
      <div
        ref={progressBarRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute left-0 w-full h-10 cursor-pointer group"
        style={{ top: '-18px' }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Video progress bar"
      >
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-[2px] transition-all group-hover:h-[6px]">
            <div
              className="h-full bg-yellow-400 rounded-[2px]"
              style={{ width: `${progress}%`, transition: isDragging ? 'none' : 'width 0.1s linear' }}
            />
        </div>
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


      <div className="flex justify-between items-center pt-2">
        <div className="flex justify-center">
          <button onClick={() => { /* Placeholder for Gierki action */ }} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Gamepad2 size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">Gierki</span>
          </button>
        </div>
        <div className="flex justify-center">
          <button onClick={() => { /* Placeholder for Monsta action */ }} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Rat size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">Monsta</span>
          </button>
        </div>
        <div className="flex justify-center">
          <button onClick={() => { /* Placeholder for Robert action */ }} className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold">
            <Bot size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">Robert</span>
          </button>
        </div>
        <div className="flex justify-center">
          <button disabled className="flex flex-col items-center gap-0.5 text-white text-xs font-semibold opacity-50 cursor-not-allowed">
            <Coffee size={28} className="stroke-white" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}/>
            <span className="icon-label">{t('tipText') || 'Tip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BottomBar);
