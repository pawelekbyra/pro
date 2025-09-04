"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const VideoControls: React.FC = () => {
  const {
    currentTime,
    duration,
    seek,
    isPlaying,
    togglePlay,
    isMuted,
    toggleMute,
  } = useStore(
    (state) => ({
      currentTime: state.currentTime,
      duration: state.duration,
      seek: state.seek,
      isPlaying: state.isPlaying,
      togglePlay: state.togglePlay,
      isMuted: state.isMuted,
      toggleMute: state.toggleMute,
    }),
    shallow
  );

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  // Don't render controls if duration is 0 or NaN
  if (!duration || isNaN(duration)) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white z-20 bg-black/30 p-2 rounded-lg">
      <button onClick={togglePlay} className="p-1">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <span className="text-xs font-mono w-12 text-center">{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max={duration}
        step="1"
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
      <span className="text-xs font-mono w-12 text-center">{formatTime(duration)}</span>
      <button onClick={toggleMute} className="p-1">
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};

export default VideoControls;
