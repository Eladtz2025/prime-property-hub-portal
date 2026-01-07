import { CheckCircle, XCircle } from "lucide-react";

interface Comparison {
  aspect: string;
  exclusive: string;
  nonExclusive: string;
}

interface WhyExclusiveSlideProps {
  title?: string;
  subtitle?: string;
  comparisons?: Comparison[];
  statistic?: {
    value: string;
    label: string;
    source: string;
  };
}

const WhyExclusiveSlide = ({
  title = "למה דווקא בלעדיות?",
  subtitle = "ההבדל בין עבודה ממוקדת לעבודה מפוזרת",
  comparisons = [
    { 
      aspect: "השקעה בשיווק", 
      exclusive: "צילום מקצועי, סרטון, רחפן - הכל כלול", 
      nonExclusive: "צילום בסיסי עם טלפון" 
    },
    { 
      aspect: "זמן תגובה לפניות", 
      exclusive: "מענה תוך 3 שעות - עדיפות עליונה", 
      nonExclusive: "מענה כשמספיקים - יש עוד 50 נכסים" 
    },
    { 
      aspect: "ניהול מו״מ", 
      exclusive: "מו״מ חזק - אני היחידה שמייצגת", 
      nonExclusive: "מתחרים עם מתווכים אחרים על אותו קונה" 
    },
    { 
      aspect: "מעקב ודיווחים", 
      exclusive: "דיווח שבועי מפורט + שקיפות מלאה", 
      nonExclusive: "קשה לעקוב - מי באמת עובד?" 
    },
    { 
      aspect: "תיאום ביקורים", 
      exclusive: "ביקורים מתואמים, מסודרים, ללא הפתעות", 
      nonExclusive: "כל מתווך מביא לקוחות בזמנים שונים" 
    },
  ],
  statistic = {
    value: "12%",
    label: "יותר מהמחיר - בממוצע",
    source: "נתוני לשכת המתווכים 2024",
  },
}: WhyExclusiveSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start md:justify-center px-4 md:px-8 py-20 md:py-24 overflow-y-auto">
      <div className="w-full max-w-5xl pb-20 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-10 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-6 md:gap-8 lg:flex-row">
          {/* Desktop Table - hidden on mobile */}
          <div className="hidden md:block flex-1">
            {/* Table Header */}
            <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-white/50"></div>
              <div className="rounded-t-xl bg-emerald-500/20 py-2 text-center font-semibold text-emerald-400">
                בלעדיות
              </div>
              <div className="rounded-t-xl bg-white/5 py-2 text-center font-medium text-white/50">
                בלי בלעדיות
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2">
              {comparisons.map((comp, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center py-3 font-medium text-white">
                    {comp.aspect}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span className="text-white/80">{comp.exclusive}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <XCircle className="h-4 w-4 flex-shrink-0 text-white/30" />
                    <span className="text-white/50">{comp.nonExclusive}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Cards - shown only on mobile */}
          <div className="md:hidden space-y-3">
            {comparisons.map((comp, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 font-medium text-white text-sm">{comp.aspect}</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-400 mb-0.5">בלעדיות</p>
                      <p className="text-xs text-white/80">{comp.exclusive}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <XCircle className="h-4 w-4 flex-shrink-0 text-white/30 mt-0.5" />
                    <div>
                      <p className="text-xs text-white/40 mb-0.5">בלי בלעדיות</p>
                      <p className="text-xs text-white/50">{comp.nonExclusive}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Statistic Highlight */}
          <div className="flex flex-col items-center justify-center lg:w-72">
            <div className="w-full rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 md:p-8 text-center backdrop-blur-sm">
              <p className="mb-1 md:mb-2 text-xs md:text-sm uppercase tracking-wider text-emerald-400">
                נכסים בבלעדיות נמכרים ב-
              </p>
              <p className="mb-1 md:mb-2 text-5xl md:text-6xl font-bold text-white">{statistic.value}</p>
              <p className="text-base md:text-lg text-white/70">{statistic.label}</p>
              <div className="mt-4 md:mt-6 border-t border-white/10 pt-4 md:pt-6">
                <p className="text-[10px] md:text-xs text-white/50">
                  *{statistic.source}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyExclusiveSlide;
