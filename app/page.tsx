"use client";

import { useEffect, useState } from 'react';
import VideoGrid from '@/components/VideoGrid';
import DesktopLayout from '@/components/DesktopLayout';

export default function Home() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const setAppHeight = () => {
            document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
            setIsMobile(window.innerWidth <= 768); // Ustawienie isMobile dla ekranów o szerokości do 768px
        };
        setAppHeight();
        window.addEventListener('resize', setAppHeight);
        return () => window.removeEventListener('resize', setAppHeight);
    }, []);

    const appContent = (
        <main className="h-full w-full" style={{ height: 'var(--app-height)' }}>
            <VideoGrid initialCoordinates={{ x: 0, y: 0 }} />
        </main>
    );

    return isMobile ? appContent : <DesktopLayout>{appContent}</DesktopLayout>;
}