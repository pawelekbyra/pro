"use client";

import React from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import CommentsModal from './CommentsModal';
import InfoModal from './InfoModal';
import AccountPanel from './AccountPanel';
import { AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
    const context = useVideoGrid();

    // The context can be undefined on the very first render, so we need a guard.
    if (!context) {
        return null;
    }

    const { state, setActiveModal, activeSlide } = context;
    const { activeVideoRef } = state;

    return (
        <div
            className="relative h-screen w-full flex justify-center items-center bg-zinc-900"
        >
            <div className="relative h-full max-h-[960px] aspect-[9/16] overflow-hidden rounded-md shadow-lg border-x border-white/10 flex flex-col bg-black">
                <TopBar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
                {activeVideoRef && <BottomBar videoRef={activeVideoRef} isActive={true} />}
                <PWAInstallPrompt />
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
