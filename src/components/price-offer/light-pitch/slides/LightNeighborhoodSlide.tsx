import slideBg from "@/assets/light-pitch/slide-13-neighborhood.jpg";

const LightNeighborhoodSlide = () => {
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
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content Box */}
      <div className="relative z-10 bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-8 md:p-12 mx-4 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-6 text-center">
          The Neighborhood
        </h2>
        
        <p className="text-white/90 font-light leading-relaxed text-center mb-6">
          Ben Yehuda Street is the heart of Tel Aviv's beachfront lifestyle. 
          This iconic avenue offers an unmatched blend of urban convenience 
          and Mediterranean charm, with the beach just moments away.
        </p>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#f5c242]">2 min</div>
            <div className="text-xs text-white/60">to Beach</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#f5c242]">5 min</div>
            <div className="text-xs text-white/60">to Dizengoff</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#f5c242]">10 min</div>
            <div className="text-xs text-white/60">to Sarona</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightNeighborhoodSlide;
