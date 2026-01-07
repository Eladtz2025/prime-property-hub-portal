import { Award, Home, Clock, TrendingUp, Heart } from "lucide-react";
import { BUSINESS_INFO } from "@/constants/business";

interface AboutMeSlideProps {
  agentImage?: string;
  yearsExperience?: number;
  propertiesSoldThisYear?: number;
  avgDaysToSell?: number;
  successRate?: number;
  personalStory?: string;
}

const AboutMeSlide = ({
  agentImage,
  yearsExperience = 11,
  propertiesSoldThisYear = 43,
  avgDaysToSell = 19,
  successRate = 93.7,
  personalStory = "לפני 11 שנים נכנסתי לתחום אחרי שאני עצמי עברתי חוויה מאכזבת עם מתווך. הבנתי שיש דרך אחרת - דרך שבה הלקוח מרגיש שיש מישהו שבאמת אכפת לו. מאז, כל עסקה שאני סוגרת היא לא רק עסקה - זו משפחה שאני עוזרת לבנות את העתיד שלה.",
}: AboutMeSlideProps) => {
  const stats = [
    { icon: Clock, value: yearsExperience, label: "שנות ניסיון", suffix: "" },
    { icon: Home, value: propertiesSoldThisYear, label: "נכסים ב-2024", suffix: "" },
    { icon: TrendingUp, value: avgDaysToSell, label: "ימים ממוצע", suffix: "" },
    { icon: Award, value: successRate, label: "אחוז הצלחה", suffix: "%" },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center px-4 md:px-8 py-20 md:py-24 overflow-y-auto">
      <div className="flex max-w-5xl flex-col items-center gap-6 md:gap-12 md:flex-row md:gap-16 pb-20 md:pb-0">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <div className="h-40 w-40 md:h-64 md:w-64 lg:h-80 lg:w-80 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl">
            {agentImage ? (
              <img
                src={agentImage}
                alt={BUSINESS_INFO.brokerName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/30 to-teal-600/30">
                <span className="text-5xl md:text-7xl font-bold text-white/80">
                  {BUSINESS_INFO.brokerName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {/* License Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs md:text-sm font-medium text-white shadow-lg whitespace-nowrap">
            רישיון #{BUSINESS_INFO.license}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col items-center text-center md:items-start md:text-right">
          <p className="mb-1 md:mb-2 text-xs md:text-sm uppercase tracking-wider text-emerald-400">
            לא סתם מתווכת - שותפה לדרך
          </p>
          <h2 className="mb-1 md:mb-2 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {BUSINESS_INFO.brokerName}
          </h2>
          <p className="mb-4 md:mb-6 text-lg md:text-xl text-white/50">{BUSINESS_INFO.name}</p>

          {/* Personal Story */}
          <div className="mb-6 md:mb-8 max-w-lg">
            <div className="mb-2 md:mb-3 flex items-center justify-center md:justify-start gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              <span className="text-xs md:text-sm font-medium text-white/60">הסיפור שלי</span>
            </div>
            <p className="text-sm md:text-lg leading-relaxed text-white/70">
              {personalStory}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-3 py-3 md:px-4 md:py-4 backdrop-blur-sm"
              >
                <stat.icon className="mb-1 md:mb-2 h-5 w-5 md:h-6 md:w-6 text-emerald-400" />
                <span className="text-xl md:text-2xl font-bold text-white">
                  {stat.value}{stat.suffix}
                </span>
                <span className="text-[10px] md:text-xs text-white/50">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMeSlide;
