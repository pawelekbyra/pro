"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { X, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { useTranslation } from '@/context/LanguageContext';


interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (blob: Blob | null) => void;
}

const CROP_AREA_SIZE = 200; // The size of the circular crop area

const CropModal: React.FC<CropModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (imageSrc) {
      const img = imageRef.current;
      img.src = imageSrc;
      img.onload = () => {
        // Reset state when new image is loaded
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const canvasRect = canvas.getBoundingClientRect();
        const minScale = Math.max(canvasRect.width / img.width, canvasRect.height / img.height);

        setScale(minScale);
        setOffset({ x: 0, y: 0 });
        drawCanvas(ctx, img, minScale, { x: 0, y: 0 });
      };
    }
  }, [imageSrc]);

  useEffect(() => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img.src) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawCanvas(ctx, img, scale, offset);
  }, [scale, offset]);

  const drawCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, currentScale: number, currentOffset: {x: number, y: number}) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imgWidth = img.width * currentScale;
    const imgHeight = img.height * currentScale;
    const x = (canvas.width - imgWidth) / 2 + currentOffset.x;
    const y = (canvas.height - imgHeight) / 2 + currentOffset.y;
    ctx.drawImage(img, x, y, imgWidth, imgHeight);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img.src) return;

    setIsSaving(true);

    const outputCanvas = document.createElement('canvas');
    const finalSize = Math.min(img.width, img.height, 256); // Output a reasonable size
    outputCanvas.width = finalSize;
    outputCanvas.height = finalSize;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    const cropAreaDeviceSize = CROP_AREA_SIZE;
    const cropAreaSourceSize = cropAreaDeviceSize / scale;

    const sourceX = (img.width / 2) - (canvasCenterX - (canvasCenterX + offset.x)) / scale - (cropAreaSourceSize / 2);
    const sourceY = (img.height / 2) - (canvasCenterY - (canvasCenterY + offset.y)) / scale - (cropAreaSourceSize / 2);

    ctx.drawImage(img, sourceX, sourceY, cropAreaSourceSize, cropAreaSourceSize, 0, 0, finalSize, finalSize);

    outputCanvas.toBlob((blob) => {
        if (blob) {
            onCropComplete(blob);
        } else {
            console.error("Canvas to Blob conversion failed.");
            onCropComplete(null);
        }
        setIsSaving(false);
    }, 'image/png', 0.9);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[rgba(20,20,20,0.95)] rounded-2xl p-6 w-full max-w-md border border-white/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">{t('cropAvatarTitle')}</h3>
              <Button variant="ghost" size="icon" onClick={onClose} disabled={isSaving} aria-label={t('closeCropModalAriaLabel')}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="relative w-full h-72 bg-black rounded-lg overflow-hidden mb-5 border-2 border-white/10">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                aria-label={t('cropCanvasAriaLabel')}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white rounded-full pointer-events-none"
                style={{ width: CROP_AREA_SIZE, height: CROP_AREA_SIZE }}
              ></div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <Button variant="outline" size="icon" onClick={() => setScale(s => s * 0.9)} disabled={isSaving} aria-label={t('zoomOutAriaLabel')}><ZoomOut className="h-5 w-5" /></Button>
              <Input
                type="range"
                min={0.1} max={3} step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
                disabled={isSaving}
                aria-label={t('zoomSliderAriaLabel')}
              />
              <Button variant="outline" size="icon" onClick={() => setScale(s => s * 1.1)} disabled={isSaving} aria-label={t('zoomInAriaLabel')}><ZoomIn className="h-5 w-5" /></Button>
            </div>

            <Button onClick={handleSave} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold" disabled={isSaving} aria-label={t('saveAvatarAriaLabel')}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {isSaving ? t('saving') : t('saveAvatarButton')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CropModal;
