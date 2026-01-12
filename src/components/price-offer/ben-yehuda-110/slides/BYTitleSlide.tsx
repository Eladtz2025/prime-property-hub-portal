import cityMarketLogo from "@/assets/city-market-icon.png";

const BYTitleSlide = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Watermark Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5758.JPG')`,
          opacity: 0.8,
        }}
      />
      
      {/* Beige Overlay */}
      <div className="absolute inset-0 bg-[#d4c5b5]/30" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8">
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
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          BEN YEHUDA 110
        </h1>
        
        {/* Subtitle */}
        <h2 
          className="text-xl md:text-2xl lg:text-3xl font-light text-white/90 tracking-widest mb-8"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          OLD NORTH TEL AVIV
        </h2>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-[#f5c242] mb-8" />

        {/* Proposal Text */}
        <p 
          className="text-lg md:text-xl font-light text-white/80 tracking-wider mb-12"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          EXCLUSIVE SALES & MARKETING PROPOSAL
        </p>

        {/* Company Name */}
        <p 
          className="text-sm md:text-base font-medium text-[#f5c242] tracking-[0.3em]"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          CITY MARKET PROPERTIES
        </p>
      </div>
    </div>
  );
};

export default BYTitleSlide;
