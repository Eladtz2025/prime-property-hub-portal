interface BYMarketingIISlideProps {
  content?: {
    title?: string;
    details?: string[];
  };
}

const BYMarketingIISlide = ({ content }: BYMarketingIISlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const ourApproach = [
    "Pre-screened buyers only",
    "Narrative control throughout the process",
    "Strategic negotiation protecting price, terms, and timing"
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5295.jpeg')`,
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
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-16 overflow-y-auto" dir="ltr">
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-serif font-light text-white mb-6 md:mb-8"
          style={{ textShadow: softShadow }}
        >
          WHY CITY MARKET
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-white mb-6 md:mb-8" />

        {/* Opening Statement */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-6 mb-4 md:mb-6">
          <p 
            className="text-white text-lg md:text-xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "Buyers at this level respond to confidence and clarity."
          </p>
        </div>

        {/* Our Approach Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 mb-4 md:mb-6 text-left">
          <h3 
            className="text-lg md:text-xl font-serif text-white mb-4 text-center"
            style={{ textShadow: softShadow }}
          >
            Our Approach
          </h3>
          <ul className="space-y-3">
            {ourApproach.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-white/60 mt-1">•</span>
                <span className="text-white/90 text-sm md:text-base font-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Result Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-8">
          <h3 
            className="text-base md:text-lg font-serif text-white/80 mb-3"
            style={{ textShadow: softShadow }}
          >
            Result
          </h3>
          <p 
            className="text-white text-lg md:text-xl lg:text-2xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "We manage buyer behavior, not just listings."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYMarketingIISlide;
