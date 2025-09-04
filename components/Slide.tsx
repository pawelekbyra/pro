"use client";

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import {
  Slide as SlideUnionType,
  HtmlSlide,
  ImageSlide,
  VideoSlide,
} from '@/lib/types';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import { AnimatePresence, motion } from 'framer-motion';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import Sidebar from './Sidebar';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import SecretOverlay from './SecretOverlay';

// --- Prop Types ---

interface SlideProps {
  slide: SlideUnionType;
  isActive: boolean; // Is the slide currently visible in the viewport?
}

// --- Sub-components for different slide types ---

const HtmlContent = ({ slide }: { slide: HtmlSlide }) => {
  if (!slide.data?.htmlContent) return null;
  const sanitizedHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(slide.data.htmlContent) : slide.data.htmlContent;
  return (
    <div
      className="w-full h-full overflow-y-auto bg-white"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

const ImageContent = ({ slide }: { slide: ImageSlide }) => {
  if (!slide.data?.imageUrl) return null;
  return (
    <div className="relative w-full h-full bg-black">
      <Image
        src={slide.data.imageUrl}
        alt={slide.data.altText || 'Slide image'}
        layout="fill"
        objectFit="contain"
        unoptimized
      />
    </div>
  );
};


// --- Main Slide Component ---

const Slide = memo<SlideProps>(({ slide, isActive }) => {
    const { isLoggedIn } = useUser();
    const showSecretOverlay = slide.access === 'secret' && !isLoggedIn;

    // --- Local state for video player ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [showPlaybackIcon, setShowPlaybackIcon] = useState(false);
    const iconTimer = useRef<NodeJS.Timeout | null>(null);

    // --- Player control handlers ---
    const togglePlay = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const handleTogglePlayWithIcon = () => {
        togglePlay();
        setShowPlaybackIcon(true);
        if (iconTimer.current) clearTimeout(iconTimer.current);
        iconTimer.current = setTimeout(() => setShowPlaybackIcon(false), 800);
    }

    const handleSeek = (time: number) => {
        // In a real implementation, you'd need a way to tell the VideoPlayer to seek.
        // For now, we just update the state.
        setCurrentTime(time);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        // Optionally, you could implement auto-advance here
    };

    useEffect(() => {
        // Automatically start playing when the slide becomes active, and pause when it becomes inactive.
        if (isActive) {
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [isActive]);


    useEffect(() => {
        return () => {
            if (iconTimer.current) clearTimeout(iconTimer.current);
        };
    }, []);


    const renderContent = () => {
        switch (slide.type) {
            case 'video':
                const videoSlide = slide as VideoSlide;
                if (!videoSlide.data?.hlsUrl) return <div className="w-full h-full bg-black" />;
                return (
                    <VideoPlayer
                        hlsUrl={videoSlide.data.hlsUrl}
                        isActive={isActive && isPlaying}
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted(prev => !prev)}
                        onTimeUpdate={setCurrentTime}
                        onDurationChange={setDuration}
                        onEnded={handleEnded}
                    />
                );
            case 'html':
                return <HtmlContent slide={slide as HtmlSlide} />;
            case 'image':
                return <ImageContent slide={slide as ImageSlide} />;
            default:
                return <div className="w-full h-full bg-gray-800 flex items-center justify-center"><p>Unsupported slide type</p></div>;
        }
    };

    const isVideoSlide = slide.type === 'video';

    return (
        <div className={cn(
            "relative w-full h-full bg-black",
            showSecretOverlay && "blur-md brightness-50"
        )}>
            {renderContent()}

            {showSecretOverlay ? <SecretOverlay /> : (
                 <div
                    className="absolute inset-0 z-10 p-4 flex flex-col justify-end text-white"
                    onClick={isVideoSlide ? handleTogglePlayWithIcon : undefined}
                  >
                    {/* Gradients */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                    {/* Playback Icon Animation */}
                    <AnimatePresence>
                        {showPlaybackIcon && (
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                initial={{ opacity: 0, scale: 1.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="bg-black/50 rounded-full p-4">
                                    {!isPlaying ? <PlayIcon className="w-12 h-12 text-white" /> : <PauseIcon className="w-12 h-12 text-white" />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* UI Controls Container */}
                    <div className="relative z-20">
                        <div className="flex items-center gap-2 mb-2">
                            <Image src={slide.avatar || '/avatars/default.png'} alt={slide.username} width={40} height={40} className="rounded-full border-2 border-white" />
                            <p className="font-bold text-lg">{slide.username}</p>
                        </div>
                        {slide.data && 'title' in slide.data && <h2 className="text-xl font-semibold mb-1">{slide.data.title}</h2>}
                        {slide.data && 'description' in slide.data && <p className="text-sm opacity-90">{slide.data.description}</p>}
                    </div>

                    <Sidebar
                        slideId={slide.id}
                        initialLikes={slide.initialLikes}
                        initialIsLiked={slide.isLiked}
                        commentsCount={slide.initialComments}
                    />

                    {isVideoSlide && (
                        <VideoControls
                          currentTime={currentTime}
                          duration={duration}
                          isPlaying={isPlaying}
                          isMuted={isMuted}
                          onTogglePlay={togglePlay}
                          onToggleMute={() => setIsMuted(prev => !prev)}
                          onSeek={handleSeek}
                        />
                    )}
                 </div>
            )}
        </div>
    );
});

Slide.displayName = 'Slide';
export default Slide;
