import { Home, Maximize, Layers, Car, DoorOpen, Building2 } from "lucide-react";

interface Detail {
  label: string;
  value: string;
  icon: string;
}

interface DetailsSlideProps {
  title: string;
  details: Detail[];
}

const iconMap: Record<string, React.ReactNode> = {
  area: <Maximize className="h-8 w-8" />,
  balcony: <Layers className="h-8 w-8" />,
  rooms: <Home className="h-8 w-8" />,
  floor: <Building2 className="h-8 w-8" />,
  parking: <Car className="h-8 w-8" />,
  elevator: <DoorOpen className="h-8 w-8" />,
};

const DetailsSlide = ({ title, details }: DetailsSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-16 md:pt-20 pb-28 md:pb-32 overflow-y-auto">
      {/* Title */}
      <h2 className="font-playfair text-4xl md:text-5xl text-white mb-16 text-center">
        {title}
      </h2>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full">
        {details.map((detail, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center p-4 md:p-8 border border-white/10 rounded-2xl backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            <div className="text-emerald-400 mb-4">
              {iconMap[detail.icon] || <Home className="h-8 w-8" />}
            </div>
            <span className="text-3xl md:text-4xl font-bold text-white mb-2">
              {detail.value}
            </span>
            <span className="text-sm text-white/60 font-light text-center">
              {detail.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsSlide;
