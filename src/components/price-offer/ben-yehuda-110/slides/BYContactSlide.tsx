import cityMarketLogo from "@/assets/city-market-icon.png";

interface BYContactSlideProps {
  content?: {
    title?: string;
    contactInfo?: string;
  };
}

const BYContactSlide = ({ content }: BYContactSlideProps) => {
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
          10 / 10
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 py-16">
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-serif font-light text-white mb-8"
          style={{ textShadow: softShadow }}
        >
          {content?.title || "NEXT STEPS & CONTACT"}
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-[#f5c242] mb-8" />

        {/* Content Box */}
        <div className="bg-[#8b7765]/85 backdrop-blur-sm rounded-lg p-8 md:p-12 max-w-3xl mb-8">
          <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed">
            {content?.contactInfo || "Content coming soon..."}
          </p>
        </div>

        {/* Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-12 md:h-16 w-auto opacity-80"
        />
        
        {/* Company Name */}
        <p 
          className="text-sm font-medium text-[#f5c242] tracking-[0.3em] mt-4"
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

export default BYContactSlide;
