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
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <div className="flex items-center justify-center gap-2 text-lg text-white/60">
            <MapPin className="h-5 w-5" />
            <span>{neighborhood}</span>
          </div>
        </div>

        {/* Market Stats */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {/* Avg Price per Sqm */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="mb-2 text-sm text-white/50">מחיר ממוצע למ״ר</p>
            <p className="text-3xl font-bold text-white">₪{avgPricePerSqm.toLocaleString()}</p>
          </div>

          {/* Trend */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="mb-2 text-sm text-white/50">מגמת מחירים</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`rounded-full p-2 ${trendBg}`}>
                <TrendIcon className={`h-5 w-5 ${trendColor}`} />
              </span>
              <span className={`text-3xl font-bold ${trendColor}`}>
                {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendPercent}%
              </span>
            </div>
          </div>

          {/* Days on Market */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="mb-2 text-sm text-white/50">ימים על השוק</p>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 text-white/50" />
              <span className="text-3xl font-bold text-white">{avgDaysOnMarket}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-white/80">עסקאות אחרונות בסביבה</h3>
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{tx.address}</p>
                  <p className="text-sm text-white/50">{tx.date} | {tx.size} מ״ר</p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-emerald-400">{formatPrice(tx.price)}</p>
                  <p className="text-sm text-white/50">₪{tx.pricePerSqm.toLocaleString()}/מ״ר</p>
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
