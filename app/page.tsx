"use client";

import { useState, useEffect, useRef } from 'react';
import Video, { VideoData } from '@/components/Video'; // Renamed Slide to Video
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTopBarModalOpen, setIsTopBarModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        if (!response.ok) throw new Error('Failed to fetch videos');
        const data = await response.json();
        setVideos(data.videos);
        videoRefs.current = videoRefs.current.slice(0, data.videos.length);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      }
    };
    fetchVideos();
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
            const index = videoRefs.current.indexOf(entry.target as HTMLDivElement);
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

    const currentRefs = videoRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [videos]);

  const openAccountPanel = () => setIsAccountPanelOpen(true);
  const closeAccountPanel = () => setIsAccountPanelOpen(false);

  const openCommentsModal = () => setIsCommentsModalOpen(true);
  const closeCommentsModal = () => setIsCommentsModalOpen(false);

  const openInfoModal = () => setIsInfoModalOpen(true);
  const closeInfoModal = () => setIsInfoModalOpen(false);

  const isAnyModalOpen = isAccountPanelOpen || isCommentsModalOpen || isInfoModalOpen || isTopBarModalOpen;

  if (videos.length === 0) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        {/* Top Bar Skeleton */}
        <div className="absolute top-0 left-0 right-0 z-30 flex justify-center items-center" style={{height: 'var(--topbar-height)', paddingTop: 'var(--safe-area-top)'}}>
            <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="absolute right-2 flex flex-col items-center gap-6 z-20" style={{top: '50%', transform: 'translateY(-50%)'}}>
            <Skeleton className="h-12 w-12 rounded-full border-2 border-white" />
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-8" />
            </div>
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-8" />
            </div>
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-8" />
            </div>
        </div>

        {/* Video Info Skeleton */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4" style={{paddingBottom: 'calc(20px + var(--safe-area-bottom))'}}>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-4 w-40" />
        </div>

        {/* Bottom Bar (Progress) Skeleton */}
        <div className="absolute bottom-0 left-0 w-full h-1 z-20" style={{bottom: 'var(--safe-area-bottom)'}}>
          <Skeleton className="h-full w-1/3" />
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
      {videos.map((video, index) => (
        <div
          key={video.id}
          ref={(el) => { videoRefs.current[index] = el; }}
          className="h-full w-full snap-start flex-shrink-0"
        >
          <Video
            video={video}
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
        videoId={videos[activeIndex]?.id}
        initialCommentsCount={videos[activeIndex]?.initialComments || 0}
      />
      <InfoModal isOpen={isInfoModalOpen} onClose={closeInfoModal} />
    </main>
  );
}
