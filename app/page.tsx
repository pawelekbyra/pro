// app/page.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
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
  isActiveColumn: boolean;
}

const Row = ({ index, style, data }: ListChildComponentProps<RowData>) => {
  const { columnSlides, activeSlideIndex, isActiveColumn } = data;
  const slide = columnSlides[index];

  if (!slide) {
    return (
      <div style={style} className="w-full h-full bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // An item is active if it's in the active column and is the active slide index
  const isActive = isActiveColumn && index === activeSlideIndex;

  return (
    <div style={style} className={`w-full h-full scroll-snap-align-start`}>
      <SlideRenderer slide={slide} isActive={isActive} />
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

  // Create a ref for each list instance
  const listRefs = useRef<{ [key: number]: List | null }>({});

  useEffect(() => {
    const handleResize = () => {
      setAppHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When active column or slide changes, scroll the correct list to the active slide
  useEffect(() => {
    const activeList = listRefs.current[activeColumnIndex];
    if (activeList) {
      activeList.scrollToItem(activeSlideIndex, 'start');
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

  const debouncedSetActiveSlide = useMemo(() => debounce(setActiveSlide, 50), [setActiveSlide]);

  const onItemsRendered = ({ visibleStartIndex }: { visibleStartIndex: number }) => {
    if (visibleStartIndex !== activeSlideIndex) {
      debouncedSetActiveSlide(visibleStartIndex);
    }
  };

  const currentKeyIndex = columnKeys.indexOf(activeColumnIndex);

  return (
    <>
      <GlobalVideoPlayer />
      <motion.div
        className="relative h-full w-full overflow-hidden flex"
        style={{ height: appHeight || '100vh', width: windowWidth * columnKeys.length, x: `-${currentKeyIndex * windowWidth}px` }}
        drag="x"
        dragConstraints={{ left: -((columnKeys.length - 1) * windowWidth), right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        animate={{ x: `-${currentKeyIndex * windowWidth}px` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {columnKeys.map(key => (
          <div key={key} className="flex-shrink-0" style={{ width: windowWidth, height: appHeight }}>
            {appHeight > 0 && windowWidth > 0 && columns[key] && (
              <List
                ref={el => (listRefs.current[key] = el)}
                height={appHeight}
                width={windowWidth}
                itemCount={columns[key].length}
                itemSize={appHeight}
                onItemsRendered={key === activeColumnIndex ? onItemsRendered : undefined}
                itemData={{
                  columnSlides: columns[key],
                  activeSlideIndex,
                  isActiveColumn: key === activeColumnIndex,
                }}
                initialScrollOffset={key === activeColumnIndex ? activeSlideIndex * appHeight : 0}
                className="scroll-snap-y-mandatory"
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