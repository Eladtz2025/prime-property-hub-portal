import { Calendar, Camera, Rocket, Target, Users, CheckCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface TimelineStep {
  week: string;
  title: string;
  description: string;
  icon: string;
}

interface TimelineSlideProps {
  title?: string;
  subtitle?: string;
  steps?: TimelineStep[];
}

const iconMap: Record<string, LucideIcon> = {
  calendar: Calendar,
  camera: Camera,
  rocket: Rocket,
  target: Target,
  users: Users,
  check: CheckCircle,
};

const TimelineSlide = ({
  title = "לוח זמנים",
  subtitle = "תהליך השיווק שלב אחר שלב",
  steps = [
    {
      week: "שבוע 1",
      title: "הכנה ומיצוב",
      description: "ניתוח שוק, בניית סיפור שיווקי",
      icon: "calendar",
    },
    {
      week: "שבוע 1-2",
      title: "יצירת תוכן",
      description: "צילום, וידאו, חומרי שיווק",
      icon: "camera",
    },
    {
      week: "שבוע 2-3",
      title: "השקה רכה",
      description: "חשיפה מבוקרת לקהל איכותי",
      icon: "rocket",
    },
    {
      week: "שבוע 3-6",
      title: "השקה מלאה",
      description: "פרסום בפלטפורמות, שילוט מקומי",
      icon: "target",
    },
    {
      week: "שבוע 4-8",
      title: "מעורבות רוכשים",
      description: "סיורים פרטיים, משא ומתן",
      icon: "users",
    },
    {
      week: "בהתאם לרוכש",
      title: "סגירה והשלמה",
      description: "חתימה, העברת בעלות",
      icon: "check",
    },
  ],
}: TimelineSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-20 md:pt-24 pb-32 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6 md:mb-10">
        <h2 className="font-playfair text-3xl md:text-5xl text-white mb-3 md:mb-4">
          {title}
        </h2>
        <p className="text-base md:text-lg text-white/60 font-light">
          {subtitle}
        </p>
      </div>

      {/* Timeline */}
      <div className="w-full max-w-3xl">
        <div className="relative">
          {/* Vertical Line - hidden on mobile */}
          <div className="hidden md:block absolute right-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/30 to-transparent" />

          {/* Steps */}
          <div className="space-y-4 md:space-y-6">
            {steps.map((step, index) => {
              const Icon = iconMap[step.icon] || Calendar;
              return (
                <div key={index} className="relative flex gap-3 md:gap-6">
                  {/* Icon Circle */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/50 flex items-center justify-center">
                      <Icon className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4 md:pb-6">
                    <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                          {step.week}
                        </span>
                        <h3 className="text-base md:text-lg font-medium text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm md:text-base text-white/60">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlide;
