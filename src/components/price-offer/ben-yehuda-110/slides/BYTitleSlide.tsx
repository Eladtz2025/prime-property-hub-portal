import cityMarketLogo from "@/assets/city-market-icon.png";

const BYTitleSlide = () => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5758.JPG')`,
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
      
      {/* Content - positioned higher */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start text-center px-8 pt-16 md:pt-24">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-16 md:h-20 w-auto"
          />
        </div>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-white mb-6" />

        {/* Main Title */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-2 tracking-wide"
          style={{ textShadow: softShadow }}
        >
          BEN YEHUDA 110
        </h1>
        
        {/* Subtitle */}
        <h2 
          className="text-xl md:text-2xl lg:text-3xl font-light text-white/90 tracking-widest mb-6"
          style={{ textShadow: softShadow }}
        >
          OLD NORTH TEL AVIV
        </h2>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-white mb-6" />

        {/* Company Name */}
        <p 
          className="text-sm md:text-base font-medium text-white tracking-[0.3em]"
          style={{ textShadow: softShadow }}
        >
          CITY MARKET PROPERTIES
        </p>
      </div>
    </div>
  );
};

export default BYTitleSlide;
