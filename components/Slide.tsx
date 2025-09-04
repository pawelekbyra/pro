"use client";

import React, { memo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import Hls from 'hls.js';
import {
  Slide as SlideUnionType,
  VideoSlide,
  HtmlSlide,
  ImageSlide,
} from '@/lib/types';
import { useStore, ModalType } from '@/store/useStore';
import { MessageCircle } from 'lucide-react';
import VideoControls from './VideoControls';

// --- Prop Types for Sub-components ---
interface VideoContentProps {
    slide: VideoSlide;
    videoRef: React.RefObject<HTMLVideoElement>;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
}
interface HtmlContentProps {
  slide: HtmlSlide;
}
interface ImageContentProps {
  slide: ImageSlide;
}
interface SlideUIProps {
    slide: SlideUnionType;
    onTogglePlay: () => void;
}

// --- Sub-components ---

const VideoContent = ({ slide, videoRef, setIsPlaying, setCurrentTime, setDuration }: VideoContentProps) => {
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        const slideData = slide.data;

        if (!video || !slideData || !slideData.hlsUrl) return;

        const setupHls = () => {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hlsRef.current = hls;
                hls.loadSource(slideData.hlsUrl as string);
                hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = slideData.hlsUrl as string;
            }
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration);

        setupHls();
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);

        return () => {
            hlsRef.current?.destroy();
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
        };
    }, [slide.data, videoRef, setIsPlaying, setCurrentTime, setDuration]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            controls={false} // We use custom controls
            muted // Autoplay on mobile requires muted
        />
    );
};

const HtmlContent = ({ slide }: HtmlContentProps) => {
  if (!slide.data?.htmlContent) return null;
  const sanitizedHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(slide.data.htmlContent) : slide.data.htmlContent;
  return (
    <div
      className="w-full h-full overflow-y-auto bg-white"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

const ImageContent = ({ slide }: ImageContentProps) => {
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

const SlideUI = ({ slide, onTogglePlay }: SlideUIProps) => {
    const setActiveModal = useStore((state) => state.setActiveModal);

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        const modal: ModalType = 'comments';
        setActiveModal(modal);
    }

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onTogglePlay();
        }
    }

    return (
      <div
        className="absolute inset-0 z-10 p-4 flex flex-col justify-end text-white"
        onClick={handleContainerClick}
      >
        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />


        {/* UI Controls Container */}
        <div className="relative z-20">
            <div className="flex items-center gap-2 mb-2">
                <Image src={slide.avatar || '/avatars/default.png'} alt={slide.username} width={40} height={40} className="rounded-full border-2 border-white" />
                <p className="font-bold text-lg">{slide.username}</p>
            </div>

            {slide.data && 'title' in slide.data && <h2 className="text-xl font-semibold mb-1">{slide.data.title}</h2>}
            {slide.data && 'description' in slide.data && <p className="text-sm opacity-90">{slide.data.description}</p>}
        </div>


        {/* Absolute positioned Icons */}
        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4 z-20">
            <button onClick={handleComment} className="flex flex-col items-center gap-1 text-white">
                <MessageCircle size={32} />
                <span className="text-sm font-bold">{slide.initialComments}</span>
            </button>
        </div>
      </div>
    );
  };

// --- Main Slide Component ---

interface SlideProps {
    slide: SlideUnionType;
    isActive: boolean;
}

const Slide = memo<SlideProps>(({ slide, isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Effect to handle play/pause when the active slide changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            video.muted = isMuted; // Use state to control mute
            video.play().catch(e => console.error("Play was prevented", e));
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [isActive, isMuted]); // Depend on isMuted as well

    const handleTogglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
    };

    const handleToggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    const handleSeek = (time: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
    };

    const renderContent = () => {
        switch (slide.type) {
            case 'video':
                return (
                    <VideoContent
                        slide={slide as VideoSlide}
                        videoRef={videoRef}
                        setIsPlaying={setIsPlaying}
                        setCurrentTime={setCurrentTime}
                        setDuration={setDuration}
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

    return (
        <div className="relative w-full h-full bg-black">
            {renderContent()}
            <SlideUI slide={slide} onTogglePlay={handleTogglePlay} />
            {isActive && slide.type === 'video' && (
                <VideoControls
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    onTogglePlay={handleTogglePlay}
                    onToggleMute={handleToggleMute}
                    onSeek={handleSeek}
                />
            )}
        </div>
    );
});

Slide.displayName = 'Slide';
export default Slide;
