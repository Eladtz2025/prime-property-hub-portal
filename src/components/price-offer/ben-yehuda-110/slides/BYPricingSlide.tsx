interface BYPricingSlideProps {
  content?: {
    title?: string;
    priceInfo?: string;
  };
}

const BYPricingSlide = ({ content }: BYPricingSlideProps) => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Watermark Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5765.JPG')`,
          opacity: 0.8,
        }}
      />
      
      {/* Beige Overlay */}
      <div className="absolute inset-0 bg-[#d4c5b5]/30" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-16">
        {/* Section Label */}
        <p className="text-sm font-medium text-[#4a9a9a] tracking-[0.3em] mb-4">
          05 / 10
        </p>
        
        {/* Decorative Line */}
        <div className="w-16 h-px bg-[#f5c242] mb-8" />

        {/* Title */}
        <h2 className="text-3xl md:text-5xl font-serif font-light text-[#2d3b3a] mb-8">
          {content?.title || "PRICING & MARKET CONTEXT"}
        </h2>

        {/* Content Box */}
        <div className="bg-[#8b7765]/85 backdrop-blur-sm rounded-lg p-8 md:p-12 max-w-3xl">
          <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed">
            {content?.priceInfo || "Content coming soon..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYPricingSlide;
