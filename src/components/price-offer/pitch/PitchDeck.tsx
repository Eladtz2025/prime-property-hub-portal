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
import YourPropertySlide from "./slides/YourPropertySlide";
import MarketAnalysisSlide from "./slides/MarketAnalysisSlide";
import MarketingPlanSlide from "./slides/MarketingPlanSlide";
import WhyExclusiveSlide from "./slides/WhyExclusiveSlide";
import SuccessStoriesSlide from "./slides/SuccessStoriesSlide";
import MyPromiseSlide from "./slides/MyPromiseSlide";
import TransparencySlide from "./slides/TransparencySlide";
import NextStepsSlide from "./slides/NextStepsSlide";
import ValuationSlide from "./slides/ValuationSlide";
import BuildingSlide from "./slides/BuildingSlide";
import AreaBreakdownSlide from "./slides/AreaBreakdownSlide";
import TimelineSlide from "./slides/TimelineSlide";
import GallerySlide from "./slides/GallerySlide";

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

  // Build slides array - Yitzhak Elhanan 14 Presentation
  const slides: Slide[] = [];

  // Image paths from new folder
  const basePath = "/images/pitch/yitzhak-elhanan-14/new";
  const heroImage = `${basePath}/living-room-1.jpeg`;
  const floorPlanImage = "/images/pitch/yitzhak-elhanan-14/floor-plan.jpg";

  // Gallery images
  const galleryImages = [
    `${basePath}/living-room-1.jpeg`,
    `${basePath}/bedroom-1.jpeg`,
    `${basePath}/bedroom-2.jpeg`,
    `${basePath}/bathroom-styled.jpeg`,
    `${basePath}/balcony-1.jpeg`,
    `${basePath}/balcony-2.jpeg`,
    `${basePath}/living-kitchen.jpeg`,
    `${basePath}/apartment-kitchen.jpeg`,
    `${basePath}/apartment-room-1.jpeg`,
    `${basePath}/apartment-room-2.jpeg`,
    `${basePath}/apartment-corridor.jpeg`,
    `${basePath}/apartment-room-construction.jpeg`,
    `${basePath}/balcony-view-1.jpeg`,
    `${basePath}/balcony-view-2.jpeg`,
    `${basePath}/bathroom-actual.jpeg`,
    `${basePath}/rooftops-view.jpeg`,
  ];

  // Building images
  const buildingImages = [
    `${basePath}/mailboxes-altnoyland.jpeg`,
    `${basePath}/building-sign.jpeg`,
    `${basePath}/lobby-entrance.jpeg`,
    `${basePath}/mamad.jpeg`,
    `${basePath}/bike-room.jpeg`,
    `${basePath}/building-toilets.jpeg`,
  ];

  // Neighborhood images
  const neighborhoodImages = [
    `${basePath}/street-neve-tzedek-1.jpeg`,
    `${basePath}/street-neve-tzedek-2.jpeg`,
    `${basePath}/street-neve-tzedek-3.jpeg`,
    `${basePath}/street-bicycle.jpeg`,
    `${basePath}/balcony-plants.jpeg`,
    `${basePath}/neighborhood-film.jpeg`,
    `${basePath}/succulents.jpeg`,
    `${basePath}/flowers.jpeg`,
  ];

  // Features images
  const featuresImages = [
    `${basePath}/smart-home-1.jpeg`,
    `${basePath}/smart-home-2.jpeg`,
    `${basePath}/bulthaup.jpeg`,
    `${basePath}/materials-collage.jpeg`,
    `${basePath}/wood-panels.jpeg`,
    `${basePath}/corten-steel.jpeg`,
    `${basePath}/floor-tiles.jpeg`,
    `${basePath}/tiles-gray.jpeg`,
  ];

  // Slide 1: Title - יצחק אלחנן 14
  slides.push({
    type: "title",
    data: {
      title: "יצחק אלחנן 14",
      subtitle: "דירת 3 חדרים בבניין חדש בנווה צדק",
      backgroundImage: heroImage,
      stats: [
        { label: "מחיר", value: "₪5.25M" },
        { label: "שטח", value: "69.9 מ״ר" },
        { label: "חדרים", value: "3" },
      ],
    },
  });

  // Slide 2: About Me
  slides.push({ type: "about_me", data: {} });

  // Slide 3: Building Details
  slides.push({
    type: "building",
    data: {
      title: "הבניין",
      subtitle: "פרויקט יוקרה בנווה צדק",
      gushHelka: "6922/1",
      floors: 4,
      units: 17,
      developer: "חברת אלטנוילנד",
      architect: "יניב פרדו",
      features: [
        "מערכת Smart Home מתקדמת",
        "מטבח Bulthaup יוקרתי",
        "חניון רובוטי",
        "לובי מעוצב",
      ],
    },
  });

  // Slide 4: Your Property
  slides.push({
    type: "your_property",
    data: {
      title: "דירת 3 חדרים בנווה צדק",
      address: "יצחק אלחנן 14, נווה צדק",
      propertyImage: floorPlanImage,
      highlights: [
        { icon: "size", title: "שטח נטו", value: "62.9 מ״ר" },
        { icon: "balcony", title: "מרפסות", value: "13.96 מ״ר" },
        { icon: "rooms", title: "חדרים", value: "3" },
        { icon: "price", title: "מחיר למ״ר", value: "₪75,129" },
      ],
      uniquePoints: [
        "מערכת Smart Home מתקדמת",
        "מטבח Bulthaup יוקרתי",
        "שתי מרפסות (סלון וחדר שינה)",
        "בניין חדש עם חניון רובוטי",
      ],
      agentNote: "הדירה ממוקמת בקומה אטרקטיבית עם נוף פתוח ואור טבעי לאורך כל היום.",
    },
  });

  // Slide 5: Area Breakdown
  slides.push({
    type: "area_breakdown",
    data: {
      title: "פירוט שטחים",
      subtitle: "חלוקת השטחים בדירה",
      areas: [
        { name: "חלל מגורים + מטבח פתוח", size: 32.4 },
        { name: "חדר שינה הורים", size: 12.0 },
        { name: "חדר שינה נוסף", size: 8.7 },
        { name: "חדר רחצה", size: 4.0 },
        { name: "שירותי אורחים", size: 2.0 },
        { name: "מסדרון / שטחי מעבר", size: 3.8 },
      ],
      netTotal: 62.9,
      balconies: [
        { name: "מרפסת סלון", size: 7.77 },
        { name: "מרפסת חדר שינה", size: 6.19 },
      ],
      weightedTotal: 69.9,
    },
  });

  // Slide 6: Area - Why the location is desirable
  slides.push({
    type: "area",
    data: {
      title: "למה המיקום כל כך מבוקש?",
      location: "נווה צדק, תל אביב",
      content: `הדירה ממוקמת ברחוב שקט באחד האזורים המבוקשים ביותר בתל-אביב.

נווה צדק, השכונה הראשונה של תל-אביב, נחשבת לאחת השכונות היוקרתיות והמבוקשות בעיר.

במרחק צעדים נמצאים שוק הכרמל וכרם התימנים, בתי קפה מקומיים, והטיילת עם חוף הים.

שדרות רוטשילד נמצאות במרחק דקות ספורות - הלב העסקי, התרבותי והחברתי של תל אביב.`,
    },
  });

  // Slide 7: Valuation
  slides.push({
    type: "valuation",
    data: {
      title: "הערכת שווי",
      propertyAddress: "יצחק אלחנן 14, נווה צדק",
      propertySize: 69.9,
      minPrice: 5000000,
      maxPrice: 5500000,
      recommendedPrice: 5250000,
      pricePerSqm: 75129,
      reasoning: "מחיר משוקלל למ״ר של כ-₪75,129 - בטווח מחירי דירות דומות בשכונה (₪72,000-₪78,000 למ״ר)",
      comparisons: [
        { address: "דירה בבניין", price: 6500000, size: 85, pricePerSqm: 76471 },
        { address: "דירה בבניין", price: 5990000, size: 78, pricePerSqm: 76795 },
        { address: "דירה בשכונה", price: 4550000, size: 62, pricePerSqm: 73387 },
        { address: "דירה בשכונה", price: 6000000, size: 82, pricePerSqm: 73171 },
      ],
    },
  });

  // Slide 8: Marketing Plan
  slides.push({
    type: "marketing_plan",
    data: {
      title: "אסטרטגיית שיווק",
      subtitle: "חשיפה ממוקדת וחכמה",
      items: [
        { icon: "camera", title: "צילום מקצועי", description: "הדירה כפי שהיא + ויז׳ואלים בהשראת סגנון חיים", stats: "צילום 360°" },
        { icon: "video", title: "סרטון וידאו", description: "סיור בדירה המדגיש זרימה, אור וחיבור פנים-חוץ", stats: "עד 2 דקות" },
        { icon: "share", title: "רשתות חברתיות", description: "תוכן ויזואלי מוקפד המדגיש סגנון חיים", stats: "אינסטגרם + פייסבוק" },
        { icon: "target", title: "פנייה ישירה", description: "רוכשי יוקרה, תושבי חוץ ומשקיעי פרימיום", stats: "קהל ממוקד" },
      ],
      platforms: ["יד2", "אינסטגרם", "וואטסאפ שכונתי", "Nefesh B'Nefesh"],
      agentNote: "נשלב בין חשיפה דיגיטלית לפנייה אישית לרשת הקשרים שלי בתחום הנדל״ן היוקרתי.",
    },
  });

  // Slide 9: Timeline
  slides.push({
    type: "timeline",
    data: {
      title: "לוח זמנים",
      subtitle: "תהליך השיווק שלב אחר שלב",
      steps: [
        { week: "שבוע 1", title: "הכנה ומיצוב", description: "ניתוח שוק, בניית סיפור שיווקי", icon: "calendar" },
        { week: "שבוע 1-2", title: "יצירת תוכן", description: "צילום, וידאו, חומרי שיווק", icon: "camera" },
        { week: "שבוע 2-3", title: "השקה רכה", description: "חשיפה מבוקרת לקהל איכותי", icon: "rocket" },
        { week: "שבוע 3-6", title: "השקה מלאה", description: "פרסום בפלטפורמות, שילוט מקומי", icon: "target" },
        { week: "שבוע 4-8", title: "מעורבות רוכשים", description: "סיורים פרטיים, משא ומתן", icon: "users" },
        { week: "בהתאם לרוכש", title: "סגירה והשלמה", description: "חתימה, העברת בעלות", icon: "check" },
      ],
    },
  });

  // Slide 10: My Promise
  slides.push({
    type: "my_promise",
    data: {
      title: "המחויבות שלנו",
      subtitle: "מה תקבלו בעבודה איתנו",
      promises: [
        { icon: "report", title: "שקיפות מלאה", description: "עדכונים שוטפים על כל פנייה והתקדמות" },
        { icon: "response", title: "זמינות מלאה", description: "מענה מהיר בכל שאלה או בקשה" },
        { icon: "target", title: "חשיפה אסטרטגית", description: "ללא שחיקה שיווקית - דגש על איכות" },
        { icon: "shield", title: "שמירה על ערך", description: "הגנה על ערך הנכס לאורך התהליך" },
      ],
      guaranteeText: "אנחנו מתחייבים ללוות אתכם בכל שלב עד למכירה מוצלחת",
    },
  });

  // Slide 11: Gallery
  slides.push({
    type: "gallery",
    data: {
      title: "גלריית הדירה",
      subtitle: "צפו בתמונות הנכס והבניין",
      images: [...galleryImages, ...buildingImages.slice(0, 4)],
    },
  });

  // Slide 12: Next Steps
  slides.push({ type: "next_steps", data: { propertyTitle: "יצחק אלחנן 14" } });

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
      case "your_property":
        return <YourPropertySlide {...slide.data} />;
      case "market_analysis":
        return <MarketAnalysisSlide {...slide.data} />;
      case "marketing_plan":
        return <MarketingPlanSlide {...slide.data} />;
      case "why_exclusive":
        return <WhyExclusiveSlide {...slide.data} />;
      case "success_stories":
        return <SuccessStoriesSlide {...slide.data} />;
      case "my_promise":
        return <MyPromiseSlide {...slide.data} />;
      case "transparency":
        return <TransparencySlide {...slide.data} />;
      case "next_steps":
        return <NextStepsSlide {...slide.data} />;
      case "valuation":
        return <ValuationSlide {...slide.data} />;
      case "building":
        return <BuildingSlide {...slide.data} />;
      case "area_breakdown":
        return <AreaBreakdownSlide {...slide.data} />;
      case "timeline":
        return <TimelineSlide {...slide.data} />;
      case "gallery":
        return <GallerySlide {...slide.data} />;
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
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        {/* Previous Button */}
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`flex items-center gap-1 md:gap-2 rounded-full px-3 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-all duration-300 ${
            currentSlide === 0
              ? "cursor-not-allowed opacity-30"
              : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          }`}
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">הקודם</span>
        </button>

        {/* Slide Indicators - hidden on mobile, show counter instead */}
        <div className="hidden md:flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-6 bg-white"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Mobile Counter */}
        <div className="md:hidden text-sm text-white/70 font-medium">
          {currentSlide + 1} / {totalSlides}
        </div>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className={`flex items-center gap-1 md:gap-2 rounded-full px-3 py-2 md:px-6 md:py-3 text-xs md:text-sm font-medium transition-all duration-300 ${
            currentSlide === totalSlides - 1
              ? "cursor-not-allowed opacity-30"
              : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          }`}
        >
          <span className="hidden sm:inline">הבא</span>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>

      {/* Slide Counter - desktop only */}
      <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/50">
        {currentSlide + 1} / {totalSlides}
      </div>
    </div>
  );
};

export default PitchDeck;
