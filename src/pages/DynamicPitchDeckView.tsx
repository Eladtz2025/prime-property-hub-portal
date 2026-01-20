import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cityMarketLogo from "@/assets/city-market-icon.png";
import { usePitchDeckBySlug } from "@/hooks/usePitchDecks";
import { PitchDeckSlide, SlideType } from "@/types/pitch-deck";
import {
  DynamicTitleSlide,
  DynamicPropertySlide,
  DynamicFeaturesSlide,
  DynamicNeighborhoodSlide,
  DynamicPricingSlide,
  DynamicMarketingSlide,
  DynamicTimelineSlide,
  DynamicMarketingIISlide,
  DynamicAboutUsSlide,
  DynamicDifferentiatorsSlide,
  DynamicContactSlide,
} from "@/components/pitch-deck/slides";

// Helper to get initial slide from URL hash
const getInitialSlideFromHash = (): number => {
  if (typeof window === 'undefined') return 0;
  const hash = window.location.hash;
  const match = hash.match(/slide=(\d+)/);
  if (match) {
    const slideNum = parseInt(match[1], 10);
    return Math.max(0, slideNum - 1); // Convert from 1-based to 0-based
  }
  return 0;
};

const DynamicPitchDeckView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: deck, isLoading, error } = usePitchDeckBySlug(slug);
  const [currentSlide, setCurrentSlide] = useState(getInitialSlideFromHash);
  const [isAnimating, setIsAnimating] = useState(false);
  const [language, setLanguage] = useState<'en' | 'he'>('en');

  // Get visible slides sorted by order (with validation)
  // Filter out step1_pricing as it's a separate page, not a carousel slide
  const slides = deck?.slides
    ?.filter(s => s && s.is_visible && s.slide_data && s.slide_type !== 'step1_pricing')
    ?.sort((a, b) => a.slide_order - b.slide_order) || [];

  // Validate initial slide index once slides are loaded
  useEffect(() => {
    if (slides.length > 0 && currentSlide >= slides.length) {
      const validIndex = slides.length - 1;
      setCurrentSlide(validIndex);
      window.history.replaceState(null, '', `#slide=${validIndex + 1}`);
    }
  }, [slides.length, currentSlide]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    if (index < 0 || index >= slides.length) return;
    
    setIsAnimating(true);
    setCurrentSlide(index);
    
    // Update URL hash (1-based for users)
    window.history.replaceState(null, '', `#slide=${index + 1}`);
    
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

  // Render slide based on type
  const renderSlide = (slide: PitchDeckSlide) => {
    try {
      const overlayOpacity = deck?.overlay_opacity || 0.85;
      const bgImage = slide.background_image;

      console.log('Rendering slide:', slide.slide_type, slide.id, slide.slide_data);

      switch (slide.slide_type as SlideType) {
        case 'title':
          return <DynamicTitleSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'property':
          return <DynamicPropertySlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'features':
          return <DynamicFeaturesSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'neighborhood':
          return <DynamicNeighborhoodSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'pricing':
          return <DynamicPricingSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'marketing':
          return <DynamicMarketingSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'timeline':
          return <DynamicTimelineSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'marketing2':
        case 'marketing_ii':
          return <DynamicMarketingIISlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'about':
          return <DynamicAboutUsSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'differentiators':
          return <DynamicDifferentiatorsSlide data={slide.slide_data as any} backgroundImage={bgImage} overlayOpacity={overlayOpacity} />;
        case 'contact':
          return (
            <DynamicContactSlide 
              data={slide.slide_data as any} 
              backgroundImage={bgImage} 
              overlayOpacity={overlayOpacity}
              slug={slug}
              contactPhone={deck?.contact_phone}
              contactWhatsapp={deck?.contact_whatsapp}
              agentNames={deck?.agent_names}
            />
          );
        default:
          console.warn('Unknown slide type:', slide.slide_type);
          return <div className="flex items-center justify-center h-full text-white">Unknown slide type: {slide.slide_type}</div>;
      }
    } catch (error) {
      console.error('Error rendering slide:', slide.slide_type, slide.id, error);
      return (
        <div className="flex items-center justify-center h-full text-white bg-red-900/50">
          <p>Error loading slide: {slide.slide_type}</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#d4c5b5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5c242]"></div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#d4c5b5] text-white">
        <h1 className="text-2xl font-serif mb-4">Presentation Not Found</h1>
        <p className="text-white/70">The presentation you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#d4c5b5] text-white">
        <h1 className="text-2xl font-serif mb-4">No Slides</h1>
        <p className="text-white/70">This presentation has no visible slides.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#d4c5b5] flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Language Toggle - Fixed Top Left */}
      <div className="absolute top-4 left-4 z-40 flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            language === 'en' 
              ? 'bg-[#f5c242] text-[#2d3b3a]' 
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('he')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            language === 'he' 
              ? 'bg-[#f5c242] text-[#2d3b3a]' 
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          }`}
        >
          עב
        </button>
      </div>

      {/* Slides Area - Takes remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            }`}
          >
            {renderSlide(slide)}
          </div>
        ))}
      </div>

      {/* Navigation - Fixed height footer */}
      <div dir="ltr" className="h-14 md:h-16 lg:h-14 2xl:h-16 flex-shrink-0 relative z-30 px-3 md:px-6 flex items-center bg-gradient-to-t from-black/30 to-transparent">
        {/* Mobile Layout */}
        <div className="flex md:hidden w-full items-center justify-between">
          {/* Counter */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span 
              dir="ltr"
              className="text-white text-xs font-light"
            >
              {currentSlide + 1}/{slides.length}
            </span>
          </div>
          
          {/* Arrows + Dots */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/40 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex flex-row-reverse items-center gap-1 px-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-3 bg-white"
                      : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/40 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Logo */}
          <img src={cityMarketLogo} alt="City Market" className="h-6 w-auto" />
        </div>
        
        {/* Desktop Layout - Single row */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* Counter */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span 
              dir="ltr"
              className="text-white text-sm font-light"
            >
              {currentSlide + 1} of {slides.length}
            </span>
          </div>

          {/* Arrows + Dots */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/40 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex flex-row-reverse items-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-5 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/40 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Logo */}
          <img src={cityMarketLogo} alt="City Market" className="h-8 w-auto" />
        </div>
      </div>
    </div>
  );
};

export default DynamicPitchDeckView;