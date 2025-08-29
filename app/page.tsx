"use client";

import { useState, useEffect, useRef } from 'react';
import Slide, { SlideData } from '@/components/Slide';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTopBarModalOpen, setIsTopBarModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/slides');
        if (!response.ok) throw new Error('Failed to fetch slides');
        const data = await response.json();
        setSlides(data.slides);
        slideRefs.current = slideRefs.current.slice(0, data.slides.length);
      } catch (error) {
        console.error("Failed to fetch slides:", error);
      }
    };
    fetchSlides();
  }, []);

  // Fix 1: Dynamically set app height for mobile browsers
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    );

    const currentRefs = slideRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [slides]);

  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);

  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);

  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

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
    <main
      ref={containerRef}
      className="relative w-screen overflow-y-auto snap-y snap-mandatory"
      style={{ height: 'var(--app-height)' }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          ref={(el) => { slideRefs.current[index] = el; }}
          className="h-full w-full snap-start flex-shrink-0"
        >
          <Slide
            slide={slide}
            isActive={index === activeIndex && !isAnyModalOpen}
            setIsModalOpen={setIsTopBarModalOpen}
            openAccountPanel={openAccountPanel}
            openCommentsModal={openCommentsModal}
            openInfoModal={openInfoModal}
          />
        </div>
      ))}

      <AccountPanel isOpen={isAccountPanelOpen} onClose={closeAccountPanel} />
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={closeCommentsModal}
        slideId={slides[activeIndex]?.id}
        initialCommentsCount={slides[activeIndex]?.initialComments || 0}
      />
      <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
    </main>
  );
}
