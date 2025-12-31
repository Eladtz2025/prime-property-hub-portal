import { Check, Globe, Camera, Users, Share2, Home, Video, Megaphone } from "lucide-react";

interface MarketingItem {
  icon: string;
  title: string;
  description: string;
}

interface MarketingPlanSlideProps {
  title?: string;
  subtitle?: string;
  items?: MarketingItem[];
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
  subtitle = "כך נבטיח שהנכס שלכם יגיע לקהל הנכון",
  items = [
    { icon: "globe", title: "פרסום באתרים מובילים", description: "יד2, מדלן, הומלס, WinWin ועוד" },
    { icon: "share", title: "רשתות חברתיות", description: "פייסבוק, אינסטגרם, קבוצות נדל״ן" },
    { icon: "camera", title: "צילום מקצועי", description: "צילום אדריכלי + עריכה מקצועית" },
    { icon: "video", title: "סרטון נכס", description: "סרטון איכותי עם טיסת רחפן" },
    { icon: "home", title: "בית פתוח", description: "ימי הצגה מאורגנים לקונים פוטנציאליים" },
    { icon: "users", title: "רשת מתווכים", description: "שיתוף עם 200+ מתווכים פעילים" },
  ],
}: MarketingPlanSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Marketing Items Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Globe;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/10"
              >
                {/* Check mark */}
                <div className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-4 w-4 text-white" />
                </div>

                {/* Icon */}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <IconComponent className="h-7 w-7 text-emerald-400" />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <p className="mt-8 text-center text-sm text-white/40">
          כל פעילויות השיווק כלולות בעמלה - ללא עלות נוספת
        </p>
      </div>
    </div>
  );
};

export default MarketingPlanSlide;
