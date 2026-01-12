import cityMarketLogo from "@/assets/city-market-icon.png";

const BYTitleSlide = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Watermark Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5758.JPG')`,
          opacity: 0.65,
        }}
      />
      
      {/* Beige Overlay */}
      <div className="absolute inset-0 bg-[#d4c5b5]/45" />
      
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
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-[#2d3b3a] mb-2 tracking-wide">
          BEN YEHUDA 110
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-[#2d3b3a]/80 tracking-widest mb-8">
          OLD NORTH TEL AVIV
        </h2>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-[#f5c242] mb-8" />

        {/* Proposal Text */}
        <p className="text-lg md:text-xl font-light text-[#2d3b3a]/70 tracking-wider mb-12">
          EXCLUSIVE SALES & MARKETING PROPOSAL
        </p>

        {/* Company Name */}
        <p className="text-sm md:text-base font-medium text-[#4a9a9a] tracking-[0.3em]">
          CITY MARKET PROPERTIES
        </p>
      </div>
    </div>
  );
};

export default BYTitleSlide;
