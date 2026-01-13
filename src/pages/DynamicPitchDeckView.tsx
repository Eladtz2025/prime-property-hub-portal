import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePitchDeckBySlug } from "@/hooks/usePitchDecks";
import cityMarketLogo from "@/assets/city-market-icon.png";

// Dynamic slide components based on slide_type
import DynamicTitleSlide from "@/components/pitch-deck/viewer/DynamicTitleSlide";
import DynamicPropertySlide from "@/components/pitch-deck/viewer/DynamicPropertySlide";
import DynamicFeaturesSlide from "@/components/pitch-deck/viewer/DynamicFeaturesSlide";
import DynamicNeighborhoodSlide from "@/components/pitch-deck/viewer/DynamicNeighborhoodSlide";
import DynamicPricingSlide from "@/components/pitch-deck/viewer/DynamicPricingSlide";
import DynamicMarketingSlide from "@/components/pitch-deck/viewer/DynamicMarketingSlide";
import DynamicTimelineSlide from "@/components/pitch-deck/viewer/DynamicTimelineSlide";
import DynamicAboutSlide from "@/components/pitch-deck/viewer/DynamicAboutSlide";
import DynamicContactSlide from "@/components/pitch-deck/viewer/DynamicContactSlide";
import DynamicGenericSlide from "@/components/pitch-deck/viewer/DynamicGenericSlide";
import { PitchDeckSlide } from "@/types/pitch-deck";

const DynamicPitchDeckView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: deck, isLoading, error } = usePitchDeckBySlug(slug);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const visibleSlides = deck?.slides?.filter(s => s.is_visible) || [];

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    if (index < 0 || index >= visibleSlides.length) return;
    
    setIsAnimating(true);
    setCurrentSlide(index);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [isAnimating, currentSlide, visibleSlides.length]);

  const nextSlide = useCallback(() => {
    if (currentSlide < visibleSlides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, visibleSlides.length, goToSlide]);

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

  const renderSlide = (slide: PitchDeckSlide) => {
    // Cast to unknown first to allow flexible data structure from database
    const slideData = slide.slide_data as unknown as Record<string, unknown>;
    const props = {
      data: slideData,
      backgroundImage: slide.background_image,
      themeColor: deck?.theme_color || '#f5c242',
      overlayOpacity: deck?.overlay_opacity || 0.85,
      language: deck?.language as 'he' | 'en' || 'he',
      contactPhone: deck?.contact_phone,
      contactWhatsapp: deck?.contact_whatsapp,
      agentNames: deck?.agent_names,
    };

    // Use string comparison since slide_type from DB may not match SlideType enum exactly
    const slideType = slide.slide_type as string;

    switch (slideType) {
      case 'title':
        return <DynamicTitleSlide {...props} />;
      case 'property':
        return <DynamicPropertySlide {...props} />;
      case 'features':
        return <DynamicFeaturesSlide {...props} />;
      case 'neighborhood':
        return <DynamicNeighborhoodSlide {...props} />;
      case 'pricing':
        return <DynamicPricingSlide {...props} />;
      case 'marketing':
      case 'marketing_ii':
        return <DynamicMarketingSlide {...props} />;
      case 'timeline':
        return <DynamicTimelineSlide {...props} />;
      case 'about':
        return <DynamicAboutSlide {...props} />;
      case 'contact':
        return <DynamicContactSlide {...props} />;
      default:
        return <DynamicGenericSlide {...props} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#d4c5b5]">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#d4c5b5]">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">מצגת לא נמצאה</h1>
          <p>הלינק שגוי או שהמצגת לא פעילה</p>
        </div>
      </div>
    );
  }

  if (visibleSlides.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#d4c5b5]">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">אין סליידים</h1>
          <p>המצגת ריקה</p>
        </div>
      </div>
    );
  }

  const isRTL = deck.language === 'he';

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#d4c5b5]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Slides Container */}
      <div className="relative h-full w-full">
        {visibleSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? `opacity-0 ${isRTL ? 'translate-x-full' : '-translate-x-full'}`
                : `opacity-0 ${isRTL ? '-translate-x-full' : 'translate-x-full'}`
            }`}
          >
            {renderSlide(slide)}
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
            {currentSlide + 1} of {visibleSlides.length}
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
          <div className="flex items-center gap-2">
            {visibleSlides.map((_, index) => (
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
            disabled={currentSlide === visibleSlides.length - 1}
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

export default DynamicPitchDeckView;
