"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  initialScrollOffset: number;
  listRef: React.RefObject<List>;
}

const Row = ({ index, style, data }: ListChildComponentProps<RowData>) => {
  const { columnSlides, activeSlideIndex } = data;
  const slide = columnSlides[index];

  if (!slide) {
    return (
      <div style={style} className="w-full h-full bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const isClone = index === 0 || index === columnSlides.length + 1;
  const isActive = index === activeSlideIndex;

  return (
    <div style={style} className={`w-full h-full scroll-snap-align-start`}>
      {/* Nie renderuj treści dla klonów, aby uniknąć problemów z odtwarzaniem wideo */}
      {!isClone && <SlideRenderer slide={slide} isActive={isActive} />}
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
  const isScrollingProgrammatically = useRef(false);

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
      const targetIndex = activeSlideIndex + 1;
      isScrollingProgrammatically.current = true;
      listRef.current.scrollToItem(targetIndex, 'start');
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

  const onItemsRendered = ({ visibleStartIndex, overscanStartIndex, overscanStopIndex, visibleStopIndex }: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    // Zapobiegaj aktualizacji stanu podczas programowego przewijania, aby uniknąć błędów
    if (isScrollingProgrammatically.current) {
      isScrollingProgrammatically.current = false;
      return;
    }

    if (visibleStartIndex !== activeSlideIndex + 1) {
      const realIndex = visibleStartIndex - 1; // Odejmij 1, aby uwzględnić klon na początku
      debouncedSetActiveSlide(realIndex);
    }
  };

  const activeColumnSlides = columns[activeColumnIndex] || [];
  const loopedSlides = [
    activeColumnSlides[activeColumnSlides.length - 1], // Klap z ostatniego slajdu
    ...activeColumnSlides,
    activeColumnSlides[0], // Klon pierwszego slajdu
  ].filter(Boolean);

  const handleScroll = (scrollOffset: number) => {
    const totalSlides = activeColumnSlides.length;
    const scrollHeight = appHeight * (totalSlides + 2); // Wysokość całej listy z klonami
    const slideHeight = appHeight;

    if (listRef.current && scrollHeight > 0) {
      // Użytkownik przewinął na dół do klonu pierwszego slajdu
      if (scrollOffset >= slideHeight * (totalSlides + 1)) {
        isScrollingProgrammatically.current = true;
        listRef.current.scrollTo(slideHeight);
        return;
      }

      // Użytkownik przewinął na górę do klonu ostatniego slajdu
      if (scrollOffset <= 0) {
        isScrollingProgrammatically.current = true;
        listRef.current.scrollTo(slideHeight * totalSlides);
        return;
      }
    }
  };

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
                itemCount={loopedSlides.length}
                itemSize={appHeight}
                onItemsRendered={onItemsRendered}
                itemData={{ columnSlides: loopedSlides, activeSlideIndex: activeSlideIndex + 1, initialScrollOffset: appHeight, listRef }}
                initialScrollOffset={key === activeColumnIndex ? appHeight : 0}
                className="scroll-snap-y-mandatory"
                onScroll={({ scrollOffset }) => handleScroll(scrollOffset)}
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