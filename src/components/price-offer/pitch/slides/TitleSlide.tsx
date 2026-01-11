import cityMarketLogo from "@/assets/city-market-icon.png";

interface TitleSlideProps {
  title: string;
  subtitle?: string | null;
  backgroundImage?: string;
  stats?: Array<{ label: string; value: string } | false>;
}

const TitleSlide = ({ title, subtitle, backgroundImage, stats }: TitleSlideProps) => {
  const filteredStats = stats?.filter(Boolean) as Array<{ label: string; value: string }> | undefined;

  const textShadowStyle = {
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-y-auto">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt={`${title} - תמונת נכס`}
            className="h-full w-full object-cover"
          />
          {/* Subtle bottom gradient only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 md:px-8 text-center max-w-5xl mx-auto">
        {/* Logo */}
        <div className="mb-6 md:mb-10 flex flex-col items-center gap-2">
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-14 w-14 md:h-20 md:w-20"
          />
          <span 
            className="text-sm md:text-lg font-bold tracking-[0.15em] md:tracking-[0.2em] text-white/90 uppercase"
            style={textShadowStyle}
          >
            City Market Properties
          </span>
        </div>

        {/* Main Title */}
        <h1 
          className="font-playfair text-4xl md:text-6xl lg:text-8xl font-normal text-white mb-4 md:mb-6 leading-tight"
          style={textShadowStyle}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p 
            className="font-montserrat text-lg md:text-2xl text-white font-light max-w-3xl leading-relaxed"
            style={textShadowStyle}
          >
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
      </div>
    </div>
  );
};

export default TitleSlide;
