import cityMarketLogo from "@/assets/city-market-icon.png";

interface TitleSlideProps {
  title: string;
  subtitle?: string | null;
  backgroundImage?: string;
  stats?: Array<{ label: string; value: string } | false>;
}

const TitleSlide = ({ title, subtitle, backgroundImage, stats }: TitleSlideProps) => {
  const filteredStats = stats?.filter(Boolean) as Array<{ label: string; value: string }> | undefined;

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-y-auto">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 md:px-8 text-center max-w-5xl mx-auto pt-16 md:pt-20 pb-32 md:pb-24">
        {/* Logo */}
        <div className="mb-4 md:mb-8 flex flex-col items-center gap-2">
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-14 w-14 md:h-20 md:w-20"
          />
          <span className="text-sm md:text-lg font-bold tracking-[0.15em] md:tracking-[0.2em] text-white/90 uppercase">
            City Market Properties
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-playfair text-3xl md:text-5xl lg:text-7xl font-normal text-white mb-4 md:mb-6 leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="font-montserrat text-base md:text-xl text-white/70 font-light max-w-3xl leading-relaxed mb-8 md:mb-12">
            {subtitle}
          </p>
        )}

        {/* Stats Boxes */}
        {filteredStats && filteredStats.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 md:mt-8 w-full max-w-sm md:max-w-none px-2">
            {filteredStats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center px-4 py-3 md:px-8 md:py-6 border border-white/20 rounded-lg backdrop-blur-sm bg-white/5 min-w-[90px] md:min-w-[140px] flex-1 md:flex-none"
              >
                <span className="text-xl md:text-4xl font-bold text-white mb-1 md:mb-2">
                  {stat.value}
                </span>
                <span className="text-[10px] md:text-sm text-white/60 font-light tracking-wide">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Scroll Hint - hidden on mobile */}
        <div className="hidden md:flex absolute bottom-32 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">גלול או לחץ להמשך</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleSlide;
