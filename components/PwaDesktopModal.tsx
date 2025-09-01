"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface PwaDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PwaDesktopModal: React.FC<PwaDesktopModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-zinc-800 text-white rounded-lg p-8 shadow-xl max-w-sm w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <h3 className="text-2xl font-bold mb-4">Pobierz aplikację na telefon</h3>
            <p className="mb-6">
              Wersja na komputery stacjonarne nie obsługuje pełnego doświadczenia.
              Proszę zeskanować kod QR lub wejść na naszą stronę na telefonie,
              aby pobrać aplikację i odkryć świat tingotong!
            </p>
            <div className="w-32 h-32 bg-white mx-auto">
              {/* Placeholder for QR Code */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaDesktopModal;
