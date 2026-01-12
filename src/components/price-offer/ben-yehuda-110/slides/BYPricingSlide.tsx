interface BYPricingSlideProps {
  content?: {
    title?: string;
    priceInfo?: string;
  };
}

const BYPricingSlide = ({ content }: BYPricingSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const marketData = [
    "Recent comparable sales range: ₪2.9M–₪5.7M",
    "Average price per sqm: ~₪58,000",
    "Average deal size: ~62 sqm",
    "Market characterized by active supply and longer absorption"
  ];

  const strategicPositioning = [
    "Priced within the active market band",
    "Reflects current conditions — not peak-cycle pricing",
    "Leaves room for controlled negotiation, not price chasing"
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5765.JPG')`,
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
          MARKET REALITY
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-white mb-6 md:mb-8" />

        {/* Two Column Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Market Data Box */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 text-left">
            <h3 
              className="text-lg md:text-xl font-serif text-white mb-4"
              style={{ textShadow: softShadow }}
            >
              Ben Yehuda Area — 2024
            </h3>
            <ul className="space-y-2">
              {marketData.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1">•</span>
                  <span className="text-white/90 text-sm md:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Strategic Positioning Box */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 text-left">
            <h3 
              className="text-lg md:text-xl font-serif text-white mb-4"
              style={{ textShadow: softShadow }}
            >
              Strategic Positioning
            </h3>
            <ul className="space-y-2">
              {strategicPositioning.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1">•</span>
                  <span className="text-white/90 text-sm md:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conclusion Box */}
        <div className="w-full max-w-4xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-8">
          <h3 
            className="text-base md:text-lg font-serif text-white/80 mb-3"
            style={{ textShadow: softShadow }}
          >
            Conclusion
          </h3>
          <p 
            className="text-white text-lg md:text-xl lg:text-2xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "Pricing is market-aligned, defensible, and intentional."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYPricingSlide;
