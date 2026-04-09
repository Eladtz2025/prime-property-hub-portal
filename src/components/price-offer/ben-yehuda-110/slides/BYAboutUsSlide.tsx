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
          backgroundImage: `url('/images/ben-yehuda-110/WhatsApp Image 2026-01-12 at 18.45.28.jpeg')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start text-center px-4 md:px-8 pt-8 md:pt-10 lg:pt-12 pb-16 md:pb-20 lg:pb-24" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          City Market Properties
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Boutique Approach Box with Quote */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-3 lg:p-4 text-left mb-1.5 md:mb-2 lg:mb-3">
          {/* Quote inside the box - Hidden on mobile */}
          <p 
            className="hidden md:block text-white text-sm font-light leading-relaxed mb-3 pb-3 border-b border-white/20"
            style={{ textShadow: softShadow }}
          >
            Selling in prime Tel Aviv requires more than exposure.
            <span className="italic ml-1">It requires local intelligence, precise positioning, and human insight.</span>
          </p>
          
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
        <div className="w-full max-w-4xl grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 mb-1.5 md:mb-2">
          {/* Elad Card */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-4 text-center">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-1 md:mb-2">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
            </div>
            <h4 
              className="text-xs md:text-sm font-serif text-white mb-1"
              style={{ textShadow: softShadow }}
            >
              Elad Tzabari
            </h4>
            <div className="mb-1">
              <span 
                className="text-xl md:text-3xl font-bold text-[#f5c242]"
                style={{ textShadow: softShadow }}
              >
                15+
              </span>
              <span className="text-white/80 text-[10px] ml-1">Years</span>
            </div>
            <p className="text-white/90 text-[10px] md:text-xs font-light">
              Tel Aviv market expertise
            </p>
          </div>

          {/* Tali Card */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-4 text-center">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-1 md:mb-2">
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
            </div>
            <h4 
              className="text-xs md:text-sm font-serif text-white mb-1"
              style={{ textShadow: softShadow }}
            >
              Elad Tzabari
            </h4>
            <div className="mb-1">
              <span 
                className="text-xl md:text-3xl font-bold text-[#f5c242]"
                style={{ textShadow: softShadow }}
              >
                10+
              </span>
              <span className="text-white/80 text-[10px] ml-1">Years</span>
            </div>
            <p className="text-white/90 text-[10px] md:text-xs font-light">
              International perspective
            </p>
          </div>
        </div>

        {/* Closing Quote */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-2 md:p-3 lg:p-4 border border-[#f5c242]/30">
          <p 
            className="text-white text-[10px] md:text-sm lg:text-base font-light italic leading-relaxed"
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
