import { Check } from "lucide-react";

interface FeaturesSlideProps {
  title: string;
  features: string[];
}

const FeaturesSlide = ({ title, features }: FeaturesSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-8 pt-24 pb-32">
      {/* Title */}
      <h2 className="font-playfair text-4xl md:text-5xl text-white mb-16 text-center">
        {title}
      </h2>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-6 border border-white/10 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <span className="text-lg text-white/90 font-light">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSlide;
