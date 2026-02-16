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

      {/* Light Overlay */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-20">
        {/* Top label */}
        <p
          className="font-montserrat text-[11px] md:text-xs text-white/70 tracking-[0.55em] uppercase mb-6 animate-fade-in"
        >
          Real Estate Boutique
        </p>

        {/* Main Title */}
        <h1
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-normal text-white tracking-[0.25em] mb-3 animate-fade-in"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
        >
          CITY MARKET
        </h1>

        {/* Subtitle in Hebrew */}
        <p
          className="text-white/80 text-base md:text-lg font-light mb-3 animate-fade-in animation-delay-200 max-w-lg"
        >
          מומחיות מקומית. שירות אישי. תהליך ברור.
        </p>

        {/* Since 2016 */}
        <p
          className="font-montserrat text-[9px] md:text-[10px] text-amber-400/50 tracking-[0.4em] uppercase mb-10 animate-fade-in animation-delay-200"
        >
          Since 2016
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-400">
          <button
            onClick={() => navigate("/he/sales")}
            className="px-12 py-4 bg-white text-black font-montserrat text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white/90"
          >
            קנייה
          </button>
          <button
            onClick={() => navigate("/he/rentals")}
            className="px-12 py-4 bg-black/20 backdrop-blur-md border border-white/30 text-white font-montserrat text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-black/30"
          >
            השכרה
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

      {/* Scroll Indicator - vertical line */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ bottom: `${bottomOffset}px` }}
      >
        <span className="font-montserrat text-[9px] text-white/50 tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-10 bg-white/40 animate-bounce" />
      </div>
    </div>
  );
};

export default NewHeroTest;
