"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, MessageSquare, Heart, Mail, UserPlus } from 'lucide-react';
import { useTranslation } from './LanguageContext';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'like' | 'comment' | 'follow' | 'message';

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
  like: <Heart className="text-red-500" />,
  comment: <MessageSquare className="text-white" />,
  follow: <UserPlus className="text-white" />,
  message: <Mail className="text-white" />,
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 2000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-0 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none" style={{ paddingBottom: 'calc(var(--bottombar-height, 0px) + 10px)' }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="pointer-events-auto"
            >
              <div
                className="flex items-center gap-3 bg-black/80 backdrop-blur-md text-white shadow-lg rounded-full py-2 px-4"
              >
                {ToastIcons[toast.type]}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
