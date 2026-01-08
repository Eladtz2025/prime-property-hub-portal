import { Check, Globe, Camera, Users, Share2, Home, Video, Megaphone, Eye, Target } from "lucide-react";

interface MarketingItem {
  icon: string;
  title: string;
  description: string;
  stats?: string;
}

interface MarketingPlanSlideProps {
  title?: string;
  subtitle?: string;
  items?: MarketingItem[];
  platforms?: string[];
  targetAudiences?: string[];
}

const iconMap: { [key: string]: any } = {
  globe: Globe,
  camera: Camera,
  users: Users,
  share: Share2,
  home: Home,
  video: Video,
  megaphone: Megaphone,
  target: Target,
};

const MarketingPlanSlide = ({
  title = "תוכנית השיווק שלי",
  subtitle = "כך נבטיח שהנכס שלכם יגיע לקהל הנכון - במהירות",
  items = [
    { 
      icon: "camera", 
      title: "צילום אדריכלי מקצועי", 
      description: "צלם מוסמך + עריכה מקצועית. הרושם הראשוני קובע.",
      stats: "מעלה התעניינות ב-47%"
    },
    { 
      icon: "video", 
      title: "סרטון נכס + רחפן", 
      description: "סרטון איכותי שמציג את הנכס והסביבה מהאוויר.",
      stats: "ממוצע 3,000 צפיות"
    },
    { 
      icon: "globe", 
      title: "פרסום בפלטפורמות מובילות", 
      description: "יד2, מדלן, הומלס, WinWin ועוד 12 אתרים.",
      stats: "ממוצע 15,000 חשיפות"
    },
    { 
      icon: "share", 
      title: "רשתות חברתיות", 
      description: "פייסבוק, אינסטגרם, קבוצות נדל״ן ממוקדות.",
      stats: "200+ קבוצות פעילות"
    },
    { 
      icon: "home", 
      title: "ימי בית פתוח", 
      description: "אירועי הצגה מאורגנים שיוצרים תחושת דחיפות.",
      stats: "ממוצע 8-12 מבקרים"
    },
    { 
      icon: "users", 
      title: "רשת מתווכים", 
      description: "שיתוף פעולה עם משרדי תיווך מובילים.",
      stats: "200+ מתווכים פעילים"
    },
  ],
  platforms = ["יד2", "אינסטגרם", "וואטסאפ שכונתי", "שילוט מקומי", "Nefesh B'Nefesh"],
  targetAudiences = ["רוכשי יוקרה מקומיים", "תושבי חוץ ורוכשים מחו\"ל", "משקיעי פרימיום"],
}: MarketingPlanSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-5xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Marketing Items Grid */}
        <div className="mb-6 md:mb-8 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Globe;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/10"
              >
                {/* Check mark */}
                <div className="absolute left-3 md:left-4 top-3 md:top-4 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                </div>

                {/* Icon */}
                <div className="mb-2 md:mb-3 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />
                </div>

                {/* Content */}
                <h3 className="mb-1 text-sm md:text-base font-semibold text-white">{item.title}</h3>
                <p className="mb-2 md:mb-3 text-xs md:text-sm leading-relaxed text-white/60">{item.description}</p>
                
                {/* Stats Badge */}
                {item.stats && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] md:text-xs text-emerald-400">
                    <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    {item.stats}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Platforms Bar */}
        <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {platforms.map((platform, index) => (
            <span
              key={index}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white/70"
            >
              {platform}
            </span>
          ))}
        </div>

        {/* Target Audiences */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4">
          <p className="text-xs md:text-sm text-white/60 mb-3 text-center">קהלי יעד</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {targetAudiences.map((audience, index) => (
              <span
                key={index}
                className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs md:text-sm text-emerald-300"
              >
                {audience}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingPlanSlide;
