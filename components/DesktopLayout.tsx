"use client";

import React from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import AccountPanel from './AccountPanel';

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
    const context = useVideoGrid();

    // The context can be undefined on the very first render, so we need a guard.
    if (!context) {
        return null;
    }

    const { state, setActiveModal, activeSlide } = context;

    return (
        <div className="relative h-full w-full flex justify-center">
            <div className="relative h-full w-full max-w-sm overflow-hidden">
                {children}
            </div>

            {/* Conditionally render modals based on the centralized state */}
            <CommentsModal
                isOpen={state.activeModal === 'comments'}
                onClose={() => setActiveModal(null)}
                slideId={activeSlide?.id}
                initialCommentsCount={activeSlide?.initialComments || 0}
            />
            <InfoModal
                isOpen={state.activeModal === 'info'}
                onClose={() => setActiveModal(null)}
            />
            <AccountPanel
                isOpen={state.activeModal === 'account'}
                onClose={() => setActiveModal(null)}
            />
        </div>
    );
}
