import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PitchNavigation from "./PitchNavigation";
import TitleSlide from "./slides/TitleSlide";
import ImageSlide from "./slides/ImageSlide";
import DetailsSlide from "./slides/DetailsSlide";
import AreaSlide from "./slides/AreaSlide";
import FeaturesSlide from "./slides/FeaturesSlide";
import StatsSlide from "./slides/StatsSlide";
import ContactSlide from "./slides/ContactSlide";
import AboutMeSlide from "./slides/AboutMeSlide";
import MarketAnalysisSlide from "./slides/MarketAnalysisSlide";
import MarketingPlanSlide from "./slides/MarketingPlanSlide";
import WhyExclusiveSlide from "./slides/WhyExclusiveSlide";
import SuccessStoriesSlide from "./slides/SuccessStoriesSlide";
import NextStepsSlide from "./slides/NextStepsSlide";
import ValuationSlide from "./slides/ValuationSlide";

interface PriceOffer {
  id: string;
  property_title: string;
  property_details: string | null;
  language: string;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  price_per_sqm_min: number | null;
  price_per_sqm_max: number | null;
  expected_income_min: number | null;
  expected_income_max: number | null;
}

interface Block {
  id: string;
  block_type: string;
  block_data: any;
  block_order: number;
}

interface Image {
  id: string;
  image_url: string;
  block_id: string | null;
  image_order: number;
}

interface PitchDeckProps {
  offer: PriceOffer;
  blocks: Block[];
  images: Image[];
}

interface Slide {
  type: string;
  data: any;
}

const PitchDeck = ({ offer, blocks, images }: PitchDeckProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Build slides array - Exclusivity Presentation for Property Owners
  const slides: Slide[] = [];

  // Slide 1: Title
  const heroImage = images.length > 0 ? images[0].image_url : undefined;
  slides.push({
    type: "title",
    data: {
      title: offer.property_title,
      subtitle: offer.property_details || "מצגת בלעדיות מקצועית",
      backgroundImage: heroImage,
      stats: [
        offer.suggested_price_max && { label: "הערכת שווי", value: `₪${(offer.suggested_price_max / 1000000).toFixed(1)}M` },
        { label: "חדרים", value: "4" },
        { label: "שטח", value: "145 מ״ר" },
      ].filter(Boolean),
    },
  });

  // Slide 2: About Me (Agent Introduction)
  slides.push({
    type: "about_me",
    data: {},
  });

  // Slide 3: Market Analysis
  slides.push({
    type: "market_analysis",
    data: {
      neighborhood: "צפון תל אביב",
      avgPricePerSqm: 58000,
      trend: "up",
      trendPercent: 4.5,
      avgDaysOnMarket: 32,
    },
  });

  // Slide 4: Property Valuation
  slides.push({
    type: "valuation",
    data: {
      propertyAddress: offer.property_title,
      propertySize: 145,
      minPrice: offer.suggested_price_min || 7800000,
      maxPrice: offer.suggested_price_max || 8500000,
      recommendedPrice: offer.suggested_price_max || 8200000,
      pricePerSqm: offer.price_per_sqm_max || 56552,
    },
  });

  // Slide 5: Property Images (if available)
  if (images.length > 0) {
    slides.push({
      type: "image",
      data: {
        imageUrl: images[0].image_url,
        caption: "הנכס שלכם",
      },
    });
  }

  // Slide 6: Marketing Plan
  slides.push({
    type: "marketing_plan",
    data: {},
  });

  // Slide 7: Why Exclusive
  slides.push({
    type: "why_exclusive",
    data: {},
  });

  // Slide 8: Success Stories
  slides.push({
    type: "success_stories",
    data: {},
  });

  // Slide 9: Next Steps
  slides.push({
    type: "next_steps",
    data: {
      propertyTitle: offer.property_title,
    },
  });

  const totalSlides = slides.length;

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= totalSlides) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") prevSlide();
      if (e.key === "ArrowLeft") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch/swipe support
  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  const renderSlide = (slide: Slide) => {
    switch (slide.type) {
      case "title":
        return <TitleSlide {...slide.data} />;
      case "image":
        return <ImageSlide {...slide.data} />;
      case "details":
        return <DetailsSlide {...slide.data} />;
      case "area":
        return <AreaSlide {...slide.data} />;
      case "features":
        return <FeaturesSlide {...slide.data} />;
      case "stats":
        return <StatsSlide {...slide.data} />;
      case "contact":
        return <ContactSlide {...slide.data} />;
      case "about_me":
        return <AboutMeSlide {...slide.data} />;
      case "market_analysis":
        return <MarketAnalysisSlide {...slide.data} />;
      case "marketing_plan":
        return <MarketingPlanSlide {...slide.data} />;
      case "why_exclusive":
        return <WhyExclusiveSlide {...slide.data} />;
      case "success_stories":
        return <SuccessStoriesSlide {...slide.data} />;
      case "next_steps":
        return <NextStepsSlide {...slide.data} />;
      case "valuation":
        return <ValuationSlide {...slide.data} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] overflow-hidden"
      dir="rtl"
    >
      {/* Top Navigation */}
      <PitchNavigation
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onClose={() => window.history.back()}
        propertyTitle={offer.property_title}
      />

      {/* Slides Container */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 translate-x-full"
                : "opacity-0 -translate-x-full"
            }`}
            style={{ pointerEvents: index === currentSlide ? "auto" : "none" }}
          >
            {renderSlide(slide)}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
        {/* Previous Button */}
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
            currentSlide === 0
              ? "cursor-not-allowed opacity-30"
              : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          }`}
        >
          <ChevronRight className="h-5 w-5" />
          <span>הקודם</span>
        </button>

        {/* Slide Indicators */}
        <div className="flex items-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-white"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
            currentSlide === totalSlides - 1
              ? "cursor-not-allowed opacity-30"
              : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          }`}
        >
          <span>הבא</span>
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/50">
        {currentSlide + 1} / {totalSlides}
      </div>
    </div>
  );
};

export default PitchDeck;
