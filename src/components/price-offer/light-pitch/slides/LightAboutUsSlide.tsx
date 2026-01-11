import slideBg from "@/assets/light-pitch/slide-03-about.jpg";

const LightAboutUsSlide = () => {
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
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content Box */}
      <div className="relative z-10 bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-8 md:p-12 mx-4 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-6 text-center">
          About Us
        </h2>
        
        <div className="space-y-6 text-white">
          <div className="text-center">
            <h3 className="text-xl font-medium text-[#f5c242] mb-2">Elad & Tali</h3>
            <p className="text-white/80 font-light">City Market Properties</p>
          </div>
          
          <p className="text-center text-white/90 font-light leading-relaxed">
            With over 15 years of combined experience in Tel Aviv's luxury real estate market, 
            we specialize in helping clients find their perfect property or achieve the best 
            possible outcome when selling.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#f5c242]">200+</div>
              <div className="text-sm text-white/70">Properties Sold</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#f5c242]">15+</div>
              <div className="text-sm text-white/70">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightAboutUsSlide;
