import { Building2, User, Palette, Home, Zap, Car } from "lucide-react";

interface BuildingSlideProps {
  title?: string;
  subtitle?: string;
  gushHelka?: string;
  floors?: number;
  units?: number;
  developer?: string;
  architect?: string;
  features?: string[];
}

const BuildingSlide = ({
  title = "הבניין",
  subtitle = "פרטים על הפרויקט",
  gushHelka = "6922/1",
  floors = 4,
  units = 17,
  developer = "חברת אלטנוילנד",
  architect = "יניב פרדו",
  features = [
    "מערכת Smart Home",
    "מטבח Bulthaup יוקרתי",
    "חניון רובוטי",
    "לובי מעוצב",
  ],
}: BuildingSlideProps) => {
  const details = [
    { icon: Building2, label: "קומות", value: floors.toString() },
    { icon: Home, label: "דירות", value: units.toString() },
    { icon: User, label: "יזם", value: developer },
    { icon: Palette, label: "אדריכל", value: architect },
  ];

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-playfair text-3xl md:text-5xl text-white mb-3 md:mb-4">
          {title}
        </h2>
        <p className="text-base md:text-lg text-white/60 font-light">
          {subtitle}
        </p>
        {gushHelka && (
          <p className="text-sm text-emerald-400/80 mt-2">
            גוש/חלקה: {gushHelka}
          </p>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl mb-8 md:mb-12">
        {details.map((detail, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center p-4 md:p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <detail.icon className="h-6 w-6 md:h-8 md:w-8 text-emerald-400 mb-2 md:mb-3" />
            <span className="text-xs md:text-sm text-white/50 mb-1">{detail.label}</span>
            <span className="text-sm md:text-lg font-medium text-white text-center">{detail.value}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="w-full max-w-3xl">
        <h3 className="text-lg md:text-xl text-white/80 mb-4 md:mb-6 text-center font-light">
          מאפיינים ייחודיים
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                {index === 0 && <Zap className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />}
                {index === 1 && <Home className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />}
                {index === 2 && <Car className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />}
                {index === 3 && <Building2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />}
              </div>
              <span className="text-sm md:text-base text-white/80">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuildingSlide;
