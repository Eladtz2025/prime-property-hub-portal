import { Scale, Calendar, Check, X, HelpCircle } from "lucide-react";

interface TransparencySlideProps {
  title?: string;
  subtitle?: string;
  commissionPercent?: string;
  exclusivityMonths?: number;
  includedItems?: string[];
  notIncludedItems?: string[];
  legalNote?: string;
}

const TransparencySlide = ({
  title = "שקיפות מלאה",
  subtitle = "בלי הפתעות - הכל על השולחן מראש",
  commissionPercent = "2%",
  exclusivityMonths = 3,
  includedItems = [
    "צילום מקצועי אדריכלי",
    "סרטון נכס + צילום רחפן",
    "פרסום בכל הפלטפורמות (יד2, מדלן, הומלס, פייסבוק)",
    "ימי בית פתוח וסיורים מאורגנים",
    "ניהול מו״מ מקצועי עד לחתימה",
    "ליווי עד למסירת המפתחות",
    "דיווחים שבועיים ועדכונים שוטפים",
  ],
  notIncludedItems = [
    "שכר טרחת עורך דין",
    "אגרות והיטלים (מס שבח, היטל השבחה)",
    "שמאות (אם נדרשת)",
  ],
  legalNote = "בסיום תקופת הבלעדיות - אתם חופשיים להמשיך לבד או עם כל מתווך אחר. בלי התחייבויות נוספות.",
}: TransparencySlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-10 text-center">
          <Scale className="mx-auto mb-3 md:mb-4 h-10 w-10 md:h-12 md:w-12 text-emerald-400" />
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Main Terms */}
        <div className="mb-6 md:mb-8 grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {/* Commission Box */}
          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center">
            <p className="mb-1 md:mb-2 text-xs md:text-sm uppercase tracking-wider text-white/50">עמלה</p>
            <p className="mb-1 md:mb-2 text-4xl md:text-5xl font-bold text-white">{commissionPercent}</p>
            <p className="text-xs md:text-sm text-white/50">+ מע״מ כחוק</p>
            <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-emerald-400">סטנדרטי בשוק הנדל״ן</p>
          </div>

          {/* Exclusivity Period Box */}
          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center">
            <p className="mb-1 md:mb-2 text-xs md:text-sm uppercase tracking-wider text-white/50">תקופת בלעדיות</p>
            <div className="mb-1 md:mb-2 flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-emerald-400" />
              <span className="text-4xl md:text-5xl font-bold text-white">{exclusivityMonths}</span>
            </div>
            <p className="text-xs md:text-sm text-white/50">חודשים</p>
            <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-emerald-400">על פי חוק - עד 6 חודשים לדירות</p>
          </div>
        </div>

        {/* Included / Not Included */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          {/* Included */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 md:p-5">
            <div className="mb-3 md:mb-4 flex items-center gap-2">
              <Check className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
              <h3 className="text-sm md:text-base font-semibold text-emerald-400">כלול בשירות</h3>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {includedItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-white/70">
                  <Check className="mt-0.5 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not Included */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="mb-3 md:mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-white/50" />
              <h3 className="text-sm md:text-base font-semibold text-white/70">לא כלול (סטנדרטי)</h3>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {notIncludedItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-white/50">
                  <X className="mt-0.5 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-white/30" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Note */}
        <div className="mt-4 md:mt-6 rounded-xl border border-white/10 bg-white/5 p-3 md:p-4 text-center">
          <p className="text-xs md:text-sm text-white/60">{legalNote}</p>
        </div>
      </div>
    </div>
  );
};

export default TransparencySlide;
