import { Shield, Target, Clock, TrendingUp, Users, CheckCircle } from "lucide-react";

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface WhyExclusiveSlideProps {
  title?: string;
  subtitle?: string;
  benefits?: Benefit[];
  statistic?: {
    value: string;
    label: string;
  };
}

const iconMap: { [key: string]: any } = {
  shield: Shield,
  target: Target,
  clock: Clock,
  trending: TrendingUp,
  users: Users,
  check: CheckCircle,
};

const WhyExclusiveSlide = ({
  title = "למה בלעדיות?",
  subtitle = "היתרונות שלכם כשבוחרים לעבוד איתי בבלעדיות",
  benefits = [
    { icon: "target", title: "מחויבות מלאה", description: "אני משקיעה את כל המרץ והמשאבים בנכס שלכם" },
    { icon: "trending", title: "השקעה מקסימלית", description: "צילום מקצועי, סרטון, פרסום בכל הפלטפורמות" },
    { icon: "clock", title: "תיאום מסודר", description: "ביקורים מתואמים, ללא הפתעות והפרעות מיותרות" },
    { icon: "shield", title: "מו״מ אפקטיבי", description: "כשאני היחידה שמייצגת - המו״מ חזק יותר" },
    { icon: "users", title: "שקיפות מלאה", description: "דיווחים שוטפים על כל פניה והתעניינות" },
  ],
  statistic = {
    value: "12%",
    label: "יותר מהמחיר המבוקש",
  },
}: WhyExclusiveSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Benefits List */}
          <div className="flex-1 space-y-4">
            {benefits.map((benefit, index) => {
              const IconComponent = iconMap[benefit.icon] || CheckCircle;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <IconComponent className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">{benefit.title}</h3>
                    <p className="text-sm text-white/60">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Statistic Highlight */}
          <div className="flex flex-col items-center justify-center lg:w-80">
            <div className="w-full rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 text-center backdrop-blur-sm">
              <p className="mb-2 text-sm uppercase tracking-wider text-emerald-400">נכסים בבלעדיות נמכרים ב-</p>
              <p className="mb-2 text-6xl font-bold text-white">{statistic.value}</p>
              <p className="text-lg text-white/70">{statistic.label}</p>
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-sm text-white/50">
                  *על פי נתוני לשכת המתווכים 2024
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
