"use client";

import React from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import AccountPanel from './AccountPanel';
import { AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
    const context = useVideoGrid();

    // The context can be undefined on the very first render, so we need a guard.
    if (!context) {
        return null;
    }

    const { state, setActiveModal, activeSlide } = context;

    return (
        <div
            className="relative h-full w-full flex justify-center bg-cover bg-center"
            style={{
                backgroundImage: "radial-gradient(ellipse at center, hsla(0, 0%, 0%, 0) 40%, hsla(0, 0%, 0%, 0.4) 70%, hsla(0, 0%, 0%, 0.8)), url('/bg-pattern.jpg')"
            }}
        >
            <div className="relative h-full w-full max-w-sm overflow-hidden border-x border-white/10">
                <TopBar />
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
            <AnimatePresence>
                {state.activeModal === 'account' && (
                    <AccountPanel
                        onClose={() => setActiveModal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
