import slideBg from "@/assets/light-pitch/slide-06-listing.jpg";

interface LightPropertyListingSlideProps {
  propertyAddress?: string;
  propertyType?: string;
  overview?: string;
}

const LightPropertyListingSlide = ({
  propertyAddress = "110 Ben Yehuda Street, Tel Aviv-Yafo",
  propertyType = "Luxury Apartment",
  overview = "A stunning beachfront property in one of Tel Aviv's most sought-after locations. This exceptional residence offers panoramic Mediterranean views and premium finishes throughout.",
}: LightPropertyListingSlideProps) => {
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
        <div className="text-center">
          <span className="text-[#f5c242] text-sm tracking-widest uppercase mb-4 block">
            {propertyType}
          </span>
          
          <h2 className="text-2xl md:text-3xl font-serif font-light text-white mb-6">
            Property Listing
          </h2>
          
          <h3 className="text-xl md:text-2xl font-medium text-white mb-4">
            {propertyAddress}
          </h3>
          
          <div className="w-16 h-px bg-[#f5c242] mx-auto mb-6" />
          
          <p className="text-white/80 font-light leading-relaxed">
            {overview}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LightPropertyListingSlide;
