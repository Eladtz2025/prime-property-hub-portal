import { MapPin } from "lucide-react";

interface AreaSlideProps {
  title: string;
  content?: string;
  location?: string;
}

const AreaSlide = ({ title, content, location }: AreaSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      {/* Location Badge */}
      {location && (
        <div className="flex items-center gap-2 text-emerald-400 mb-4 md:mb-8">
          <MapPin className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-lg tracking-wide">{location}</span>
        </div>
      )}

      {/* Title */}
      <h2 className="font-playfair text-2xl md:text-4xl lg:text-5xl text-white mb-6 md:mb-12 text-center">
        {title}
      </h2>

      {/* Content */}
      {content && (
        <div className="max-w-3xl mx-auto pb-20 md:pb-0">
          <p className="text-sm md:text-lg lg:text-xl text-white/70 font-light leading-relaxed text-center whitespace-pre-line">
            {content}
          </p>
        </div>
      )}

      {/* Decorative Element - hidden on mobile */}
      <div className="hidden md:block absolute bottom-40 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
};

export default AreaSlide;
