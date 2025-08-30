"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxProps {
  videoUrl: string;
  posterUrl: string;
}

const Parallax: React.FC<ParallaxProps> = ({ videoUrl, posterUrl }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '200%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="h-full w-full relative overflow-y-auto">
      {/* This div is for creating scrollable space */}
      <div style={{ height: '200vh' }}>
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            y: videoY,
            backgroundImage: `url(${posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* We can also put a real video here, but for simplicity, we use a poster with parallax */}

        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ y: textY, opacity: textOpacity }}
        >
          <h1 className="text-white text-6xl font-bold text-center">
            Discover Our World
          </h1>
        </motion.div>
      </div>
    </div>
  );
};

export default Parallax;
