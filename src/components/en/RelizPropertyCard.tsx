interface RelizPropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: string;
  imageUrl: string;
  type?: string;
  onClick: () => void;
  parking?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  yard?: boolean;
  balconyYardSize?: number;
}

export const RelizPropertyCard = ({
  title,
  location,
  price,
  imageUrl,
  type,
  onClick,
  parking,
  elevator,
  balcony,
  yard,
  balconyYardSize,
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

        {/* Features Badges */}
        {(parking || elevator || balcony || yard) && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {parking && (
              <div className="text-xs bg-white/20 text-white border border-white/30 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Parking
              </div>
            )}
            {elevator && (
              <div className="text-xs bg-white/20 text-white border border-white/30 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                Elevator
              </div>
            )}
            {balcony && (
              <div className="text-xs bg-white/20 text-white border border-white/30 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Balcony{balconyYardSize ? ` (${balconyYardSize}m²)` : ''}
              </div>
            )}
            {yard && (
              <div className="text-xs bg-white/20 text-white border border-white/30 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Yard{balconyYardSize && !balcony ? ` (${balconyYardSize}m²)` : ''}
              </div>
            )}
          </div>
        )}

        {/* Hover Line */}
        <div className="mt-4 h-px bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </div>
    </div>
  );
};
