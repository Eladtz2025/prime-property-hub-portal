import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PriceOfferImageGalleryProps {
  images: string[];
  title?: string;
  imageSize?: 'small' | 'medium' | 'large';
}

const PriceOfferImageGallery = ({ images, title, imageSize = 'medium' }: PriceOfferImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const getGridCols = () => {
    switch (imageSize) {
      case 'small':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2';
      default:
        return 'grid-cols-2 sm:grid-cols-3';
    }
  };

  const getImageHeight = () => {
    switch (imageSize) {
      case 'small':
        return 'h-32 sm:h-40';
      case 'large':
        return 'h-64 sm:h-80';
      default:
        return 'h-48 sm:h-56';
    }
  };

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    setSelectedImage(prev => (prev === null || prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedImage(prev => (prev === null || prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      )}
      
      <div className={`grid ${getGridCols()} gap-4`}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`${getImageHeight()} rounded-lg overflow-hidden cursor-pointer group border-2 border-border/50 hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg`}
            onClick={() => openLightbox(index)}
          >
            <img
              src={image}
              alt={title ? `${title} - תמונה ${index + 1}` : `תמונה ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedImage !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {selectedImage !== null && (
              <>
                <img
                  src={images[selectedImage]}
                  alt={`תמונה ${selectedImage + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />

                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={goToPrevious}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={goToNext}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                      {selectedImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceOfferImageGallery;
