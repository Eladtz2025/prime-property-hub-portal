import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LuxuryGalleryProps {
  images: string[];
  title?: string;
  propertyAddress?: string;
}

const LuxuryGallery = ({ images, title, propertyAddress }: LuxuryGalleryProps) => {
  const getAltText = (index: number) => {
    const location = propertyAddress || title || 'Property';
    return `${location} - Image ${index + 1} of ${images.length}`;
  };
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  const goToPrevious = () => setSelectedIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : null);
  const goToNext = () => setSelectedIndex(prev => prev !== null ? (prev + 1) % images.length : null);

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-12 text-center font-serif text-3xl font-light text-gray-900 md:text-4xl">
          {title}
        </h2>
      )}

      {/* Gallery Grid */}
      <div className="grid gap-4 md:gap-6">
        {images.length === 1 ? (
          <div 
            className="aspect-[16/9] cursor-pointer overflow-hidden rounded-lg"
            onClick={() => openLightbox(0)}
          >
            <img 
              src={images[0]} 
              alt={getAltText(0)} 
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {images.map((img, idx) => (
              <div 
                key={idx}
                className="aspect-[4/3] cursor-pointer overflow-hidden rounded-lg"
                onClick={() => openLightbox(idx)}
              >
              <img 
                  src={img} 
                  alt={getAltText(idx)} 
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {images.slice(0, 6).map((img, idx) => (
              <div 
                key={idx}
                className={`cursor-pointer overflow-hidden rounded-lg ${
                  idx === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-[4/3]" : "aspect-square"
                }`}
                onClick={() => openLightbox(idx)}
              >
              <img 
                  src={img} 
                  alt={getAltText(idx)} 
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                {idx === 5 && images.length > 6 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-2xl font-light text-white">+{images.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 text-white/80 transition-colors hover:text-white"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 transition-colors hover:text-white"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition-colors hover:text-white"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <img
            src={images[selectedIndex]}
            alt={getAltText(selectedIndex)}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default LuxuryGallery;
