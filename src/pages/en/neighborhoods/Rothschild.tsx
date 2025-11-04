import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";
import EnglishFooter from "@/components/en/Footer";

const RothschildNeighborhood = () => {
  const navigate = useNavigate();

  const properties = [
    {
      id: "1",
      title: "Luxury Bauhaus Apartment",
      address: "Rothschild Boulevard 45",
      neighborhood: "Rothschild",
      price: "₪12,000",
      priceLabel: "/month",
      size: 120,
      rooms: 3,
      bathrooms: 2,
      parking: true,
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
    },
    {
      id: "2",
      title: "Penthouse with Boulevard Views",
      address: "Rothschild Boulevard 78",
      neighborhood: "Rothschild",
      price: "₪8.5M",
      priceLabel: "",
      size: 180,
      rooms: 4,
      bathrooms: 3,
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
              onClick={() => navigate('/he/neighborhoods/rothschild')}
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
          src="/images/en/neighborhoods/rothschild-hero.jpg"
          alt="Rothschild Boulevard"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-4">
              Rothschild Boulevard
            </h1>
            <p className="font-montserrat text-lg text-white/90 max-w-2xl">
              The heart of Tel Aviv's Bauhaus architecture and cultural scene
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
                Rothschild Boulevard is one of Tel Aviv's most iconic streets, running through the heart of the White City.
                Built in the 1930s, it represents the pinnacle of Bauhaus architecture and is part of the UNESCO World
                Heritage Site.
              </p>
              <p>
                The boulevard is lined with mature trees, creating a shaded pedestrian path down the center. This unique
                design combines residential buildings with cultural institutions, cafés, and public spaces, making it a
                vibrant hub of city life.
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
                  <h3 className="font-bold mb-2">UNESCO Heritage</h3>
                  <p className="text-sm text-muted-foreground">
                    Home to the world's largest concentration of Bauhaus buildings
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TreePine className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Tree-lined Boulevard</h3>
                  <p className="text-sm text-muted-foreground">
                    Central pedestrian walkway with mature trees and benches
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Coffee className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Café Culture</h3>
                  <p className="text-sm text-muted-foreground">
                    Renowned cafés and restaurants line the boulevard
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Cultural Hub</h3>
                  <p className="text-sm text-muted-foreground">
                    Museums, galleries, and cultural institutions
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
                  <h4 className="font-bold">Independence Hall</h4>
                  <p className="text-sm text-muted-foreground">Historic site where Israel's independence was declared</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Habima Theatre</h4>
                  <p className="text-sm text-muted-foreground">National theatre of Israel</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Carmel Market</h4>
                  <p className="text-sm text-muted-foreground">Vibrant outdoor market with fresh produce and street food</p>
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

export default RothschildNeighborhood;
