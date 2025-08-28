"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  isActive: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isActive, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`relative w-[50px] h-[24px] rounded-full cursor-pointer transition-colors duration-300 ${isActive ? 'bg-pink-600' : 'bg-gray-700'}`}
    >
      <motion.div
        className="absolute top-[1px] left-[1px] w-[22px] h-[22px] bg-white rounded-full shadow-md"
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        style={{
          x: isActive ? '26px' : '0px',
        }}
      />
    </div>
  );
};

export default ToggleSwitch;
