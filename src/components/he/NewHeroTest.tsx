import { useNavigate } from "react-router-dom";
import { useSafeAreaBottom } from "@/hooks/useSafeAreaBottom";

const NewHeroTest = () => {
  const navigate = useNavigate();
  const bottomOffset = useSafeAreaBottom(32);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <picture>
        <source
          type="image/webp"
          srcSet="/images/en/hero-last-one-640w.webp 640w, /images/en/hero-last-one-1024w.webp 1024w, /images/en/hero-last-one.webp 1920w"
          sizes="100vw"
        />
        <img
          src="/images/en/hero-last-one.webp"
          alt="רקע גיבור"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
      </picture>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        {/* Top label */}
        <p className="font-montserrat text-[11px] md:text-xs text-white/70 tracking-[0.45em] uppercase mb-6 animate-fade-in">
          Real Estate Boutique
        </p>

        {/* Main Title */}
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-wide mb-3 animate-fade-in">
          CITY MARKET
        </h1>

        {/* Subtitle in Hebrew */}
        <p className="text-white/85 text-base md:text-lg font-light mb-3 animate-fade-in animation-delay-200 max-w-lg">
          מומחיות מקומית. שירות אישי. תהליך ברור.
        </p>

        {/* Since 2016 */}
        <p className="font-montserrat text-[10px] md:text-xs text-amber-400/80 tracking-[0.35em] uppercase mb-10 animate-fade-in animation-delay-200">
          Since 2016
        </p>

        {/* CTA Buttons - like the SUNLESS reference */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-400">
          <button
            onClick={() => navigate("/he/rentals")}
            className="px-12 py-4 bg-white text-black font-montserrat text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white/90"
          >
            השכרה
          </button>
          <button
            onClick={() => navigate("/he/sales")}
            className="px-12 py-4 bg-transparent border border-white text-white font-montserrat text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white/10"
          >
            קנייה
          </button>
        </div>
      </div>

      {/* Language Switcher */}
      <button
        onClick={() => navigate("/en")}
        className="absolute right-8 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/20 hover:border-white/30 z-50"
        style={{ bottom: `${bottomOffset}px` }}
      >
        English
      </button>

      {/* Scroll Indicator */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 animate-bounce"
        style={{ bottom: `${bottomOffset}px` }}
      >
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-scroll" />
        </div>
      </div>
    </div>
  );
};

export default NewHeroTest;
