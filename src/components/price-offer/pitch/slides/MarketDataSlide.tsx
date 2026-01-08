import { Building2, TrendingUp, Home, Tag } from "lucide-react";

interface PresaleUnit {
  name: string;
  netSize: number;
  balconySize: number;
  price: number;
}

interface ListingProperty {
  price: number;
  location: string;
}

interface MarketDataSlideProps {
  title?: string;
  subtitle?: string;
  presaleUnits?: PresaleUnit[];
  buildingListings?: ListingProperty[];
  neighborhoodListings?: ListingProperty[];
}

const MarketDataSlide = ({
  title = "שוק: שווי והתעניינות",
  subtitle = "נתוני שוק ומחירים באזור",
  presaleUnits = [
    { name: "דירה 3", netSize: 63, balconySize: 13, price: 4880000 },
    { name: "דירה 2", netSize: 50, balconySize: 7, price: 3580000 },
  ],
  buildingListings = [
    { price: 5250000, location: "דירה בבניין" },
    { price: 5990000, location: "דירה בבניין" },
    { price: 5990000, location: "דירה בבניין" },
    { price: 6500000, location: "דירה בבניין" },
  ],
  neighborhoodListings = [
    { price: 4550000, location: "דירה בשכונה" },
    { price: 6000000, location: "דירה בשכונה" },
  ],
}: MarketDataSlideProps) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(2)}M`;
    }
    return `₪${price.toLocaleString()}`;
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Presale Prices */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg md:text-xl font-semibold text-white">מחירי פריסייל מהיזם</h3>
          </div>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {presaleUnits.map((unit, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-white font-medium">{unit.name}</span>
                  <span className="text-lg md:text-xl font-bold text-emerald-400">
                    {formatPrice(unit.price)}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-white/60">
                  <span>{unit.netSize} מ״ר נטו</span>
                  <span>+ {unit.balconySize} מ״ר מרפסת</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Building Listings */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg md:text-xl font-semibold text-white">דירות למכירה בבניין</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {buildingListings.map((listing, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/5 p-3 md:p-4 text-center"
              >
                <span className="text-base md:text-lg font-bold text-white">
                  {formatPrice(listing.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Neighborhood Listings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg md:text-xl font-semibold text-white">דירות למכירה בשכונה</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {neighborhoodListings.map((listing, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/5 p-3 md:p-4 text-center"
              >
                <span className="text-base md:text-lg font-bold text-white">
                  {formatPrice(listing.price)}
                </span>
                <p className="text-xs text-white/50 mt-1">{listing.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Note */}
        <div className="mt-6 md:mt-8 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">סיכום</span>
          </div>
          <p className="text-sm text-white/70">
            המחירים בבניין נעים בין ₪5.25M ל-₪6.5M, כאשר הדירה שלנו ממוצבת בטווח התחתון-אמצעי של השוק.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketDataSlide;
