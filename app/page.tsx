"use client";

import { useEffect, useState } from 'react';
import VideoGrid from '@/components/VideoGrid';
import DesktopLayout from '@/components/DesktopLayout';

export default function Home() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const appContent = (
        <main className="h-full w-full" style={{ height: 'var(--app-height)' }}>
            <VideoGrid initialCoordinates={{ x: 0, y: 0 }} />
        </main>
    );

    return isMobile ? appContent : <DesktopLayout>{appContent}</DesktopLayout>;
}