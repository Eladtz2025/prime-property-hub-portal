import { Check, Globe, Camera, Users, Share2, Home, Video, Megaphone, Eye } from "lucide-react";

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
  agentNote?: string;
}

const iconMap: { [key: string]: any } = {
  globe: Globe,
  camera: Camera,
  users: Users,
  share: Share2,
  home: Home,
  video: Video,
  megaphone: Megaphone,
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
  platforms = ["יד2", "מדלן", "הומלס", "WinWin", "Facebook", "Instagram"],
  agentNote = "כל פעילויות השיווק כלולות בעמלה - ללא עלות נוספת. אתם לא משלמים שקל על צילום, פרסום או שיווק.",
}: MarketingPlanSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Marketing Items Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Globe;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/10"
              >
                {/* Check mark */}
                <div className="absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-3 w-3 text-white" />
                </div>

                {/* Icon */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <IconComponent className="h-6 w-6 text-emerald-400" />
                </div>

                {/* Content */}
                <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-white/60">{item.description}</p>
                
                {/* Stats Badge */}
                {item.stats && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                    <Eye className="h-3 w-3" />
                    {item.stats}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Platforms Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          {platforms.map((platform, index) => (
            <span
              key={index}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
            >
              {platform}
            </span>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 text-center">
          <p className="text-sm text-white/80">{agentNote}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingPlanSlide;
