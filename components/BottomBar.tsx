import React from 'react';

interface BottomBarProps {
  user: string;
  description: string;
}

const BottomBar: React.FC<BottomBarProps> = ({ user, description }) => {
  return (
    <div
      className="absolute bottom-0 left-0 w-full z-20 flex flex-col justify-end text-white"
      style={{
        minHeight: '110px',
        padding: '10px 10px calc(10px + var(--safe-area-bottom)) 12px',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
      }}
    >
      {/* Video Progress Bar - will be implemented in a later step */}
      <div className="absolute -top-5 left-0 w-full h-10 cursor-pointer group">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/25 rounded-full">
          <div className="h-full bg-yellow-400 rounded-full" style={{ width: '0%' }}></div>
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg"
          style={{
            left: '0%',
            backgroundColor: 'var(--accent-color)',
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
