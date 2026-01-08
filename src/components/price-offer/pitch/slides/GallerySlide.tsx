import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GallerySlideProps {
  title?: string;
  subtitle?: string;
  images: string[];
}

const GallerySlide = ({
  title = "גלריית תמונות",
  subtitle = "צפו בתמונות הנכס",
  images,
}: GallerySlideProps) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="font-playfair text-3xl md:text-5xl text-white mb-3 md:mb-4">
          {title}
        </h2>
        <p className="text-base md:text-lg text-white/60 font-light">
          {subtitle}
        </p>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 w-full max-w-6xl">
        {images.map((img, index) => (
          <div
            key={index}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={img}
              alt={`תמונה ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {selectedImage + 1} / {images.length}
          </div>

          {/* Previous Button */}
          <button
            className={`absolute left-2 md:left-4 p-2 rounded-full bg-white/10 text-white transition-all ${
              selectedImage === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
            }`}
            onClick={handlePrev}
            disabled={selectedImage === 0}
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Image */}
          <img
            src={images[selectedImage]}
            alt={`תמונה ${selectedImage + 1}`}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          <button
            className={`absolute right-2 md:right-4 p-2 rounded-full bg-white/10 text-white transition-all ${
              selectedImage === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
            }`}
            onClick={handleNext}
            disabled={selectedImage === images.length - 1}
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GallerySlide;
