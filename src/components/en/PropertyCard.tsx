import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, MapPin, Ruler, BedDouble, Bath, Car } from "lucide-react";

interface PropertyCardProps {
  id: string;
  title: string;
  address: string;
  price: string;
  priceLabel: string;
  size?: number;
  rooms?: number;
  bathrooms?: number;
  parking?: boolean;
  imageUrl: string;
  onClick: () => void;
}

export const PropertyCard = ({
  title,
  address,
  price,
  priceLabel,
  size,
  rooms,
  bathrooms,
  parking,
  imageUrl,
  onClick,
}: PropertyCardProps) => {
  return (
    <Card className="group overflow-hidden border-0 shadow-card hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-playfair text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <div className="flex items-center text-muted-foreground gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-montserrat text-sm">{address}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-playfair text-3xl font-bold text-primary">
            {price}
          </span>
          <span className="font-montserrat text-sm text-muted-foreground">
            {priceLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-muted-foreground">
          {size && (
            <div className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4" />
              <span className="font-montserrat text-sm">{size}m²</span>
            </div>
          )}
          {rooms && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4" />
              <span className="font-montserrat text-sm">{rooms} BR</span>
            </div>
          )}
          {bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4" />
              <span className="font-montserrat text-sm">{bathrooms} BA</span>
            </div>
          )}
          {parking && (
            <div className="flex items-center gap-1.5">
              <Car className="w-4 h-4" />
              <span className="font-montserrat text-sm">Parking</span>
            </div>
          )}
        </div>

        <Button 
          onClick={onClick}
          className="w-full font-montserrat font-medium transition-all duration-300 hover:scale-105"
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};
