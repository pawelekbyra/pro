"use client";

import { useEffect, useState } from 'react';
import DesktopLayout from '@/components/DesktopLayout';
import { mockGrid } from '@/lib/mock-data';
import SlideRenderer from '@/components/SlideRenderer';

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
            <div className="grid grid-cols-4 grid-rows-4 h-full w-full">
                {Object.values(mockGrid).map((slide) => (
                    <div key={slide.id} className="h-full w-full">
                        <SlideRenderer slide={slide} />
                    </div>
                ))}
            </div>
        </main>
    );

    return isMobile ? appContent : <DesktopLayout>{appContent}</DesktopLayout>;
}