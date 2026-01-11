import { Sparkles, Check, Building2, Home, User, Palette } from "lucide-react";

interface HighlightsSlideProps {
  title?: string;
  subtitle?: string;
  highlights?: string[];
  floors?: number;
  units?: number;
  developer?: string;
  architect?: string;
}

const HighlightsSlide = ({
  title = "הנכס",
  subtitle = "יצחק אלחנן 14, נווה צדק",
  highlights = [
    "מערכת Smart Home מתקדמת",
    "מטבח Bulthaup יוקרתי",
    "שתי מרפסות מרווחות",
    "חניון רובוטי",
  ],
  floors,
  units,
  developer,
  architect,
}: HighlightsSlideProps) => {
  const buildingDetails = [
    { icon: Building2, label: "קומות", value: floors },
    { icon: Home, label: "דירות", value: units },
    { icon: User, label: "יזם", value: developer },
    { icon: Palette, label: "אדריכל", value: architect },
  ].filter(item => item.value);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl text-center">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-[#f5c242]" />
          </div>
          <h2 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Building Details Grid */}
        {buildingDetails.length > 0 && (
          <div className="mb-6 md:mb-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {buildingDetails.map((detail, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 rounded-xl border border-[#4a9a9a]/30 bg-[#4a9a9a]/10 p-4 md:p-5"
              >
                <detail.icon className="h-6 w-6 text-[#4a9a9a]" />
                <span className="text-xs md:text-sm text-white/60">{detail.label}</span>
                <span className="text-lg md:text-xl font-bold text-white">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 text-right"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4a9a9a]/20">
                <Check className="h-4 w-4 text-[#4a9a9a]" />
              </div>
              <span className="text-base md:text-lg text-white font-medium">{highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HighlightsSlide;
