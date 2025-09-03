"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import GlobalVideoPlayer from '@/components/GlobalVideoPlayer';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';
import Sidebar from '@/components/Sidebar';
import { debounce } from '@/lib/utils';
import { Slide } from '@/lib/types';

interface RowData {
  columnSlides: Slide[];
  activeSlideIndex: number;
}

const Row = ({ index, style, data }: ListChildComponentProps<RowData>) => {
  const slide = data.columnSlides[index];
  if (!slide) {
    return <div style={style} className="w-full h-full bg-black flex items-center justify-center text-white">Loading...</div>;
  }
  return (
    <div style={style} className="w-full h-full">
      <SlideRenderer slide={slide} isActive={index === data.activeSlideIndex} />
    </div>
  );
};

export default function Home() {
  const {
    state: { columns, columnKeys, activeColumnIndex, activeSlideIndex, activeSlideData, activeModal, error },
    isAnyModalOpen,
    setActiveModal,
    setActiveColumn,
    setActiveSlide,
  } = useVideoGrid();

  const [appHeight, setAppHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const listRef = useRef<List | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setAppHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(activeSlideIndex, 'start');
    }
  }, [activeColumnIndex, activeSlideIndex]);

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    if (isAnyModalOpen) return;
    const swipeThreshold = 80;
    const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);

    if (offset.x < -swipeThreshold && currentKeyIndex < columnKeys.length - 1) {
      setActiveColumn(columnKeys[currentKeyIndex + 1]);
    } else if (offset.x > swipeThreshold && currentKeyIndex > 0) {
      setActiveColumn(columnKeys[currentKeyIndex - 1]);
    }
  };

  const debouncedSetActiveSlide = useCallback(debounce(setActiveSlide, 50), [setActiveSlide]);

  const onItemsRendered = ({ visibleStartIndex }: { visibleStartIndex: number }) => {
    if (visibleStartIndex !== activeSlideIndex) {
      debouncedSetActiveSlide(visibleStartIndex);
    }
  };

  const activeColumnSlides = columns[activeColumnIndex] || [];

  return (
    <>
      <GlobalVideoPlayer />
      <motion.div
        className="relative h-full w-full overflow-hidden flex"
        style={{ height: appHeight || '100vh', width: windowWidth * columnKeys.length, x: `-${activeColumnIndex * windowWidth}px` }}
        drag="x"
        dragConstraints={{ left: -((columnKeys.length - 1) * windowWidth), right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        animate={{ x: `-${activeColumnIndex * windowWidth}px` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {columnKeys.map(key => (
          <div key={key} className="flex-shrink-0" style={{ width: windowWidth, height: appHeight }}>
            {appHeight > 0 && windowWidth > 0 && (
              <List
                ref={listRef}
                height={appHeight}
                width={windowWidth}
                itemCount={columns[key]?.length || 0}
                itemSize={appHeight}
                onItemsRendered={onItemsRendered}
                itemData={{ columnSlides: columns[key], activeSlideIndex }}
                initialScrollOffset={key === activeColumnIndex ? activeSlideIndex * appHeight : 0}
              >
                {Row}
              </List>
            )}
          </div>
        ))}
      </motion.div>
      <AnimatePresence>
        {activeModal === 'account' && <AccountPanel onClose={() => setActiveModal(null)} />}
        {activeModal === 'comments' && activeSlideData && (
          <CommentsModal
            isOpen={activeModal === 'comments'}
            slideId={activeSlideData.id}
            initialCommentsCount={activeSlideData.initialComments}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'info' && <InfoModal isOpen={activeModal === 'info'} onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
      {activeSlideData && (
        <Sidebar
          avatar={activeSlideData.avatar}
          initialLikes={activeSlideData.initialLikes}
          isLiked={activeSlideData.isLiked}
          slideId={activeSlideData.id}
          commentsCount={activeSlideData.initialComments}
          x={activeSlideData.x}
        />
      )}
    </>
  );
}