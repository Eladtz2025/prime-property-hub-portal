import DynamicSlideWrapper from './DynamicSlideWrapper';

interface DynamicGenericSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicGenericSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicGenericSlideProps) => {
  const title = (data?.title as string) || '';
  const content = (data?.content as string) || (data?.description as string) || '';

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Title */}
        {title && (
          <h2 
            className="text-3xl md:text-5xl font-bold text-white mb-8"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
          >
            {title}
          </h2>
        )}
        
        {/* Content */}
        {content && (
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-8 max-w-2xl">
            <p className="text-white text-lg whitespace-pre-line">{content}</p>
          </div>
        )}
        
        {/* Show raw data for debugging in development */}
        {!title && !content && (
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-8 max-w-2xl">
            <pre className="text-white text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicGenericSlide;
