"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimation, PanInfo } from 'framer-motion';
import Slide, { SlideData } from '@/components/Slide';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';

const DRAG_THRESHOLD = 150;
const SPRING_OPTIONS = {
  type: 'spring',
  damping: 25,
  stiffness: 150,
};

export default function Home() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const controls = useAnimation();
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/slides');
        if (!response.ok) throw new Error('Failed to fetch slides');
        const data = await response.json();
        setSlides(data.slides);
      } catch (error) {
        console.error("Failed to fetch slides:", error);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    controls.start({
      y: -activeIndex * (containerRef.current?.offsetHeight || 0),
      transition: SPRING_OPTIONS,
    });
  }, [activeIndex, controls]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isModalOpen) return;

    const { offset } = info;
    if (Math.abs(offset.y) > DRAG_THRESHOLD) {
      if (offset.y < 0) {
        setActiveIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    } else {
      controls.start({
        y: -activeIndex * (containerRef.current?.offsetHeight || 0),
        transition: SPRING_OPTIONS,
      });
    }
  };

  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);

  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);

  // Combine modal states to control dragging
  const isAnyModalOpen = isModalOpen || isAccountPanelOpen || isCommentsModalOpen;

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <main ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black">
      <motion.div
        className="h-full w-full"
        drag={isAnyModalOpen ? false : "y"} // Use combined state
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.1 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="h-full w-full absolute top-0 left-0" style={{ top: `${index * 100}%` }}>
            <Slide
              slide={slide}
              isActive={index === activeIndex}
              setIsModalOpen={setIsModalOpen}
              openAccountPanel={openAccountPanel}
              openCommentsModal={openCommentsModal}
            />
          </div>
        ))}
      </motion.div>

      <AccountPanel isOpen={isAccountPanelOpen} onClose={closeAccountPanel} />
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={closeCommentsModal}
        commentsCount={slides[activeIndex]?.initialComments || 0}
      />
    </main>
  );
}
