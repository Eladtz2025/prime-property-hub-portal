import slideBg from "@/assets/light-pitch/slide-09-factors.jpg";
import { AlertCircle, CheckCircle } from "lucide-react";

const factors = [
  { type: "limiting", text: "High floor without elevator backup" },
  { type: "limiting", text: "Street-facing balcony with traffic noise" },
  { type: "positive", text: "Recently renovated systems" },
  { type: "positive", text: "Premium building with doorman" },
];

const LightLimitingFactorsSlide = () => {
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
      
      {/* Content Box */}
      <div className="relative z-10 bg-[#8b7765]/90 backdrop-blur-sm rounded-lg p-8 md:p-12 mx-4 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-8 text-center">
          Property Considerations
        </h2>
        
        <div className="space-y-4">
          {factors.map((factor, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 text-white"
            >
              {factor.type === "limiting" ? (
                <AlertCircle className="w-5 h-5 text-[#e85c3a] mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-[#4a9a9a] mt-0.5 flex-shrink-0" />
              )}
              <span className="font-light">{factor.text}</span>
            </div>
          ))}
        </div>
        
        <p className="text-center text-white/70 font-light mt-8 text-sm">
          We believe in complete transparency about every property
        </p>
      </div>
    </div>
  );
};

export default LightLimitingFactorsSlide;
