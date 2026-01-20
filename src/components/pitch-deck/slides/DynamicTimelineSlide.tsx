import { TimelineSlideData } from '@/types/pitch-deck';
import { Language } from '@/lib/pitch-deck-translations';
import { FileSearch, Users, MessageSquare, CheckCircle, LucideIcon } from 'lucide-react';

interface DynamicTimelineSlideProps {
  data: TimelineSlideData;
  language?: Language;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const iconMap: Record<string, LucideIcon> = {
  FileSearch, Users, MessageSquare, CheckCircle
};

const DynamicTimelineSlide = ({ 
  data, 
  language = 'en',
  backgroundImage = '/images/ben-yehuda-110/IMG_5305.jpeg',
  overlayOpacity = 0.85 
}: DynamicTimelineSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  const isRTL = language === 'he';

  const defaultTimelineItems = [
    { number: 1, period: "Week 1", description: "Pricing validation, positioning", icon: "FileSearch" },
    { number: 2, period: "Weeks 2–3", description: "Soft launch to qualified buyers", icon: "Users" },
    { number: 3, period: "Weeks 4–6", description: "Full market exposure", icon: "MessageSquare" },
    { number: 4, period: "Ongoing", description: "Buyer feedback & negotiations", icon: "CheckCircle" }
  ];

  const timelineItems = data.timeline_items?.length ? data.timeline_items : defaultTimelineItems;
  
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
          {data.title || 'Timeline'}
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-4 md:mb-6" />

        {/* Horizontal Timeline - Desktop */}
        <div className="hidden md:block w-full max-w-5xl">
          {/* Progress Line */}
          <div className="relative mb-6">
            <div className="absolute top-5 left-0 right-0 h-1 bg-white/20 rounded-full" />
            <div 
              className="absolute top-5 left-0 h-1 rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.3), #f5c242)'
              }}
            />
            
            {/* Numbered Circles */}
            <div className="relative flex justify-between">
              {timelineItems.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${100 / timelineItems.length}%` }}>
                  <div className="w-10 h-10 rounded-full bg-[#f5c242] flex items-center justify-center text-white font-bold text-base z-10 shadow-lg">
                    {item.number}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Cards */}
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${timelineItems.length}, 1fr)` }}>
            {timelineItems.map((item, index) => {
              const IconComponent = iconMap[item.icon] || FileSearch;
              return (
                <div 
                  key={index}
                  className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 text-center"
                >
                  <IconComponent className="w-6 h-6 text-[#f5c242] mx-auto mb-2" strokeWidth={1.5} />
                  <p 
                    className="text-[#f5c242] font-medium text-sm mb-1"
                    style={{ textShadow: softShadow }}
                  >
                    {item.period}
                  </p>
                  <p className="text-white/90 text-xs font-light">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical Timeline - Mobile */}
        <div className="md:hidden w-full max-w-xs px-4">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#f5c242] via-[#f5c242]/50 to-transparent" />
            
            {/* Timeline Items */}
            <div className="space-y-4">
              {timelineItems.map((item, index) => {
                const IconComponent = iconMap[item.icon] || FileSearch;
                return (
                  <div key={index} className="relative flex gap-4">
                    {/* Numbered Circle on Line */}
                    <div className="w-8 h-8 rounded-full bg-[#f5c242] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 z-10 shadow-lg">
                      {item.number}
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-5 h-5 text-[#f5c242]" strokeWidth={1.5} />
                        <span 
                          className="text-[#f5c242] font-medium text-sm"
                          style={{ textShadow: softShadow }}
                        >
                          {item.period}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm font-light">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicTimelineSlide;
