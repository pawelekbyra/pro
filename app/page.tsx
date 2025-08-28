"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimation, PanInfo } from 'framer-motion';
import Slide, { SlideData } from '@/components/Slide';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';
import { Skeleton } from '@/components/ui/skeleton';

const DRAG_THRESHOLD = 150;
const SPRING_OPTIONS = {
  type: 'spring',
  damping: 25,
  stiffness: 150,
};

export default function Home() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
    const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen;
    if (isAnyModalOpen) return;

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

  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen;

  if (slides.length === 0) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        {/* Top Bar Skeleton */}
        <div className="absolute top-0 left-0 w-full z-30 flex justify-center items-center" style={{height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)'}}>
            <Skeleton className="h-4 w-28" />
        </div>

        {/* Sidebar Skeleton */}
        <div className="absolute right-2 flex flex-col items-center gap-4 z-20" style={{top: '50%', transform: 'translateY(-50%)'}}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
        </div>

        {/* Bottom Bar Skeleton */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4" style={{paddingBottom: 'calc(10px + var(--safe-area-bottom))'}}>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <main ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black">
      <motion.div
        className="h-full w-full"
        drag={isAnyModalOpen ? false : "y"}
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
              setIsModalOpen={isAnyModalOpen} // Pass down the combined state
              openAccountPanel={openAccountPanel}
              openCommentsModal={openCommentsModal}
              openInfoModal={openInfoModal}
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
      <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
    </main>
  );
}
