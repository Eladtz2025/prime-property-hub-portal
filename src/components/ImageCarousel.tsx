
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Expand, Image as ImageIcon, Play } from 'lucide-react';
import { PropertyImage } from '../types/property';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ImageWithPlaceholder: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  sizes?: string;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}> = ({ src, alt, className, loading = "lazy", sizes, onImageLoad }) => {
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

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onImageLoad?.(e);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
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
        onLoad={handleLoad}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// Video component with controls
const VideoWithPlaceholder: React.FC<{
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
}> = ({ src, className, controls = true, autoPlay = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <Play className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && (
        <div className={`${className} absolute inset-0 bg-muted animate-pulse flex items-center justify-center`}>
          <Play className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <video
        src={src}
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        controls={controls}
        autoPlay={autoPlay}
        playsInline
        onLoadedData={() => setIsLoaded(true)}
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
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');

  // Reset orientation when changing images
  useEffect(() => {
    setImageOrientation('unknown');
  }, [currentIndex]);

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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const isLandscape = img.naturalWidth > img.naturalHeight;
    setImageOrientation(isLandscape ? 'landscape' : 'portrait');
  };

  const currentImage = images[currentIndex];
  const isVideo = currentImage.mediaType === 'video';

  // Controls overlay component - shared between both layouts
  const ControlsOverlay = () => (
    <>
      {/* Price label */}
      {priceLabel && !isVideo && (
        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-base shadow-lg z-20">
          {priceLabel}
        </div>
      )}
      
      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 shadow-lg z-20"
            onClick={nextImage}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 shadow-lg z-20"
            onClick={prevImage}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
      
      {/* Fullscreen button */}
      {!isVideo && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 h-9 w-9 shadow-lg z-20"
          onClick={() => setIsFullscreen(true)}
        >
          <Expand className="h-4 w-4" />
        </Button>
      )}
      
      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-20">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </>
  );

  return (
    <>
      <Card className={className}>
        <CardContent className="p-0 relative">
          {/* Video or loading state - fixed height with blur */}
          {(isVideo || imageOrientation === 'unknown') && (
            <div className="relative h-[60vh] max-h-[600px] min-h-[300px] overflow-hidden rounded-t-lg bg-black/5">
              {/* Blurred background layer */}
              {!isVideo && (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={currentImage.url}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
                  />
                </div>
              )}
              
              {/* Main content layer */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative inline-block max-w-full max-h-full">
                  {isVideo ? (
                    <VideoWithPlaceholder
                      src={currentImage.url}
                      className="max-w-full max-h-[60vh] object-contain"
                      controls={true}
                    />
                  ) : (
                    <ImageWithPlaceholder
                      src={currentImage.url}
                      alt={currentImage.name}
                      className="max-w-full max-h-[60vh] object-contain drop-shadow-lg"
                      loading="eager"
                      sizes="(max-width: 768px) 100vw, 60vw"
                      onImageLoad={handleImageLoad}
                    />
                  )}
                  <ControlsOverlay />
                </div>
              </div>
            </div>
          )}

          {/* Landscape image - full width, dynamic height, no blur */}
          {!isVideo && imageOrientation === 'landscape' && (
            <div className="relative w-full overflow-hidden rounded-t-lg bg-black/5">
              <img
                src={currentImage.url}
                alt={currentImage.name}
                className="w-full h-auto object-cover"
              />
              <ControlsOverlay />
            </div>
          )}

          {/* Portrait image - fixed height with blur background */}
          {!isVideo && imageOrientation === 'portrait' && (
            <div className="relative h-[60vh] max-h-[600px] min-h-[300px] overflow-hidden rounded-t-lg bg-black/5">
              {/* Blurred background */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={currentImage.url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
                />
              </div>
              
              {/* Centered image */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative inline-block max-w-full max-h-full">
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="max-w-full max-h-[60vh] object-contain drop-shadow-lg"
                  />
                  <ControlsOverlay />
                </div>
              </div>
            </div>
          )}
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto" dir="rtl">
              {images.map((image, index) => {
                const isThumbVideo = image.mediaType === 'video';
                return (
                  <button
                    key={image.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors relative ${
                      index === currentIndex ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    {isThumbVideo ? (
                      <>
                        <video
                          src={image.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImageWithPlaceholder
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        sizes="80px"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen modal - only for images */}
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
