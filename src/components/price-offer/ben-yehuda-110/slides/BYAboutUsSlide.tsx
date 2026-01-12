interface BYAboutUsSlideProps {
  content?: {
    title?: string;
    description?: string;
  };
}

const BYAboutUsSlide = ({ content }: BYAboutUsSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 py-16">
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-serif font-light text-white mb-8"
          style={{ textShadow: softShadow }}
        >
          {content?.title || "ABOUT US"}
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-white mb-8" />

        {/* Content Box */}
        <div className="bg-[#8b7765]/85 backdrop-blur-sm rounded-lg p-8 md:p-12 max-w-3xl">
          <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed">
            {content?.description || "Content coming soon..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYAboutUsSlide;
