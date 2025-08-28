"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useFocusTrap } from '@/lib/useFocusTrap';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-white rounded-xl flex flex-col text-black"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{t('infoModalTitle')}</h2>
              <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black" aria-label={t('close')}>
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-sm space-y-4">
              <p>{t('loremIpsum1')}</p>
              <p>{t('loremIpsum2')}</p>

              <div className="bg-gray-100 rounded-lg p-4 text-center border border-gray-200">
                <Heart className="mx-auto text-pink-500 mb-2" size={32} />
                <p className="font-semibold">{t('infoModalTipHeader')}</p>
                <p className="text-xs text-gray-600">{t('infoModalTipBody')}</p>
              </div>

              <p>{t('loremIpsum3')}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;
