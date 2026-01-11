import slideBg from "@/assets/light-pitch/slide-05-process.jpg";

const processSteps = [
  { number: "01", title: "Preparation", description: "Property assessment and staging" },
  { number: "02", title: "Marketing", description: "Professional photos and listings" },
  { number: "03", title: "Launch", description: "Multi-channel market exposure" },
  { number: "04", title: "Showings", description: "Qualified buyer tours" },
  { number: "05", title: "Closing", description: "Negotiation and deal closure" },
];

const LightSalesProcessSlide = () => {
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
      <div className="relative z-10 px-4 md:px-8 max-w-5xl w-full">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-8 text-center">
          Sales Process
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {processSteps.map((step) => (
            <div 
              key={step.number}
              className="bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-4 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-[#f5c242] mb-2">
                {step.number}
              </div>
              <h3 className="text-sm md:text-base font-medium text-white mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-white/60 font-light hidden md:block">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <p className="text-center text-white/80 font-light mt-8 text-sm md:text-base">
          Our tailored sales methodology designed to maximize your results
        </p>
      </div>
    </div>
  );
};

export default LightSalesProcessSlide;
