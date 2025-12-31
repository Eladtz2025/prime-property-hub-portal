import { MapPin } from "lucide-react";

interface AreaSlideProps {
  title: string;
  content?: string;
  location?: string;
}

const AreaSlide = ({ title, content, location }: AreaSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-8 pt-24 pb-32">
      {/* Location Badge */}
      {location && (
        <div className="flex items-center gap-2 text-emerald-400 mb-8">
          <MapPin className="h-5 w-5" />
          <span className="text-lg tracking-wide">{location}</span>
        </div>
      )}

      {/* Title */}
      <h2 className="font-playfair text-4xl md:text-5xl text-white mb-12 text-center">
        {title}
      </h2>

      {/* Content */}
      {content && (
        <div className="max-w-3xl mx-auto">
          <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed text-center whitespace-pre-line">
            {content}
          </p>
        </div>
      )}

      {/* Decorative Element */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
};

export default AreaSlide;
