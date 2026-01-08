import { Camera, Sparkles, Sun, Home, Palette, Eye } from "lucide-react";

interface StrategyLayer {
  title: string;
  subtitle: string;
  points: string[];
  icon: any;
  color: string;
}

interface VisualStrategySlideProps {
  title?: string;
  subtitle?: string;
  layers?: StrategyLayer[];
}

const VisualStrategySlide = ({
  title = "אסטרטגיה ויזואלית",
  subtitle = "כיצד נציג את הנכס",
  layers = [
    {
      title: "שכבה 1",
      subtitle: "הדירה כפי שהיא",
      points: [
        "צילום אותנטי ושקוף",
        "אור טבעי, חלוקה ופרופורציות",
        "מרפסות וחיבור לחוץ",
        "תחושת המרחב האמיתית",
      ],
      icon: Camera,
      color: "teal",
    },
    {
      title: "שכבה 2",
      subtitle: "הדירה כפי שיכולה להיראות",
      points: [
        "ויז'ואלים בהשראת סגנון חיים",
        "עיצוב תל-אביבי חמים ומודרני",
        "העמדת ריהוט חכמה",
        "תפיסת מגורים פנים-חוץ",
      ],
      icon: Sparkles,
      color: "gold",
    },
  ],
}: VisualStrategySlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Eye className="h-4 w-4 text-white/60" />
            <span className="text-sm text-white/60">הצגה ויזואלית</span>
          </div>
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Strategy Layers */}
        <div className="grid md:grid-cols-2 gap-6">
          {layers.map((layer, index) => {
            const IconComponent = layer.icon;
            const isTeal = layer.color === "teal";
            
            return (
              <div
                key={index}
                className={`rounded-2xl border p-6 backdrop-blur-sm ${
                  isTeal 
                    ? "border-[#4a9a9a]/30 bg-gradient-to-br from-[#4a9a9a]/10 to-[#2d3b3a]/10" 
                    : "border-[#f5c242]/30 bg-gradient-to-br from-[#f5c242]/10 to-[#e85c3a]/10"
                }`}
              >
                {/* Layer Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    isTeal ? "bg-[#4a9a9a]/20" : "bg-[#f5c242]/20"
                  }`}>
                    <IconComponent className={`h-6 w-6 ${isTeal ? "text-[#4a9a9a]" : "text-[#f5c242]"}`} />
                  </div>
                  <div>
                    <span className={`text-sm ${isTeal ? "text-[#4a9a9a]" : "text-[#f5c242]"}`}>
                      {layer.title}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{layer.subtitle}</h3>
                  </div>
                </div>

                {/* Points */}
                <div className="space-y-3">
                  {layer.points.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        isTeal ? "bg-[#4a9a9a]" : "bg-[#f5c242]"
                      }`} />
                      <span className="text-sm text-white/80">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-white/60" />
            <span className="text-sm font-medium text-white">הגישה שלנו</span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            שילוב של שתי השכבות יוצר סיפור שלם - הקונה רואה גם את המציאות וגם את הפוטנציאל,
            ומבין את הערך האמיתי של הנכס.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisualStrategySlide;
