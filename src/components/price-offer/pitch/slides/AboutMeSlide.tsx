import { Award, Home, Clock, TrendingUp } from "lucide-react";
import { BUSINESS_INFO } from "@/constants/business";

interface AboutMeSlideProps {
  agentImage?: string;
  yearsExperience?: number;
  propertiesSoldThisYear?: number;
  avgDaysToSell?: number;
  successRate?: number;
  personalQuote?: string;
}

const AboutMeSlide = ({
  agentImage,
  yearsExperience = 12,
  propertiesSoldThisYear = 47,
  avgDaysToSell = 21,
  successRate = 94,
  personalQuote = "אני מאמינה שכל נכס ראוי להצגה מקצועית וליווי אישי לאורך כל הדרך. המטרה שלי - להשיג לכם את המחיר הטוב ביותר בזמן הקצר ביותר.",
}: AboutMeSlideProps) => {
  const stats = [
    { icon: Clock, value: yearsExperience, label: "שנות ניסיון", suffix: "" },
    { icon: Home, value: propertiesSoldThisYear, label: "נכסים ב-2024", suffix: "" },
    { icon: TrendingUp, value: avgDaysToSell, label: "ימים למכירה", suffix: "ממוצע" },
    { icon: Award, value: successRate, label: "אחוז הצלחה", suffix: "%" },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center px-8 py-24">
      <div className="flex max-w-5xl flex-col items-center gap-12 md:flex-row md:gap-16">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <div className="h-64 w-64 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl md:h-80 md:w-80">
            {agentImage ? (
              <img
                src={agentImage}
                alt={BUSINESS_INFO.brokerName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/30 to-teal-600/30">
                <span className="text-7xl font-bold text-white/80">
                  {BUSINESS_INFO.brokerName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {/* License Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-sm font-medium text-white shadow-lg">
            רישיון #{BUSINESS_INFO.license}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col items-center text-center md:items-start md:text-right">
          <h2 className="mb-2 text-4xl font-bold text-white md:text-5xl">
            {BUSINESS_INFO.brokerName}
          </h2>
          <p className="mb-6 text-xl text-emerald-400">{BUSINESS_INFO.name}</p>

          {/* Personal Quote */}
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/70">
            "{personalQuote}"
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
              >
                <stat.icon className="mb-2 h-6 w-6 text-emerald-400" />
                <span className="text-2xl font-bold text-white">
                  {stat.value}{stat.suffix}
                </span>
                <span className="text-xs text-white/50">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMeSlide;
