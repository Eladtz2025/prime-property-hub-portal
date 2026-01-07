import { TrendingUp, TrendingDown, Minus, Calendar, MapPin } from "lucide-react";

interface Transaction {
  address: string;
  price: number;
  size: number;
  pricePerSqm: number;
  date: string;
}

interface MarketAnalysisSlideProps {
  title?: string;
  neighborhood?: string;
  avgPricePerSqm?: number;
  trend?: "up" | "down" | "stable";
  trendPercent?: number;
  avgDaysOnMarket?: number;
  transactions?: Transaction[];
}

const MarketAnalysisSlide = ({
  title = "מה קורה בשוק?",
  neighborhood = "צפון תל אביב",
  avgPricePerSqm = 58000,
  trend = "up",
  trendPercent = 4.5,
  avgDaysOnMarket = 32,
  transactions = [
    { address: "רחוב הירקון 142", price: 8200000, size: 145, pricePerSqm: 56552, date: "נובמבר 2024" },
    { address: "רחוב בן יהודה 89", price: 6800000, size: 120, pricePerSqm: 56667, date: "אוקטובר 2024" },
    { address: "רחוב דיזנגוף 210", price: 9500000, size: 160, pricePerSqm: 59375, date: "ספטמבר 2024" },
    { address: "רחוב פרישמן 45", price: 7100000, size: 125, pricePerSqm: 56800, date: "אוגוסט 2024" },
  ],
}: MarketAnalysisSlideProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-yellow-400";
  const trendBg = trend === "up" ? "bg-emerald-500/20" : trend === "down" ? "bg-red-500/20" : "bg-yellow-500/20";

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(1)}M`;
    }
    return `₪${price.toLocaleString()}`;
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-start md:justify-center px-4 md:px-8 py-20 md:py-24 overflow-y-auto">
      <div className="w-full max-w-5xl pb-20 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <div className="flex items-center justify-center gap-2 text-base md:text-lg text-white/60">
            <MapPin className="h-4 w-4 md:h-5 md:w-5" />
            <span>{neighborhood}</span>
          </div>
        </div>

        {/* Market Stats */}
        <div className="mb-6 md:mb-10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Avg Price per Sqm */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center backdrop-blur-sm">
            <p className="mb-1 md:mb-2 text-xs md:text-sm text-white/50">מחיר ממוצע למ״ר</p>
            <p className="text-2xl md:text-3xl font-bold text-white">₪{avgPricePerSqm.toLocaleString()}</p>
          </div>

          {/* Trend */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center backdrop-blur-sm">
            <p className="mb-1 md:mb-2 text-xs md:text-sm text-white/50">מגמת מחירים</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`rounded-full p-1.5 md:p-2 ${trendBg}`}>
                <TrendIcon className={`h-4 w-4 md:h-5 md:w-5 ${trendColor}`} />
              </span>
              <span className={`text-2xl md:text-3xl font-bold ${trendColor}`}>
                {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendPercent}%
              </span>
            </div>
          </div>

          {/* Days on Market */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center backdrop-blur-sm">
            <p className="mb-1 md:mb-2 text-xs md:text-sm text-white/50">ימים על השוק</p>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white/50" />
              <span className="text-2xl md:text-3xl font-bold text-white">{avgDaysOnMarket}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur-sm">
          <h3 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white/80">עסקאות אחרונות בסביבה</h3>
          <div className="space-y-2 md:space-y-3">
            {transactions.map((tx, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center justify-between rounded-xl bg-white/5 p-3 md:p-4 transition-colors hover:bg-white/10 gap-2 md:gap-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-white text-sm md:text-base">{tx.address}</p>
                  <p className="text-xs md:text-sm text-white/50">{tx.date} | {tx.size} מ״ר</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-base md:text-lg font-bold text-emerald-400">{formatPrice(tx.price)}</p>
                  <p className="text-xs md:text-sm text-white/50">₪{tx.pricePerSqm.toLocaleString()}/מ״ר</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysisSlide;
