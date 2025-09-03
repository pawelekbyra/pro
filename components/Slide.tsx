"use client";

import React, { useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import Hls from 'hls.js';
import DOMPurify from 'dompurify';
import {
  Slide as SlideUnionType,
  VideoSlide,
  HtmlSlide,
  ImageSlide,
} from '@/lib/types';
import { useStore } from '@/store/useStore';
import { HeartIcon, MessageCircle } from 'lucide-react';

// --- Prop Types for Sub-components ---
interface VideoPlayerProps {
  slide: VideoSlide;
  isActive: boolean;
}
interface HtmlContentProps {
  slide: HtmlSlide;
}
interface ImageContentProps {
  slide: ImageSlide;
}
interface SlideUIProps {
    slide: SlideUnionType;
}

// --- Sub-components ---

const VideoPlayer = ({ slide, isActive }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // This function will be called to clean up the previous effect
    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    if (isActive && slide.data) {
      if (slide.data.hlsUrl && Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(slide.data.hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => console.error('Video play was prevented.'));
        });
      } else if (slide.data.mp4Url) {
        video.src = slide.data.mp4Url;
        video.play().catch(() => console.error('Video play was prevented.'));
      }
    }

    // Return the cleanup function
    return cleanup;
  }, [isActive, slide.data]);

  if (!slide.data) return null;

  return (
    <video
      ref={videoRef}
      poster={slide.data.poster}
      className="w-full h-full object-cover"
      playsInline
      loop
      muted
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

const SlideUI = ({ slide }: SlideUIProps) => {
    const toggleLike = useStore((state) => state.toggleLike);
    const setActiveModal = useStore((state) => state.setActiveModal);

    const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleLike(slide.x, slide.y);
    };

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveModal('comments');
    }

    return (
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent p-4 flex flex-col justify-end text-white">
        <div className="flex items-center gap-2 mb-2">
          <Image src={slide.avatar || '/avatars/default.png'} alt={slide.username} width={40} height={40} className="rounded-full border-2 border-white" />
          <p className="font-bold text-lg">{slide.username}</p>
        </div>

        {slide.data && 'title' in slide.data && <h2 className="text-xl font-semibold mb-1">{slide.data.title}</h2>}
        {slide.data && 'description' in slide.data && <p className="text-sm opacity-90">{slide.data.description}</p>}

        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4">
            <button onClick={handleLike} className="flex flex-col items-center gap-1 text-white">
                <HeartIcon size={32} fill={slide.isLiked ? 'red' : 'transparent'} className={slide.isLiked ? 'text-red-500' : 'text-white'}/>
                <span className="text-sm font-bold">{slide.initialLikes}</span>
            </button>
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
  const renderContent = () => {
    switch (slide.type) {
      case 'video':
        return <VideoPlayer slide={slide} isActive={isActive} />;
      case 'html':
        return <HtmlContent slide={slide} />;
      case 'image':
        return <ImageContent slide={slide} />;
      default:
        return <div className="w-full h-full bg-gray-800 flex items-center justify-center"><p>Unsupported slide type</p></div>;
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {renderContent()}
      <SlideUI slide={slide} />
      {isActive && <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">ACTIVE</div>}
    </div>
  );
});

Slide.displayName = 'Slide';
export default Slide;
