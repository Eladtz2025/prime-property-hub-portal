import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Ruler, BedDouble, Bath, Car, Calendar, TrendingUp } from "lucide-react";

const EnglishPropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock property data - in a real app, fetch based on id
  const property = {
    id: id || "1",
    title: "Luxury Bauhaus Apartment",
    address: "Rothschild Boulevard 45, Tel Aviv",
    neighborhood: "Rothschild",
    price: "₪12,000",
    priceLabel: "/month",
    size: 120,
    rooms: 3,
    bathrooms: 2,
    parking: true,
    floor: 3,
    yearBuilt: 1934,
    yearRenovated: 2023,
    description: "This sun-drenched 3-bedroom sanctuary features soaring ceilings, original Bauhaus details, and a private terrace overlooking vibrant Rothschild Boulevard. Wake up to morning coffee with views of century-old Ficus trees. Meticulously renovated while preserving architectural integrity, this home combines historic charm with modern luxury.",
    features: [
      "Original Bauhaus architectural elements",
      "High ceilings (3.2m)",
      "Private terrace with boulevard views",
      "Central A/C and heating",
      "Smart home system",
      "Storage room",
      "Secured building with elevator",
      "Walking distance to cafés and culture",
    ],
    images: [
      "/images/en/properties/luxury-rothschild.jpg",
      "/images/en/properties/bauhaus-bedroom.jpg",
      "/images/en/properties/sunny-balcony.jpg",
    ],
  };

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Back Button */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="font-montserrat"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="aspect-[4/3] overflow-hidden rounded-lg">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="grid grid-rows-2 gap-4">
            {property.images.slice(1).map((img, index) => (
              <div key={index} className="aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src={img}
                  alt={`${property.title} ${index + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Location */}
            <div>
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
                {property.title}
              </h1>
              <div className="flex items-center text-muted-foreground gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                <span className="font-montserrat text-lg">{property.address}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-playfair text-4xl font-bold text-primary">
                  {property.price}
                </span>
                <span className="font-montserrat text-xl text-muted-foreground">
                  {property.priceLabel}
                </span>
              </div>
            </div>

            {/* Key Details */}
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ruler className="w-5 h-5" />
                    <span className="font-montserrat text-sm">Size</span>
                  </div>
                  <p className="font-playfair text-2xl font-bold">{property.size}m²</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BedDouble className="w-5 h-5" />
                    <span className="font-montserrat text-sm">Bedrooms</span>
                  </div>
                  <p className="font-playfair text-2xl font-bold">{property.rooms}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bath className="w-5 h-5" />
                    <span className="font-montserrat text-sm">Bathrooms</span>
                  </div>
                  <p className="font-playfair text-2xl font-bold">{property.bathrooms}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="w-5 h-5" />
                    <span className="font-montserrat text-sm">Parking</span>
                  </div>
                  <p className="font-playfair text-2xl font-bold">
                    {property.parking ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Description */}
            <div>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-4">
                About This Property
              </h2>
              <p className="font-montserrat text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-4">
                Features & Amenities
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="font-montserrat text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <Card className="p-6 bg-muted/30">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Built</span>
                  </div>
                  <p className="font-playfair text-xl font-semibold">{property.yearBuilt}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Renovated</span>
                  </div>
                  <p className="font-playfair text-xl font-semibold">{property.yearRenovated}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Floor</span>
                  </div>
                  <p className="font-playfair text-xl font-semibold">{property.floor}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Contact */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4 shadow-lg">
              <h3 className="font-playfair text-2xl font-bold text-foreground mb-4">
                Interested?
              </h3>
              <p className="font-montserrat text-muted-foreground mb-6">
                Contact us to schedule a viewing or get more information about this property.
              </p>
              <div className="space-y-3">
                <Button className="w-full font-montserrat font-semibold" size="lg">
                  Schedule Viewing
                </Button>
                <Button
                  className="w-full font-montserrat font-semibold"
                  variant="outline"
                  size="lg"
                >
                  Contact Agent
                </Button>
                <Button
                  className="w-full font-montserrat font-semibold"
                  variant="ghost"
                  size="lg"
                >
                  Save Property
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h4 className="font-playfair font-bold mb-3">Property ID</h4>
                <p className="font-montserrat text-sm text-muted-foreground">#{property.id}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="font-montserrat shadow-lg"
        >
          עברית
        </Button>
      </div>
    </div>
  );
};

const Building = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

export default EnglishPropertyDetail;
