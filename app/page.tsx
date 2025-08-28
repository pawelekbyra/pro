"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from "@/components/VideoPlayer";
import SlideUI from "@/components/SlideUI"; // Import the new component
import { Button } from '@/components/ui/button';

interface Slide {
  id: string;
  user: string;
  description: string;
  mp4Url: string;
  poster: string;
  initialLikes: number;
  initialIsLiked: boolean;
}

const slideVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "-100%", opacity: 0 },
};

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/slides');
        const data = await response.json();
        setSlides(data.slides);
      } catch (error) {
        console.error("Failed to fetch slides:", error);
      }
    };

    fetchSlides();
  }, []);

  if (slides.length === 0) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }

  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const goToPrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[activeIndex];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide.id}
          className="relative h-full w-full"
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <VideoPlayer src={currentSlide.mp4Url} poster={currentSlide.poster} />
          <SlideUI slide={currentSlide} />
        </motion.div>
      </AnimatePresence>

      {/* Buttons for testing animation */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-4">
        <Button onClick={goToPrev}>Prev</Button>
        <Button onClick={goToNext}>Next</Button>
      </div>
    </main>
  );
}
