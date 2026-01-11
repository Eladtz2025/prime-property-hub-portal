import slideBg from "@/assets/light-pitch/slide-10-grid.jpg";

const gridItems = [
  "Gourmet Kitchen",
  "Master Suite",
  "Home Office",
  "Smart Home System",
  "Designer Finishes",
  "Private Terrace",
];

const LightFeaturesGridSlide = () => {
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
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 px-4 md:px-8 max-w-4xl w-full">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-8 text-center">
          Premium Features
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gridItems.map((item, index) => (
            <div 
              key={index}
              className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 text-center border border-white/10"
            >
              <span className="text-[#f5c242] text-sm font-medium block mb-2">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-white font-light">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightFeaturesGridSlide;
