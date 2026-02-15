
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Expand, Image as ImageIcon, Play, Volume2, VolumeX, Sofa, ArrowLeft, X } from 'lucide-react';
import { PropertyImage } from '../types/property';

// --- Sub-components ---

const ImageWithPlaceholder: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  sizes?: string;
}> = ({ src, alt, className, loading = "lazy", sizes }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && (
        <div className={`${className} absolute inset-0 bg-muted animate-pulse`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={loading}
        decoding="async"
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

const VideoWithPlaceholder: React.FC<{
  src: string;
  className?: string;
}> = ({ src, className }) => {
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
        controls
        playsInline
        muted
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// --- Custom hook for swipe ---
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (deltaX > deltaY && deltaX > 10) {
      isSwiping.current = true;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) onSwipeRight();
      else onSwipeLeft();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// --- Main Component ---

interface ImageCarouselProps {
  images: PropertyImage[];
  furnishedImages?: PropertyImage[];
  className?: string;
  priceLabel?: string;
  furnishedButtonLabel?: string;
  backButtonLabel?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = React.memo(({
  images,
  furnishedImages = [],
  className = "",
  priceLabel,
  furnishedButtonLabel = "תראה לי איך הדירה תהיה מרוהטת",
  backButtonLabel = "חזרה לתמונות המקוריות"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFurnished, setShowFurnished] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeImages = showFurnished && furnishedImages.length > 0 ? furnishedImages : images;
  const hasFurnished = furnishedImages.length > 0;
  const currentImage = activeImages[currentIndex] || images[0];
  const isVideo = currentImage?.mediaType === 'video';
  const hasVideo = activeImages.some(img => img.mediaType === 'video');

  // Preload adjacent images
  useEffect(() => {
    if (!activeImages.length) return;
    const toPreload = [
      activeImages[(currentIndex + 1) % activeImages.length],
      activeImages[(currentIndex - 1 + activeImages.length) % activeImages.length],
    ];
    toPreload.forEach(img => {
      if (img && img.mediaType !== 'video') {
        const preloadImg = new Image();
        preloadImg.src = img.url;
      }
    });
  }, [currentIndex, activeImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goNext();
      else if (e.key === 'ArrowRight') goPrev();
      else if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, activeImages.length, currentIndex]);

  const animateTransition = useCallback((direction: 'left' | 'right', newIndex: number) => {
    if (isAnimating) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setSlideDirection(null);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    if (activeImages.length <= 1) return;
    const next = (currentIndex + 1) % activeImages.length;
    animateTransition('left', next);
  }, [currentIndex, activeImages.length, animateTransition]);

  const goPrev = useCallback(() => {
    if (activeImages.length <= 1) return;
    const prev = (currentIndex - 1 + activeImages.length) % activeImages.length;
    animateTransition('right', prev);
  }, [currentIndex, activeImages.length, animateTransition]);

  const swipeHandlers = useSwipe(goNext, goPrev);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleToggleFurnished = () => {
    setShowFurnished(!showFurnished);
    setCurrentIndex(0);
    setSlideDirection(null);
    setIsAnimating(false);
  };

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

  // Slide animation class
  const getSlideClass = () => {
    if (!slideDirection) return 'animate-fade-in';
    if (slideDirection === 'left') return 'animate-[slideOutLeft_0.25s_ease-in-out_forwards]';
    return 'animate-[slideOutRight_0.25s_ease-in-out_forwards]';
  };

  // Thumbnail strip component (shared between normal and fullscreen)
  const ThumbnailStrip = ({ dark = false }: { dark?: boolean }) => (
    <div className={`flex gap-2 p-3 overflow-x-auto ${dark ? 'bg-black/80' : ''}`} dir="rtl">
      {activeImages.map((image, index) => {
        const isThumbVideo = image.mediaType === 'video';
        const isActive = index === currentIndex;
        return (
          <button
            key={image.id}
            onClick={() => {
              if (index !== currentIndex) {
                const dir = index > currentIndex ? 'left' : 'right';
                animateTransition(dir, index);
              }
            }}
            className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 relative
              w-[72px] h-[72px] md:w-20 md:h-20 lg:w-24 lg:h-24
              hover:scale-105 hover:brightness-110
              ${isActive
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 brightness-100'
                : 'opacity-60 hover:opacity-100 border border-muted'
              }
              ${dark && isActive ? 'ring-offset-black' : ''}
            `}
          >
            {isThumbVideo ? (
              <>
                <video src={image.url} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-4 w-4 text-white" />
                </div>
              </>
            ) : (
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Background music */}
      <audio ref={audioRef} src="/audio/background-music.mp3" loop preload="auto" />

      {/* Slide animation keyframes */}
      <style>{`
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }
      `}</style>

      <Card className={className}>
        <CardContent className="p-0 relative">
          {/* Main image container - stable aspect ratio */}
          <div
            className="relative overflow-hidden rounded-t-lg lg:rounded-xl bg-black/5 aspect-[4/3] lg:aspect-[16/10]"
            {...swipeHandlers}
          >
            {/* Blurred background for non-covering images */}
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

            {/* Main content with slide animation */}
            <div className={`absolute inset-0 flex items-center justify-center z-10 ${getSlideClass()}`}>
              {isVideo ? (
                <VideoWithPlaceholder
                  src={currentImage.url}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={currentImage.url}
                  alt={currentImage.name}
                  className="max-w-full max-h-full object-contain drop-shadow-lg"
                />
              )}
            </div>

            {/* Controls overlay */}
            {priceLabel && !isVideo && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-base shadow-lg z-20">
                {priceLabel}
              </div>
            )}

            {activeImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 shadow-lg z-20 opacity-80 hover:opacity-100"
                  onClick={goNext}
                >
                  <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 shadow-lg z-20 opacity-80 hover:opacity-100"
                  onClick={goPrev}
                >
                  <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                </Button>
              </>
            )}

            {hasVideo && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 left-3 h-9 w-9 shadow-lg z-20"
                onClick={toggleMusic}
              >
                {isMusicPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            )}

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

            {activeImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-20">
                {currentIndex + 1} / {activeImages.length}
              </div>
            )}
          </div>

          {/* Furnished toggle */}
          {hasFurnished && (
            <div className="px-3 pt-3">
              <Button
                variant={showFurnished ? "default" : "outline"}
                className={`w-full gap-2 ${!showFurnished ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' : ''}`}
                onClick={handleToggleFurnished}
              >
                {showFurnished ? (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    {backButtonLabel}
                  </>
                ) : (
                  <>
                    <Sofa className="h-4 w-4" />
                    {furnishedButtonLabel}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Thumbnails */}
          {activeImages.length > 1 && <ThumbnailStrip />}
        </CardContent>
      </Card>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in"
          {...swipeHandlers}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 h-10 w-10"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-50 text-white/80 text-sm font-medium">
            {currentIndex + 1} / {activeImages.length}
          </div>

          {/* Main image area */}
          <div className="flex-1 flex items-center justify-center px-16 py-4 relative">
            <div className={`w-full h-full flex items-center justify-center ${getSlideClass()}`}>
              <img
                src={currentImage.url}
                alt={currentImage.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {activeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
                  onClick={goNext}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
                  onClick={goPrev}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Fullscreen thumbnails */}
          {activeImages.length > 1 && <ThumbnailStrip dark />}
        </div>
      )}
    </>
  );
});
