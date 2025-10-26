interface RelizPropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: string;
  imageUrl: string;
  type?: string;
  onClick: () => void;
}

export const RelizPropertyCard = ({
  title,
  location,
  price,
  imageUrl,
  type,
  onClick,
}: RelizPropertyCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-[4/5] overflow-hidden cursor-pointer"
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />

      {/* Gradient Overlay */}
      <div className="reliz-card-overlay" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        {type && (
          <div className="font-montserrat text-xs tracking-widest uppercase text-white/80 mb-2">
            {type}
          </div>
        )}
        
        <h3 className="reliz-property-title mb-2">{title}</h3>
        
        <div className="flex items-center justify-between">
          <p className="font-montserrat text-sm text-white/70">{location}</p>
          <p className="font-playfair text-lg font-medium">{price}</p>
        </div>

        {/* Hover Line */}
        <div className="mt-4 h-px bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
      </div>
    </div>
  );
};
