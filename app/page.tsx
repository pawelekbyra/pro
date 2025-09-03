"use client";

import { useEffect, useRef, useState } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import GlobalVideoPlayer from '@/components/GlobalVideoPlayer';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';

interface RowData {
  columnSlides: any[];
  activeSlideId: string | null;
  setActiveSlide: (x: number, y: number, id: string) => void;
}

const Row = ({ index, style, data }: ListChildComponentProps<RowData>) => {
  const { columnSlides, activeSlideId } = data;
  const slide = columnSlides[index];

  if (!slide) {
    return (
      <div style={style} className="w-full h-full bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div style={style} className="w-full h-full">
      <SlideRenderer
        slide={slide}
        isActive={activeSlideId === slide.id}
      />
    </div>
  );
};

export default function Home() {
  const {
    state: { columns, activeColumnIndex, activeSlideId, error, activeModal, isNavigating },
    isAnyModalOpen,
    columnKeys,
    isLoading,
    setActiveModal,
    activeSlide,
    handleNavigation,
    setActiveSlide,
    loadMoreItems,
  } = useVideoGrid();

  const [appHeight, setAppHeight] = useState(0);
  const listRef = useRef<List | null>(null);

  useEffect(() => {
    const handleResize = () => setAppHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(activeSlide?.y || 0, 'center');
    }
  }, [activeSlide?.y]);

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    if (isAnyModalOpen || isNavigating) return;
    const swipeThreshold = 80;
    if (offset.x < -swipeThreshold) {
      handleNavigation('right');
    } else if (offset.x > swipeThreshold) {
      handleNavigation('left');
    }
  };

  const onVerticalScroll = ({ visibleStartIndex, visibleStopIndex }: { visibleStartIndex: number; visibleStopIndex: number }) => {
    if (isNavigating) return;
    const column = columns[activeColumnIndex];
    if (!column || column.length === 0) return;

    const centeredIndex = Math.round((visibleStartIndex + visibleStopIndex) / 2);
    const centeredSlide = column[centeredIndex];

    if (centeredSlide && centeredSlide.id !== activeSlideId) {
      setActiveSlide(centeredSlide.x, centeredSlide.y, centeredSlide.id);
    }

    // Obsługa ładowania kolejnych slajdów
    const buffer = 5;
    if (visibleStopIndex >= column.length - 1 - buffer) {
      loadMoreItems(activeColumnIndex);
    }
  };

  const activeColumnSlides = columns[activeColumnIndex] || [];
  const itemCount = activeColumnSlides.length;

  return (
    <>
      <GlobalVideoPlayer />
      <motion.div
        className="relative h-full w-full overflow-hidden"
        style={{ height: appHeight || '100vh' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeColumnIndex}
            className="w-full h-full flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {itemCount > 0 && appHeight > 0 && (
              <List
                ref={listRef}
                height={appHeight}
                itemCount={itemCount}
                itemSize={appHeight}
                onItemsRendered={onVerticalScroll}
                itemData={{ columnSlides: activeColumnSlides, activeSlideId, setActiveSlide }}
              >
                {Row}
              </List>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {activeModal === 'account' && <AccountPanel onClose={() => setActiveModal(null)} />}
        {activeModal === 'comments' && activeSlide && (
          <CommentsModal
            isOpen={activeModal === 'comments'}
            slideId={activeSlide.id}
            initialCommentsCount={activeSlide.initialComments}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'info' && <InfoModal isOpen={activeModal === 'info'} onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
    </>
  );
}