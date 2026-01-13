import DynamicSlideWrapper from './DynamicSlideWrapper';

interface TimelineStep {
  week: string;
  action: string;
}

interface DynamicTimelineSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicTimelineSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicTimelineSlideProps) => {
  const title = (data?.title as string) || (language === 'he' ? 'ציר הזמן' : 'Timeline');
  const steps = (data?.steps as TimelineStep[]) || [];

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-12 text-center"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto w-full">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/20 rounded-full hidden md:block" />
          <div 
            className="absolute top-6 left-0 h-1 bg-[#f5c242] rounded-full hidden md:block transition-all duration-500"
            style={{ width: '100%' }}
          />
          
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Dot */}
                <div className="h-12 w-12 rounded-full bg-[#f5c242] flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-[#2d3b3a] font-bold">{index + 1}</span>
                </div>
                
                {/* Content */}
                <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-[#f5c242] font-semibold mb-1">{step.week}</p>
                  <p className="text-white text-sm">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicTimelineSlide;
