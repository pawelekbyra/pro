"use client";

import { useEffect, useRef, useState, useCallback, Fragment, useMemo } from 'react';
import { useVideoGrid } from '@/context/VideoGridContext';
import SlideRenderer from '@/components/SlideRenderer';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import AccountPanel from '@/components/AccountPanel';
import CommentsModal from '@/components/CommentsModal';
import InfoModal from '@/components/InfoModal';
import { List, ListImperativeAPI } from 'react-window';
import GlobalVideoPlayer from '@/components/GlobalVideoPlayer';

type RowData = {
  columnSlides: any[];
  activeSlideId: string | null;
};

// A component to render a single slide in the virtualized list
const Row = ({ index, style, columnSlides, activeSlideId }: { index: number, style: React.CSSProperties } & RowData) => {
  const slide = columnSlides[index];

  if (!slide) {
    // Render a placeholder or nothing if the slide isn't loaded yet
    return (
      <div style={style} className="w-full">
        <div className="h-full w-full bg-black flex items-center justify-center">Loading...</div>
      </div>
    );
  }

  return (
    <div style={style} id={`slide-${slide.id}`} data-y={slide.y} className="w-full">
      <SlideRenderer
        slide={slide}
        isActive={activeSlideId === slide.id}
      />
    </div>
  );
};

export default function Home() {
  const {
    state: { columns, activeColumnIndex, activeSlideId, error, activeModal, isNavigating, activeSlideY },
    isAnyModalOpen,
    columnKeys,
    isLoading,
    setActiveModal,
    activeSlide,
    handleNavigation,
    setActiveSlide,
    loadMoreItems, // TODO: Implement this in VideoGridContext
  } = useVideoGrid();

  const [appHeight, setAppHeight] = useState(0);
  const listRefs = useRef<{ [key: number]: ListImperativeAPI | null }>({});

  useEffect(() => {
    const handleResize = () => {
      setAppHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial height
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to the active slide when the column or slide changes
  useEffect(() => {
    const list = listRefs.current[activeColumnIndex];
    const column = columns[activeColumnIndex];
    if (list && column) {
      const activeIndex = column.findIndex(s => s.y === activeSlideY);
      if (activeIndex !== -1) {
        list.scrollToRow({ index: activeIndex, align: 'center' });
      }
    }
  }, [activeColumnIndex, activeSlideY, columns]);

  // Keep the database warm to prevent cold starts
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/health').catch(err => console.error("DB warmup failed:", err));
    }, 240000); // 4 minutes
    return () => clearInterval(interval);
  }, []);

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    if (isAnyModalOpen || isNavigating) return;
    const swipeThreshold = 80;
    if (offset.x < -swipeThreshold) {
      handleNavigation('right');
    } else if (offset.x > swipeThreshold) {
      handleNavigation('left');
    }
  };

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedOnItemsRendered = useMemo(
    () =>
      debounce(({ startIndex, stopIndex }: { startIndex: number, stopIndex: number }) => {
        if (isNavigating) return;

        const column = columns[activeColumnIndex];
        if (!column || column.length === 0) return;

        const centeredIndex = Math.min(
          column.length - 1,
          Math.round((startIndex + stopIndex) / 2)
        );
        const centeredSlide = column[centeredIndex];

        if (centeredSlide && centeredSlide.id !== activeSlideId) {
          setActiveSlide(centeredSlide.x, centeredSlide.y, centeredSlide.id);
        }
      }, 150),
    [activeColumnIndex, activeSlideId, columns, isNavigating, setActiveSlide]
  );


  if (isLoading && !activeSlideId) {
    return <main className="h-full w-full flex items-center justify-center"><p>Loading...</p></main>;
  }

  if (error) {
    return <main className="h-full w-full flex items-center justify-center"><p className="text-red-500">Error: {error.message}</p></main>;
  }

  const activeColumnIndexInKeys = columnKeys.indexOf(activeColumnIndex);

  const appContent = (
    <motion.div
      className="relative h-full w-full overflow-hidden flex"
      style={{ height: appHeight || '100vh' }}
    >
      <motion.div
        className="flex z-10" // Ensure columns are on top of the global player
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        animate={{ x: `-${activeColumnIndexInKeys * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
      >
        {columnKeys.map((colIndex) => {
          const columnSlides = columns[colIndex] || [];
          const itemCount = columnSlides.length;

          const handleRowsRendered = ({ startIndex, stopIndex }: { startIndex: number, stopIndex: number }) => {
            debouncedOnItemsRendered({ startIndex, stopIndex });

            const buffer = 5;
            if (stopIndex >= itemCount - 1 - buffer) {
              loadMoreItems(colIndex);
            }
          };

          return (
            <div
              key={colIndex}
              data-active-column={activeColumnIndex === colIndex}
              className="h-full w-screen flex-shrink-0"
            >
              {appHeight > 0 && (
                <List<RowData>
                  listRef={(list) => {
                    listRefs.current[colIndex] = list;
                  }}
                  style={{ height: appHeight, width: '100%' }}
                  rowCount={itemCount}
                  rowHeight={appHeight}
                  rowProps={{ columnSlides, activeSlideId }}
                  onRowsRendered={handleRowsRendered}
                  rowComponent={Row}
                >
                </List>
              )}
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <GlobalVideoPlayer />
      {appContent}
      <AnimatePresence>
        {activeModal === 'account' && (
          <AccountPanel onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'comments' && activeSlide && (
          <CommentsModal
            isOpen={activeModal === 'comments'}
            slideId={activeSlide.id}
            initialCommentsCount={activeSlide.initialComments}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'info' && (
          <InfoModal isOpen={activeModal === 'info'} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}