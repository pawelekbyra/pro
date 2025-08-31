"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
  warning: <AlertTriangle className="text-yellow-500" />,
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const isDisplayingRef = useRef(false);

  const removeToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    if (
        (currentToast && currentToast.message === message) ||
        queue.some(t => t.message === message)
    ) {
        return;
    }

    const id = Date.now();
    setQueue((prevQueue) => [...prevQueue, { id, message, type }]);
  }, [queue, currentToast]);

  useEffect(() => {
    if (!currentToast && queue.length > 0 && !isDisplayingRef.current) {
        isDisplayingRef.current = true;
        const [nextToast, ...rest] = queue;
        setQueue(rest);
        setCurrentToast(nextToast);

        const timer = setTimeout(() => {
            removeToast();
            isDisplayingRef.current = false;
        }, 4000);

        return () => clearTimeout(timer);
    }
  }, [queue, currentToast, removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center pointer-events-none">
        <AnimatePresence onExitComplete={() => {
            isDisplayingRef.current = false;
        }}>
          {currentToast && (
            <motion.div
              key={currentToast.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="pointer-events-auto w-full max-w-xs"
            >
              <div
                className="flex items-center gap-3 bg-black/80 backdrop-blur-md text-white shadow-lg rounded-xl p-4 border border-white/10"
              >
                {ToastIcons[currentToast.type]}
                <span className="text-sm font-medium text-center flex-1">{currentToast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
