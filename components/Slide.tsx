"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import {
  Slide as SlideUnionType,
  HtmlSlide,
  ImageSlide,
} from '@/lib/types';
import { useStore, ModalType } from '@/store/useStore';
import { MessageCircle } from 'lucide-react';

// --- Prop Types for Sub-components ---
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
        // We only toggle play if the click is on the container itself,
        // not on the UI elements within it.
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

const Slide = memo<SlideProps>(({ slide }) => {
    const { togglePlay } = useStore();

    const renderContent = () => {
        switch (slide.type) {
            case 'video':
                // The global video player will handle the actual video rendering.
                // This component only needs to provide the UI overlay.
                return <div className="w-full h-full bg-black" />;
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
            <SlideUI slide={slide} onTogglePlay={togglePlay} />
            {/* VideoControls are now removed as playback is global */}
        </div>
    );
});

Slide.displayName = 'Slide';
export default Slide;
