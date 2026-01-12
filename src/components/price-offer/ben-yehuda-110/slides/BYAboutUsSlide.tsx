import { Globe, Award, Briefcase } from 'lucide-react';

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
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/99F9645C-C602-48C6-9476-D2ED18714BAF.jpeg')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-6 md:py-8" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          CITY MARKET PROPERTIES
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Opening Quote - Hidden on mobile */}
        <div className="hidden md:block w-full max-w-3xl bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 mb-4">
          <p 
            className="text-white text-base font-light leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            Selling in prime Tel Aviv requires more than exposure.
            <span className="italic ml-1">It requires local intelligence, precise positioning, and human insight.</span>
          </p>
        </div>

        {/* Boutique Approach Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-4 text-left mb-3 md:mb-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
            <h3 
              className="text-sm md:text-lg font-serif text-white"
              style={{ textShadow: softShadow }}
            >
              Boutique Approach
            </h3>
          </div>
          <ul className="space-y-1 md:space-y-2">
            {boutiqueApproach.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[#f5c242] mt-0.5">•</span>
                <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Two Profile Cards */}
        <div className="w-full max-w-4xl grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4">
          {/* Elad Card */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-[#f5c242]" />
            </div>
            <h4 
              className="text-sm md:text-base font-serif text-white mb-1 md:mb-2"
              style={{ textShadow: softShadow }}
            >
              Elad Tzabari
            </h4>
            <div className="mb-1 md:mb-2">
              <span 
                className="text-2xl md:text-4xl font-bold text-[#f5c242]"
                style={{ textShadow: softShadow }}
              >
                15+
              </span>
              <span className="text-white/80 text-xs ml-1">Years</span>
            </div>
            <p className="text-white/90 text-xs font-light">
              Tel Aviv market expertise
            </p>
          </div>

          {/* Tali Card */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Globe className="w-5 h-5 md:w-6 md:h-6 text-[#f5c242]" />
            </div>
            <h4 
              className="text-sm md:text-base font-serif text-white mb-1 md:mb-2"
              style={{ textShadow: softShadow }}
            >
              Tali Silberberg
            </h4>
            <p className="text-white/90 text-xs font-light leading-relaxed">
              International perspective & trust-building
            </p>
          </div>
        </div>

        {/* Closing Quote */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-3 md:p-5 border border-[#f5c242]/30">
          <p 
            className="text-white text-xs md:text-base font-light italic leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            "Together, we bridge local authenticity and global demand, positioning homes as places people genuinely want to live."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYAboutUsSlide;
