"use client";

import React from 'react';

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative h-full w-full flex justify-center">
            <div className="relative h-full w-full max-w-sm overflow-hidden">
                {children}
            </div>
        </div>
    );
}
