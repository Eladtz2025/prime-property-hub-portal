import { Square, Sun } from "lucide-react";

interface AreaItem {
  name: string;
  size: number;
  isBalcony?: boolean;
}

interface AreaBreakdownSlideProps {
  title?: string;
  subtitle?: string;
  areas?: AreaItem[];
  netTotal?: number;
  balconies?: AreaItem[];
  weightedTotal?: number;
}

const AreaBreakdownSlide = ({
  title = "פירוט שטחים",
  subtitle = "חלוקת השטחים בדירה",
  areas = [
    { name: "חלל מגורים + מטבח פתוח", size: 32.4 },
    { name: "חדר שינה הורים", size: 12.0 },
    { name: "חדר שינה נוסף", size: 8.7 },
    { name: "חדר רחצה", size: 4.0 },
    { name: "שירותי אורחים", size: 2.0 },
    { name: "מסדרון / שטחי מעבר", size: 3.8 },
  ],
  netTotal = 62.9,
  balconies = [
    { name: "מרפסת סלון", size: 7.77, isBalcony: true },
    { name: "מרפסת חדר שינה", size: 6.19, isBalcony: true },
  ],
  weightedTotal = 69.9,
}: AreaBreakdownSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6 md:mb-10">
        <h2 className="font-playfair text-3xl md:text-5xl text-white mb-3 md:mb-4">
          {title}
        </h2>
        <p className="text-base md:text-lg text-white/60 font-light">
          {subtitle}
        </p>
      </div>

      {/* Areas Table */}
      <div className="w-full max-w-2xl">
        {/* Interior Areas */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Square className="h-4 w-4 md:h-5 md:w-5 text-[#4a9a9a]" />
            <span className="text-sm md:text-base text-white/70">שטחים פנימיים</span>
          </div>
          <div className="space-y-2">
            {areas.map((area, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <span className="text-sm md:text-base text-white/80">{area.name}</span>
                <span className="text-sm md:text-base font-medium text-white">
                  {area.size.toFixed(1)} מ״ר
                </span>
              </div>
            ))}
          </div>
          {/* Net Total */}
          <div className="flex items-center justify-between p-3 md:p-4 mt-2 rounded-lg bg-[#4a9a9a]/10 border border-[#4a9a9a]/30">
            <span className="text-sm md:text-base font-medium text-[#4a9a9a]">סה״כ נטו</span>
            <span className="text-base md:text-lg font-bold text-[#4a9a9a]">
              {netTotal.toFixed(1)} מ״ר
            </span>
          </div>
        </div>

        {/* Balconies */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Sun className="h-4 w-4 md:h-5 md:w-5 text-[#f5c242]" />
            <span className="text-sm md:text-base text-white/70">מרפסות</span>
          </div>
          <div className="space-y-2">
            {balconies.map((area, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-[#f5c242]/5 border border-[#f5c242]/20"
              >
                <span className="text-sm md:text-base text-white/80">{area.name}</span>
                <span className="text-sm md:text-base font-medium text-[#f5c242]">
                  {area.size.toFixed(2)} מ״ר
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weighted Total */}
        <div className="flex items-center justify-between p-4 md:p-5 rounded-xl bg-gradient-to-r from-[#4a9a9a]/20 to-[#f5c242]/20 border border-white/20">
          <span className="text-base md:text-lg font-medium text-white">שטח משוקלל כולל</span>
          <span className="text-xl md:text-2xl font-bold text-white">
            {weightedTotal.toFixed(1)} מ״ר
          </span>
        </div>
      </div>
    </div>
  );
};

export default AreaBreakdownSlide;
