import { TrendingUp, Home, Scale } from "lucide-react";

interface ComparisonProperty {
  address: string;
  price: number;
  size: number;
  pricePerSqm: number;
}

interface ValuationSlideProps {
  title?: string;
  subtitle?: string;
  propertyAddress?: string;
  propertySize?: number;
  minPrice?: number;
  maxPrice?: number;
  recommendedPrice?: number;
  pricePerSqm?: number;
  reasoning?: string;
  comparisons?: ComparisonProperty[];
}

const ValuationSlide = ({
  title = "הערכת השווי לנכס שלך",
  subtitle = "המחיר המומלץ מבוסס על ניתוח שוק מעמיק",
  propertyAddress = "רחוב הירקון 156, תל אביב",
  propertySize = 145,
  minPrice = 7800000,
  maxPrice = 8500000,
  recommendedPrice = 8200000,
  pricePerSqm = 56552,
  reasoning = "המחיר נקבע על סמך עסקאות דומות שנסגרו בחודשים האחרונים באזור, תוך התחשבות במצב הנכס, הקומה, והנוף.",
  comparisons = [
    { address: "הירקון 142", price: 8200000, size: 145, pricePerSqm: 56552 },
    { address: "בן יהודה 89", price: 6800000, size: 120, pricePerSqm: 56667 },
    { address: "פרישמן 45", price: 7100000, size: 125, pricePerSqm: 56800 },
  ],
}: ValuationSlideProps) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(1)}M`;
    }
    return `₪${price.toLocaleString()}`;
  };

  const recommendedPosition = ((recommendedPrice - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Property Info */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-center gap-2 md:gap-3 rounded-xl bg-white/5 p-3 md:p-4">
          <Home className="h-4 w-4 md:h-5 md:w-5 text-[#4a9a9a]" />
          <span className="text-sm md:text-base text-white">{propertyAddress}</span>
          <span className="text-white/50 hidden md:inline">|</span>
          <span className="text-sm md:text-base text-white/70">{propertySize} מ״ר</span>
        </div>

        {/* Price Range Visualization */}
        <div className="mb-6 md:mb-10 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-8 backdrop-blur-sm">
          {/* Recommended Price */}
          <div className="mb-6 md:mb-8 text-center">
            <p className="mb-1 md:mb-2 text-xs md:text-sm uppercase tracking-wider text-[#4a9a9a]">המחיר המומלץ</p>
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">{formatPrice(recommendedPrice)}</p>
            <p className="mt-1 md:mt-2 text-base md:text-lg text-white/50">₪{pricePerSqm.toLocaleString()} למ״ר</p>
          </div>

          {/* Price Range Bar */}
          <div className="relative mb-4 md:mb-6">
            <div className="h-3 rounded-full bg-gradient-to-r from-[#f5c242]/30 via-[#4a9a9a]/50 to-[#f5c242]/30" />
            
            {/* Recommended marker */}
            <div 
              className="absolute top-1/2 -translate-y-1/2"
              style={{ right: `${recommendedPosition}%`, transform: `translateY(-50%) translateX(50%)` }}
            >
              <div className="flex flex-col items-center">
                <div className="h-6 md:h-8 w-0.5 bg-[#4a9a9a]" />
                <div className="h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-[#4a9a9a] bg-[#0a0a0a]" />
              </div>
            </div>
          </div>

          {/* Min/Max Labels */}
          <div className="flex justify-between text-xs md:text-sm">
            <div className="text-right">
              <p className="text-white/50">מינימום</p>
              <p className="font-semibold text-white">{formatPrice(minPrice)}</p>
            </div>
            <div className="text-left">
              <p className="text-white/50">מקסימום</p>
              <p className="font-semibold text-white">{formatPrice(maxPrice)}</p>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-6 md:mb-8 rounded-xl border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="mb-2 md:mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4 md:h-5 md:w-5 text-[#4a9a9a]" />
            <h3 className="text-sm md:text-base font-semibold text-white">הסבר להערכה</h3>
          </div>
          <p className="text-sm md:text-base leading-relaxed text-white/70">{reasoning}</p>
        </div>

        {/* Comparisons */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="mb-3 md:mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[#4a9a9a]" />
            <h3 className="text-sm md:text-base font-semibold text-white">נכסים להשוואה</h3>
          </div>
          <div className="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-3">
            {comparisons.map((comp, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-3 md:p-4 text-center">
                <p className="mb-1 md:mb-2 text-xs md:text-sm text-white/70">{comp.address}</p>
                <p className="text-base md:text-lg font-bold text-white">{formatPrice(comp.price)}</p>
                <p className="text-[10px] md:text-xs text-white/50">{comp.size} מ״ר | ₪{comp.pricePerSqm.toLocaleString()}/מ״ר</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationSlide;
