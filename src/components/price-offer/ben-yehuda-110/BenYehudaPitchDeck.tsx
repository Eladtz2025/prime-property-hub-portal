import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cityMarketLogo from "@/assets/city-market-icon.png";
import BYTitleSlide from "./slides/BYTitleSlide";
import BYPropertySlide from "./slides/BYPropertySlide";
import BYFeaturesSlide from "./slides/BYFeaturesSlide";
import BYNeighborhoodSlide from "./slides/BYNeighborhoodSlide";
import BYPricingSlide from "./slides/BYPricingSlide";
import BYMarketingSlide from "./slides/BYMarketingSlide";
import BYTimelineSlide from "./slides/BYTimelineSlide";
import BYMarketingIISlide from "./slides/BYMarketingIISlide";
import BYAboutUsSlide from "./slides/BYAboutUsSlide";
import BYContactSlide from "./slides/BYContactSlide";

const BenYehudaPitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    { component: <BYTitleSlide /> },
    { component: <BYPropertySlide /> },
    { component: <BYFeaturesSlide /> },
    { component: <BYNeighborhoodSlide /> },
    { component: <BYPricingSlide /> },
    { component: <BYMarketingSlide /> },
    { component: <BYTimelineSlide /> },
    { component: <BYMarketingIISlide /> },
    { component: <BYAboutUsSlide /> },
    { component: <BYContactSlide /> },
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

      {/* Navigation Buttons with Page Counter */}
      <div dir="ltr" className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-between px-4">
        {/* Page Counter - Left side */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span 
            dir="ltr"
            className="text-white text-xs md:text-sm font-light tracking-wide"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {currentSlide + 1} of {slides.length}
          </span>
        </div>

        {/* Center Navigation: Arrows + Dots */}
        <div className="flex items-center gap-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm text-white transition-all hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          {/* Slide Indicators */}
          <div className="flex flex-row-reverse items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm text-white transition-all hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Logo - Right side */}
        <img src={cityMarketLogo} alt="City Market Properties" className="h-10 md:h-14 w-auto" />
      </div>
    </div>
  );
};

export default BenYehudaPitchDeck;
