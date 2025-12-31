interface TitleSlideProps {
  title: string;
  subtitle?: string | null;
  backgroundImage?: string;
  stats?: Array<{ label: string; value: string } | false>;
}

const TitleSlide = ({ title, subtitle, backgroundImage, stats }: TitleSlideProps) => {
  const filteredStats = stats?.filter(Boolean) as Array<{ label: string; value: string }> | undefined;

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 text-center max-w-5xl mx-auto pt-20">
        {/* Logo */}
        <div className="mb-8 opacity-80">
          <span className="text-2xl font-bold tracking-[0.3em] text-white/90 uppercase">Nadlan</span>
        </div>

        {/* Main Title */}
        <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-normal text-white mb-6 leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="font-montserrat text-lg md:text-xl text-white/70 font-light max-w-3xl leading-relaxed mb-12">
            {subtitle}
          </p>
        )}

        {/* Stats Boxes */}
        {filteredStats && filteredStats.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {filteredStats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center px-8 py-6 border border-white/20 rounded-lg backdrop-blur-sm bg-white/5 min-w-[140px]"
              >
                <span className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </span>
                <span className="text-sm text-white/60 font-light tracking-wide">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Scroll Hint */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
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
