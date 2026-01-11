import slideBg from "@/assets/light-pitch/slide-02-contents.jpg";

const tableOfContentsItems = [
  "About Us",
  "Our Services",
  "Sales Process",
  "Property Listing",
  "Property Details",
  "Property Features",
  "Limiting Factors",
  "Comparative Analysis",
  "Neighborhood Lifestyle",
  "The Neighborhood",
  "Contact Info",
];

const LightTableOfContentsSlide = () => {
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
      <div className="relative z-10 bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-8 md:p-12 mx-4 max-w-lg">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-8 text-center">
          Table of Contents
        </h2>
        
        <ul className="space-y-3">
          {tableOfContentsItems.map((item, index) => (
            <li key={index} className="flex items-center gap-4 text-white">
              <span className="text-[#f5c242] text-sm font-medium">
                {String(index + 3).padStart(2, '0')}
              </span>
              <span className="text-lg font-light">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LightTableOfContentsSlide;
