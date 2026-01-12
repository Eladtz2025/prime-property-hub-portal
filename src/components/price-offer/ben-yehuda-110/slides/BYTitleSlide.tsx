import cityMarketLogo from "@/assets/city-market-icon.png";

interface BYTitleSlideProps {
  currentSlide?: number;
  totalSlides?: number;
}

const BYTitleSlide = ({ currentSlide = 1, totalSlides = 10 }: BYTitleSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/cleaned-property-image (2).png')`,
        }}
      />
      
      {/* Warm sand/orange filter overlay */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: 'rgba(180, 140, 100, 0.85)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Slide Counter - Bottom Left Corner */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-20">
        <span 
          dir="ltr"
          className="text-white text-sm md:text-base font-light tracking-wider bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm"
          style={{ textShadow: softShadow }}
        >
          {currentSlide} of {totalSlides}
        </span>
      </div>

      {/* Logo - Bottom Right Corner */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20">
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-10 md:h-12 lg:h-14 w-auto"
        />
        <span 
          dir="ltr"
          className="text-white text-sm md:text-base font-light tracking-wider bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm"
          style={{ textShadow: softShadow }}
        >
          {currentSlide} of {totalSlides}
        </span>
      </div>
      
      {/* Content - centered */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 md:px-8">
        {/* Decorative Line */}
        <div className="w-16 md:w-24 h-px bg-white mb-4 md:mb-6" />

        {/* Main Title */}
        <h1 
          className="text-3xl md:text-5xl lg:text-7xl font-serif font-light text-white mb-2 tracking-wide"
          style={{ textShadow: softShadow }}
        >
          BEN YEHUDA 110
        </h1>
        
        {/* Subtitle */}
        <h2 
          className="text-lg md:text-2xl lg:text-3xl font-light text-white/90 tracking-widest mb-4 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          OLD NORTH TEL AVIV
        </h2>

        {/* Decorative Line */}
        <div className="w-16 md:w-24 h-px bg-white mb-4 md:mb-6" />

        {/* Company Name */}
        <p 
          className="text-xs md:text-sm lg:text-base font-medium text-white tracking-[0.3em]"
          style={{ textShadow: softShadow }}
        >
          CITY MARKET PROPERTIES
        </p>
      </div>
    </div>
  );
};

export default BYTitleSlide;
