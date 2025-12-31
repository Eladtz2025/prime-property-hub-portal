import { ChevronDown } from "lucide-react";

interface LuxuryHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  onScrollDown?: () => void;
}

const LuxuryHero = ({ title, subtitle, backgroundImage, onScrollDown }: LuxuryHeroProps) => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <div className="animate-fade-in">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-white/80">
            הצעת מחיר
          </p>
          <h1 className="mb-6 font-serif text-4xl font-light leading-tight md:text-6xl lg:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-lg font-light text-white/90 md:text-xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <button 
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer text-white/80 transition-colors hover:text-white"
        aria-label="גלול למטה"
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs font-light uppercase tracking-widest">גלול</span>
          <ChevronDown className="h-6 w-6" />
        </div>
      </button>
    </section>
  );
};

export default LuxuryHero;
