import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";
import EnglishFooter from "@/components/en/Footer";

const DizengoffNeighborhood = () => {
  const navigate = useNavigate();

  const properties = [
    {
      id: "5",
      title: "Modern City Apartment",
      address: "Dizengoff Street 123",
      neighborhood: "Dizengoff",
      price: "₪3.2M",
      priceLabel: "",
      size: 85,
      rooms: 2,
      bathrooms: 1,
      parking: true,
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/en/neighborhoods')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Neighborhoods
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/he/neighborhoods/dizengoff')}
              className="gap-2"
            >
              עברית
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[40vh] overflow-hidden">
        <img
          src="/images/en/neighborhoods/dizengoff-hero.jpg"
          alt="Dizengoff"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-4">
              Dizengoff
            </h1>
            <p className="font-montserrat text-lg text-white/90 max-w-2xl">
              Bustling commercial heart with shopping and entertainment
            </p>
          </div>
        </div>
      </section>

      {/* History & Character */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">History & Character</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Dizengoff Street is Tel Aviv's main commercial artery, running north from the city center to the port area.
                Named after the city's first mayor, Meir Dizengoff, the street embodies the energy and vitality that
                defines modern Tel Aviv.
              </p>
              <p>
                From Dizengoff Center's shopping mall to the trendy cafés and restaurants that line the street, this
                neighborhood is always buzzing with activity. It's where locals come to shop, dine, and experience the
                pulse of city life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhood Highlights */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-8">Neighborhood Highlights</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <Building2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Shopping District</h3>
                  <p className="text-sm text-muted-foreground">
                    Dizengoff Center and countless boutiques and shops
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Coffee className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Café Culture</h3>
                  <p className="text-sm text-muted-foreground">
                    Iconic cafés where Tel Aviv's culture was born
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TreePine className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Dizengoff Square</h3>
                  <p className="text-sm text-muted-foreground">
                    Central plaza with Dizengoff Fountain
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">City Pulse</h3>
                  <p className="text-sm text-muted-foreground">
                    Always active, day and night
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Attractions */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-8">Nearby Attractions</h2>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Dizengoff Center</h4>
                  <p className="text-sm text-muted-foreground">Tel Aviv's first shopping mall, now renovated</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Frishman Beach</h4>
                  <p className="text-sm text-muted-foreground">Popular beach just minutes away</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Tel Aviv Museum of Art</h4>
                  <p className="text-sm text-muted-foreground">World-class art museum nearby</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Properties */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-8 text-center">Available Properties</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} {...property} onClick={() => navigate(`/en/property/${property.id}`)} />
            ))}
          </div>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default DizengoffNeighborhood;
