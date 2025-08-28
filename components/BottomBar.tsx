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
        minHeight: 'var(--bottombar-base-height)',
        padding: '10px 10px calc(10px + var(--safe-area-bottom)) 12px',
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
        paddingTop: '40px', // Make space for the progress bar which is now in VideoPlayer
      }}
    >
      <div className="text-info">
        <h3 className="text-lg font-bold leading-tight mb-1">@{user}</h3>
        <p className="text-sm leading-snug whitespace-normal">{description}</p>
      </div>
    </div>
  );
};

export default BottomBar;
