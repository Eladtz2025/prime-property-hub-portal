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
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <Scale className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Main Terms */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {/* Commission Box */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="mb-2 text-sm uppercase tracking-wider text-white/50">עמלה</p>
            <p className="mb-2 text-5xl font-bold text-white">{commissionPercent}</p>
            <p className="text-sm text-white/50">+ מע״מ כחוק</p>
            <p className="mt-3 text-xs text-emerald-400">סטנדרטי בשוק הנדל״ן</p>
          </div>

          {/* Exclusivity Period Box */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="mb-2 text-sm uppercase tracking-wider text-white/50">תקופת בלעדיות</p>
            <div className="mb-2 flex items-center justify-center gap-2">
              <Calendar className="h-8 w-8 text-emerald-400" />
              <span className="text-5xl font-bold text-white">{exclusivityMonths}</span>
            </div>
            <p className="text-sm text-white/50">חודשים</p>
            <p className="mt-3 text-xs text-emerald-400">על פי חוק - עד 6 חודשים לדירות</p>
          </div>
        </div>

        {/* Included / Not Included */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Included */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">כלול בשירות</h3>
            </div>
            <ul className="space-y-2">
              {includedItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not Included */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-white/50" />
              <h3 className="font-semibold text-white/70">לא כלול (סטנדרטי)</h3>
            </div>
            <ul className="space-y-2">
              {notIncludedItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-white/50">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Note */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-white/60">{legalNote}</p>
        </div>
      </div>
    </div>
  );
};

export default TransparencySlide;
