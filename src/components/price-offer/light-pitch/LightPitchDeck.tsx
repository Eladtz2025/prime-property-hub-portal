import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LightPitchNavigation from "./LightPitchNavigation";
import LightTitleSlide from "./slides/LightTitleSlide";
import LightTableOfContentsSlide from "./slides/LightTableOfContentsSlide";
import LightAboutUsSlide from "./slides/LightAboutUsSlide";
import LightOurServicesSlide from "./slides/LightOurServicesSlide";
import LightSalesProcessSlide from "./slides/LightSalesProcessSlide";
import LightPropertyListingSlide from "./slides/LightPropertyListingSlide";
import LightPropertyDetailsSlide from "./slides/LightPropertyDetailsSlide";
import LightPropertyFeaturesSlide from "./slides/LightPropertyFeaturesSlide";
import LightLimitingFactorsSlide from "./slides/LightLimitingFactorsSlide";
import LightFeaturesGridSlide from "./slides/LightFeaturesGridSlide";
import LightComparativeAnalysisSlide from "./slides/LightComparativeAnalysisSlide";
import LightNeighborhoodLifestyleSlide from "./slides/LightNeighborhoodLifestyleSlide";
import LightNeighborhoodSlide from "./slides/LightNeighborhoodSlide";
import LightContactSlide from "./slides/LightContactSlide";

interface LightPitchDeckProps {
  propertyAddress?: string;
  propertyCity?: string;
}

const LightPitchDeck = ({
  propertyAddress = "110 BEN YEHUDA STREET",
  propertyCity = "TEL AVIV-YAFO",
}: LightPitchDeckProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    { component: <LightTitleSlide propertyAddress={propertyAddress} propertyCity={propertyCity} /> },
    { component: <LightTableOfContentsSlide /> },
    { component: <LightAboutUsSlide /> },
    { component: <LightOurServicesSlide /> },
    { component: <LightSalesProcessSlide /> },
    { component: <LightPropertyListingSlide propertyAddress={`${propertyAddress}, ${propertyCity}`} /> },
    { component: <LightPropertyDetailsSlide /> },
    { component: <LightPropertyFeaturesSlide /> },
    { component: <LightLimitingFactorsSlide /> },
    { component: <LightFeaturesGridSlide /> },
    { component: <LightComparativeAnalysisSlide /> },
    { component: <LightNeighborhoodLifestyleSlide /> },
    { component: <LightNeighborhoodSlide /> },
    { component: <LightContactSlide /> },
  ];

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    if (index < 0 || index >= slides.length) return;
    
    setIsAnimating(true);
    setCurrentSlide(index);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, currentSlide, slides.length]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#d4c5b5]">
      {/* Navigation Header & Footer */}
      <LightPitchNavigation currentSlide={currentSlide} totalSlides={slides.length} />

      {/* Slides Container */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            }`}
          >
            {slide.component}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-20 left-0 right-0 z-30 flex items-center justify-center gap-4 px-4">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        {/* Slide Indicators */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-6 bg-[#f5c242]"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default LightPitchDeck;
