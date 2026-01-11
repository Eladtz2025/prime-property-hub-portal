import { Sparkles, Check } from "lucide-react";

interface HighlightsSlideProps {
  title?: string;
  subtitle?: string;
  highlights?: string[];
}

const HighlightsSlide = ({
  title = "חוזקות הנכס",
  subtitle = "מה שהופך את הנכס הזה למיוחד",
  highlights = [
    "מערכת Smart Home מתקדמת",
    "מטבח Bulthaup יוקרתי",
    "שתי מרפסות מרווחות",
    "חניון רובוטי",
  ],
}: HighlightsSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32">
      <div className="w-full max-w-4xl text-center">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-[#f5c242]" />
          </div>
          <h2 className="mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

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
