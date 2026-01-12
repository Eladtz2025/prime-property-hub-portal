interface BYTimelineSlideProps {
  content?: {
    title?: string;
    timeline?: string[];
  };
}

const BYTimelineSlide = ({ content }: BYTimelineSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const timelineItems = [
    {
      period: "Week 1",
      description: "Pricing validation, positioning, preparation"
    },
    {
      period: "Weeks 2–3",
      description: "Targeted soft launch to qualified buyers"
    },
    {
      period: "Weeks 4–6",
      description: "Buyer feedback, refinement, negotiations"
    },
    {
      period: "Ongoing",
      description: "Offer management and closing strategy"
    }
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5305.jpeg')`,
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
          TIMELINE
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-white mb-6 md:mb-8" />

        {/* Timeline Container */}
        <div className="w-full max-w-3xl">
          <div className="relative">
            {/* Vertical Line - Hidden on mobile */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-px bg-white/30" />

            {/* Timeline Items */}
            <div className="space-y-4 md:space-y-6">
              {timelineItems.map((item, index) => (
                <div 
                  key={index}
                  className="relative flex flex-col md:flex-row items-center gap-3 md:gap-6"
                >
                  {/* Period Badge */}
                  <div className="md:w-1/3 md:text-right">
                    <span 
                      className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm md:text-base font-medium"
                      style={{ textShadow: softShadow }}
                    >
                      {item.period}
                    </span>
                  </div>

                  {/* Center Dot - Hidden on mobile */}
                  <div className="hidden md:flex items-center justify-center w-4 h-4 rounded-full bg-white/80 z-10" />

                  {/* Description Box */}
                  <div className="md:w-1/2 w-full">
                    <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left md:text-left">
                      <p className="text-white/90 text-sm md:text-base font-light">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYTimelineSlide;
