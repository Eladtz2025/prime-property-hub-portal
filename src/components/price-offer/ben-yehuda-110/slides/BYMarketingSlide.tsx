import { Camera, Users, Target } from 'lucide-react';

interface BYMarketingSlideProps {
  content?: {
    title?: string;
    strategies?: string[];
  };
}

const BYMarketingSlide = ({ content }: BYMarketingSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const visualStrategy = [
    "Professional photography and video",
    "Lifestyle-led storytelling"
  ];

  const targetedAudiences = [
    "Local lifestyle buyers",
    "Foreign residents & overseas buyers"
  ];

  const exposureStrategy = [
    "Curated launch before mass advertising",
    "Private networks and off-market reach"
  ];

  const columns = [
    { icon: Camera, title: "Visual Strategy", items: visualStrategy },
    { icon: Users, title: "Target Audiences", items: targetedAudiences },
    { icon: Target, title: "Exposure Strategy", items: exposureStrategy }
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/IMG_5766.JPG')`,
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
          POSITIONING & STRATEGY
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Positioning Quote */}
        <div className="w-full max-w-4xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-3 md:p-5 mb-4 md:mb-6">
          <p 
            className="text-white text-sm md:text-lg lg:text-xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "This is not just an apartment — it is a coastal Old North lifestyle asset."
          </p>
        </div>

        {/* Three Column Grid with Icons */}
        <div className="w-full max-w-5xl grid grid-cols-3 gap-2 md:gap-4">
          {columns.map((column, columnIndex) => {
            const IconComponent = column.icon;
            return (
              <div 
                key={columnIndex}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-4 text-left"
              >
                {/* Large Icon */}
                <div className="flex justify-center mb-2 md:mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-[#f5c242]" />
                  </div>
                </div>
                
                <h3 
                  className="text-xs md:text-sm font-serif text-white mb-2 text-center"
                  style={{ textShadow: softShadow }}
                >
                  {column.title}
                </h3>
                <ul className="space-y-1 md:space-y-2">
                  {column.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-[#f5c242] mt-0.5 text-xs">•</span>
                      <span className="text-white/90 text-[11px] md:text-sm font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BYMarketingSlide;
