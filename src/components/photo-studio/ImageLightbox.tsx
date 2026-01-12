import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDownload?: (imageUrl: string) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDownload
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setZoom(1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
      setZoom(1);
    }
  }, [currentIndex, images.length, onNavigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        handleNext(); // RTL - left goes to next
        break;
      case 'ArrowRight':
        handlePrevious(); // RTL - right goes to previous
        break;
    }
  }, [isOpen, onClose, handlePrevious, handleNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  const handleDownload = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;
    
    setIsDownloading(true);
    
    if (onDownload) {
      onDownload(currentImage);
    } else {
      try {
        const response = await fetch(currentImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image-${currentIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
    
    setIsDownloading(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  // Don't render if not open or no valid image
  if (!isOpen) return null;
  
  const currentImage = images[currentIndex];
  
  // Don't render if no valid image URL or if it's a placeholder
  if (!currentImage || currentImage.includes('placeholder')) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white min-h-[44px] min-w-[44px]"
                onClick={handleZoomOut}
                aria-label="הקטן תמונה"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white min-h-[44px] min-w-[44px]"
                onClick={handleZoomIn}
                aria-label="הגדל תמונה"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white min-h-[44px] min-w-[44px]"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="הורד תמונה"
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white min-h-[44px] min-w-[44px]"
                onClick={onClose}
                aria-label="סגור תצוגה מלאה"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div 
            className="overflow-auto max-w-full max-h-full p-4"
            style={{ touchAction: 'pinch-zoom' }}
          >
            <img
              src={currentImage}
              alt={`תמונה ${currentIndex + 1} מתוך ${images.length}`}
              className="max-w-full max-h-[80vh] object-contain transition-transform"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>

          {/* Navigation Arrows - RTL friendly */}
          {images.length > 1 && (
            <>
              {currentIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white min-h-[44px] min-w-[44px]"
                  onClick={handleNext}
                  aria-label="תמונה הבאה"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white min-h-[44px] min-w-[44px]"
                  onClick={handlePrevious}
                  aria-label="תמונה קודמת"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
