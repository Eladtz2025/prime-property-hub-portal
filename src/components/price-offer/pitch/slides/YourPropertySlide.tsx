import { MapPin, Maximize, BedDouble, Bath, Car, Sun, Building, Sparkles, DollarSign } from "lucide-react";

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
}

const iconMap: { [key: string]: any } = {
  size: Maximize,
  rooms: BedDouble,
  bath: Bath,
  parking: Car,
  balcony: Sun,
  floor: Building,
  price: DollarSign,
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
}: YourPropertySlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-5xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-6 md:gap-8 lg:flex-row">
          {/* Left: Property Image + Address */}
          <div className="flex-1">
            <div className="relative mb-3 md:mb-4 overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-white/5">
              {propertyImage ? (
                <img
                  src={propertyImage}
                  alt={propertyAddress}
                  className="h-48 md:h-64 lg:h-80 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 md:h-64 lg:h-80 w-full items-center justify-center bg-gradient-to-br from-[#4a9a9a]/20 to-[#2d3b3a]/20">
                  <Building className="h-12 w-12 md:h-16 md:w-16 text-white/30" />
                </div>
              )}
              {/* Address Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4">
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#4a9a9a]" />
                  <span className="text-sm md:text-base font-medium">{propertyAddress}</span>
                </div>
              </div>
            </div>

            {/* Property Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              {highlights.map((highlight, index) => {
                const IconComponent = iconMap[highlight.icon] || Maximize;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center rounded-lg md:rounded-xl border border-white/10 bg-white/5 p-2 md:p-3 text-center"
                  >
                    <IconComponent className="mb-1 h-4 w-4 md:h-5 md:w-5 text-[#4a9a9a]" />
                    <span className="text-sm md:text-lg font-bold text-white">{highlight.value}</span>
                    <span className="text-[10px] md:text-xs text-white/50">{highlight.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Unique Points */}
          <div className="flex flex-1 flex-col">
            <div className="mb-3 md:mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-[#f5c242]" />
              <h3 className="text-base md:text-lg font-semibold text-white">נקודות החוזק של הנכס</h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              {uniquePoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 md:gap-3 rounded-lg md:rounded-xl border border-white/10 bg-white/5 p-3 md:p-4"
                >
                  <div className="mt-0.5 flex h-5 w-5 md:h-6 md:w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#4a9a9a]/20 text-xs md:text-sm font-bold text-[#4a9a9a]">
                    {index + 1}
                  </div>
                  <p className="text-sm md:text-base text-white/80">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YourPropertySlide;
