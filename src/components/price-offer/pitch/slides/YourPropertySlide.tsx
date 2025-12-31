import { MapPin, Maximize, BedDouble, Bath, Car, Sun, Building, Sparkles } from "lucide-react";

interface PropertyHighlight {
  icon: string;
  title: string;
  value: string;
}

interface YourPropertySlideProps {
  title?: string;
  subtitle?: string;
  propertyAddress?: string;
  propertyImage?: string;
  highlights?: PropertyHighlight[];
  uniquePoints?: string[];
  agentNote?: string;
}

const iconMap: { [key: string]: any } = {
  size: Maximize,
  rooms: BedDouble,
  bath: Bath,
  parking: Car,
  balcony: Sun,
  floor: Building,
};

const YourPropertySlide = ({
  title = "הנכס שלכם",
  subtitle = "מה אני רואה כמתווכת מקצועית",
  propertyAddress = "רחוב הירקון 156, תל אביב",
  propertyImage,
  highlights = [
    { icon: "size", title: "שטח", value: "145 מ״ר" },
    { icon: "rooms", title: "חדרים", value: "4" },
    { icon: "floor", title: "קומה", value: "8 מתוך 12" },
    { icon: "balcony", title: "מרפסת", value: "15 מ״ר" },
    { icon: "parking", title: "חניה", value: "2 מקומות" },
  ],
  uniquePoints = [
    "נוף פתוח לים - יתרון משמעותי שמעלה ערך",
    "שיפוץ טרי בשנתיים האחרונות - הקונים יעריכו",
    "מיקום מבוקש - קרוב לחוף ולתחבורה ציבורית",
    "כניסה מיידית - מאפשר גמישות במו״מ",
  ],
  agentNote = "זה מה שהקונים יראו - וזה מה שאני אדע להדגיש עבורכם. הנכס הזה ייחודי, ואני אוודא שכל קונה פוטנציאלי יבין את הערך האמיתי שלו.",
}: YourPropertySlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left: Property Image + Address */}
          <div className="flex-1">
            <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {propertyImage ? (
                <img
                  src={propertyImage}
                  alt={propertyAddress}
                  className="h-64 w-full object-cover lg:h-80"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20 lg:h-80">
                  <Building className="h-16 w-16 text-white/30" />
                </div>
              )}
              {/* Address Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">{propertyAddress}</span>
                </div>
              </div>
            </div>

            {/* Property Highlights */}
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
              {highlights.map((highlight, index) => {
                const IconComponent = iconMap[highlight.icon] || Maximize;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-3 text-center"
                  >
                    <IconComponent className="mb-1 h-5 w-5 text-emerald-400" />
                    <span className="text-lg font-bold text-white">{highlight.value}</span>
                    <span className="text-xs text-white/50">{highlight.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Unique Points */}
          <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">נקודות החוזק של הנכס</h3>
            </div>

            <div className="mb-6 space-y-3">
              {uniquePoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {index + 1}
                  </div>
                  <p className="text-white/80">{point}</p>
                </div>
              ))}
            </div>

            {/* Agent Note */}
            <div className="mt-auto rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-5">
              <p className="text-sm leading-relaxed text-white/70 italic">
                "{agentNote}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YourPropertySlide;
