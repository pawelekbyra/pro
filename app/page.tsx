// app/page.tsx
"use client";

import SlideRenderer from '@/components/SlideRenderer';
import GlobalVideoPlayer from '@/components/GlobalVideoPlayer';
import { VideoSlide } from '@/lib/types';

// Statyczny obiekt slajdu, używany do renderowania, gdy dane nie są jeszcze dostępne
const staticSlide: VideoSlide = {
  id: '1',
  x: 0,
  y: 0,
  userId: 'static-user',
  username: 'Static User',
  avatar: '/avatars/default.png',
  access: 'public',
  createdAt: Date.now(),
  initialLikes: 0,
  isLiked: false,
  initialComments: 0,
  type: 'video',
  data: {
    mp4Url: '', // URL zostanie ustawiony przez GlobalVideoPlayer
    hlsUrl: null,
    poster: '/qr-code-placeholder.png', // Domyślny poster
    title: 'Welcome',
    description: 'This is a statically rendered slide.',
  },
};

export default function Home() {
  return (
    <>
      <GlobalVideoPlayer />
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <SlideRenderer slide={staticSlide} isActive={true} />
      </div>
    </>
  );
}