import cityMarketLogo from "@/assets/city-market-icon.png";

const BYTitleSlide = () => {
  const softShadow = '0 2px 12px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)';
  
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
          backgroundColor: 'rgba(180, 140, 100, 0.35)',
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-6">
        <p 
          className="text-sm font-light text-white/80 tracking-widest"
          style={{ textShadow: softShadow }}
        >
          01 / 10
        </p>
        <p 
          className="text-sm font-light text-white/80 tracking-widest"
          style={{ textShadow: softShadow }}
        >
          Presentation
        </p>
      </div>
      
      {/* Thin horizontal line */}
      <div className="relative z-10 w-full px-6 md:px-12 mt-4">
        <div className="w-full h-px bg-white/30" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8">
        {/* Logo */}
        <div className="mb-12">
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-16 md:h-20 w-auto"
          />
        </div>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-[#f5c242] mb-8" />

        {/* Main Title */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-2 tracking-wide"
          style={{ textShadow: softShadow }}
        >
          BEN YEHUDA 110
        </h1>
        
        {/* Subtitle */}
        <h2 
          className="text-xl md:text-2xl lg:text-3xl font-light text-white/90 tracking-widest mb-8"
          style={{ textShadow: softShadow }}
        >
          OLD NORTH TEL AVIV
        </h2>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-[#f5c242] mb-8" />

        {/* Company Name */}
        <p 
          className="text-sm md:text-base font-medium text-[#f5c242] tracking-[0.3em]"
          style={{ textShadow: softShadow }}
        >
          CITY MARKET PROPERTIES
        </p>
      </div>
      
      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 pb-6">
        <p 
          className="text-sm font-light text-white/60 tracking-widest"
          style={{ textShadow: softShadow }}
        >
          2025
        </p>
        <p 
          className="text-sm font-light text-white/60 tracking-widest"
          style={{ textShadow: softShadow }}
        >
          ctmarketproperties.com
        </p>
      </div>
    </div>
  );
};

export default BYTitleSlide;
