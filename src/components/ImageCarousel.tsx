
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Expand, Image as ImageIcon } from 'lucide-react';
import { PropertyImage } from '../types/property';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ImageWithPlaceholder: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  sizes?: string;
}> = ({ src, alt, className, loading = "lazy", sizes }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate srcset for responsive images
  const generateSrcSet = (url: string) => {
    if (url.startsWith('http')) {
      return `${url}?w=640 640w, ${url}?w=1024 1024w, ${url}?w=1920 1920w`;
    }
    return url;
  };

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className={`${className} absolute inset-0 bg-muted animate-pulse`} />
      )}
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={loading}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

interface ImageCarouselProps {
  images: PropertyImage[];
  className?: string;
  priceLabel?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = React.memo(({
  images,
  className = "",
  priceLabel
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 bg-muted">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2" />
            <p>אין תמונות זמינות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images[currentIndex];

  return (
    <>
      <Card className={className}>
        <CardContent className="p-0 relative">
          <div className="relative aspect-video bg-muted">
            <ImageWithPlaceholder
              src={currentImage.url}
              alt={currentImage.name}
              className="w-full h-full object-contain rounded-t"
              loading="eager"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
            
            {/* Price label on main image */}
            {priceLabel && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-base shadow-lg">
                {priceLabel}
              </div>
            )}
            
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={nextImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={prevImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Fullscreen button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setIsFullscreen(true)}
            >
              <Expand className="h-4 w-4" />
            </Button>
            
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto" dir="rtl">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                    index === currentIndex ? 'border-primary' : 'border-muted'
                  }`}
                >
                  <ImageWithPlaceholder
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative">
            <ImageWithPlaceholder
              src={currentImage.url}
              alt={currentImage.name}
              className="w-full h-auto max-h-[90vh] object-contain"
              loading="eager"
              sizes="95vw"
            />
            
            {/* Navigation in fullscreen */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={nextImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={prevImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
