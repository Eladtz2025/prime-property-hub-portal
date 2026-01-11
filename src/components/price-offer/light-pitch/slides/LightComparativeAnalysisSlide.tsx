import slideBg from "@/assets/light-pitch/slide-11-analysis.jpg";

const comparisons = [
  { property: "This Property", price: "$13,889/sqm", size: "180 sqm", highlight: true },
  { property: "Nearby Sale A", price: "$14,200/sqm", size: "165 sqm", highlight: false },
  { property: "Nearby Sale B", price: "$13,500/sqm", size: "200 sqm", highlight: false },
  { property: "Area Average", price: "$14,000/sqm", size: "-", highlight: false },
];

const LightComparativeAnalysisSlide = () => {
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
      <div className="relative z-10 px-4 md:px-8 max-w-3xl w-full">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-8 text-center">
          Comparative Analysis
        </h2>
        
        <div className="bg-[#8b7765]/80 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-white/10">
            <div className="bg-[#8b7765] p-3 text-center text-white/70 text-sm font-medium">Property</div>
            <div className="bg-[#8b7765] p-3 text-center text-white/70 text-sm font-medium">Price/sqm</div>
            <div className="bg-[#8b7765] p-3 text-center text-white/70 text-sm font-medium">Size</div>
          </div>
          
          {comparisons.map((item, index) => (
            <div 
              key={index}
              className={`grid grid-cols-3 gap-px ${item.highlight ? 'bg-[#f5c242]/20' : 'bg-white/5'}`}
            >
              <div className={`p-3 text-center ${item.highlight ? 'text-[#f5c242] font-medium' : 'text-white'}`}>
                {item.property}
              </div>
              <div className={`p-3 text-center ${item.highlight ? 'text-[#f5c242] font-medium' : 'text-white'}`}>
                {item.price}
              </div>
              <div className={`p-3 text-center ${item.highlight ? 'text-[#f5c242] font-medium' : 'text-white'}`}>
                {item.size}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-center text-white/70 font-light mt-6 text-sm">
          Based on recent transactions in the Ben Yehuda area
        </p>
      </div>
    </div>
  );
};

export default LightComparativeAnalysisSlide;
