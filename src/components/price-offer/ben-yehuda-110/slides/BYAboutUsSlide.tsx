interface BYAboutUsSlideProps {
  content?: {
    title?: string;
    description?: string;
  };
}

const BYAboutUsSlide = ({ content }: BYAboutUsSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const boutiqueApproach = [
    "Boutique, limited-client approach",
    "Tailored strategy for each property",
    "Discretion, clarity, and control"
  ];

  const ourAdvantage = [
    "Elad: 15+ years of Tel Aviv market expertise",
    "Tali: International perspective, communication, trust-building"
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/99F9645C-C602-48C6-9476-D2ED18714BAF.jpeg')`,
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
          CITY MARKET PROPERTIES
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-white mb-6 md:mb-8" />

        {/* Opening Quote */}
        <div className="w-full max-w-3xl mb-4 md:mb-6">
          <p 
            className="text-white text-lg md:text-xl font-light leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            Selling in prime Tel Aviv requires more than exposure.
          </p>
          <p 
            className="text-white text-lg md:text-xl font-light italic mt-2"
            style={{ textShadow: softShadow }}
          >
            It requires local intelligence, precise positioning, and human insight.
          </p>
        </div>

        {/* Two Column Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Boutique Approach Box */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 text-left">
            <h3 
              className="text-lg md:text-xl font-serif text-white mb-4"
              style={{ textShadow: softShadow }}
            >
              Boutique Approach
            </h3>
            <ul className="space-y-2">
              {boutiqueApproach.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1">•</span>
                  <span className="text-white/90 text-sm md:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Advantage Box */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 text-left">
            <h3 
              className="text-lg md:text-xl font-serif text-white mb-4"
              style={{ textShadow: softShadow }}
            >
              Our Advantage
            </h3>
            <ul className="space-y-2">
              {ourAdvantage.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1">•</span>
                  <span className="text-white/90 text-sm md:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Closing Quote */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-8">
          <p 
            className="text-white text-base md:text-lg lg:text-xl font-light italic leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            "Together, we bridge local authenticity and global demand, positioning homes not merely as assets — but as places people genuinely want to live."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYAboutUsSlide;
