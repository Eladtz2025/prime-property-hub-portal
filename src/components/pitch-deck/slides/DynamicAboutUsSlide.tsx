import { AboutUsSlideData } from '@/types/pitch-deck';
import { Globe, Award, Briefcase, LucideIcon } from 'lucide-react';

interface DynamicAboutUsSlideProps {
  data: AboutUsSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Globe, Award, Briefcase
};

const DynamicAboutUsSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/WhatsApp Image 2026-01-12 at 18.45.28.jpeg',
  overlayOpacity = 0.85 
}: DynamicAboutUsSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const defaultTeamMembers = [
    { name: "Elad Tzabari", years: "15+", expertise: "Tel Aviv market expertise", icon: "Award" },
    { name: "Tali Silberberg", years: "10+", expertise: "International perspective", icon: "Globe" }
  ];

  const teamMembers = data.team_members?.length ? data.team_members : defaultTeamMembers;
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      
      {/* Warm sand/orange filter overlay */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: `rgba(180, 140, 100, ${overlayOpacity})`,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-4 md:py-6" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'City Market Properties'}
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Boutique Approach Box - Two Column Layout */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-4 lg:p-5 mb-1.5 md:mb-2 lg:mb-3 border-2 border-[#f5c242]/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Boutique Approach */}
            <div className="text-left">
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
                {(data.boutique_approach || ["Boutique, limited-client approach", "Tailored strategy for each property", "Discretion, clarity, and control"]).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#f5c242] mt-0.5">•</span>
                    <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Right Column - Quote */}
            {data.closing_quote && (
              <div className="flex items-center justify-center md:border-l border-white/20 md:pl-4 pt-3 md:pt-0 border-t md:border-t-0">
                <p 
                  className="text-white text-xs md:text-sm font-serif font-light italic leading-relaxed text-center md:text-left"
                  style={{ textShadow: softShadow }}
                >
                  "{data.closing_quote}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Team Profile Cards */}
        <div className={`w-full max-w-4xl grid gap-2 md:gap-3 lg:gap-2 2xl:gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(teamMembers.length, 2)}, 1fr)` }}>
          {teamMembers.map((member, index) => {
            const IconComponent = iconMap[member.icon] || Award;
            return (
              <div key={index} className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-4 lg:p-2 xl:p-3 2xl:p-4 text-center">
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-8 lg:h-8 2xl:w-10 2xl:h-10 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-1 md:mb-2">
                  <IconComponent className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 text-[#f5c242]" />
                </div>
                <h4 
                  className="text-xs md:text-sm lg:text-xs 2xl:text-sm font-serif text-white mb-1"
                  style={{ textShadow: softShadow }}
                >
                  {member.name}
                </h4>
                <div className="mb-1">
                  <span 
                    className="text-xl md:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-[#f5c242]"
                    style={{ textShadow: softShadow }}
                  >
                    {member.years}
                  </span>
                  <span className="text-white/80 text-[10px] ml-1">Years</span>
                </div>
                <p className="text-white/90 text-[10px] md:text-xs lg:text-[10px] 2xl:text-xs font-light">
                  {member.expertise}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DynamicAboutUsSlide;
