import slideBg from "@/assets/light-pitch/slide-01-title.jpg";

interface LightTitleSlideProps {
  propertyAddress?: string;
  propertyCity?: string;
}

const LightTitleSlide = ({
  propertyAddress = "110 BEN YEHUDA STREET",
  propertyCity = "TEL AVIV-YAFO",
}: LightTitleSlideProps) => {
  return (
    <div 
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${slideBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-3 h-8 bg-[#4a9a9a] rounded-sm" />
              <div className="w-3 h-8 bg-[#f5c242] rounded-sm" />
              <div className="w-3 h-8 bg-[#e85c3a] rounded-sm" />
            </div>
            <span className="text-white text-xl font-light tracking-wider">
              City Market Properties
            </span>
          </div>
        </div>

        {/* Decorative Line */}
        <div className="w-24 h-px bg-[#f5c242] mb-8" />

        {/* Property Address */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-4 tracking-wide">
          {propertyAddress}
        </h1>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-white/80 tracking-widest">
          {propertyCity}
        </h2>

        {/* Bottom Decorative Line */}
        <div className="w-24 h-px bg-[#f5c242] mt-8" />
      </div>
    </div>
  );
};

export default LightTitleSlide;
