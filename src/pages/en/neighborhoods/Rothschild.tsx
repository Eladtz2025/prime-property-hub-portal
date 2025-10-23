import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";

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
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Back Button */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/en/neighborhoods")}
            className="font-montserrat"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Neighborhoods
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src="/images/en/neighborhoods/rothschild-hero.jpg"
          alt="Rothschild Boulevard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            Rothschild Boulevard
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            The heart of Tel Aviv's UNESCO World Heritage Bauhaus architecture
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* History & Character */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                History & Character
              </h2>
              <div className="space-y-4 font-montserrat text-muted-foreground leading-relaxed">
                <p>
                  Established in 1910, Rothschild Boulevard represents the pinnacle of Tel Aviv's
                  architectural heritage. Named after the famous banking family, this tree-lined
                  boulevard stretches 1.5 kilometers through the heart of the White City, featuring
                  the world's largest concentration of International Style buildings.
                </p>
                <p>
                  The boulevard became synonymous with Tel Aviv's cultural renaissance in the 1930s,
                  when European Jewish architects brought the Bauhaus movement to the Middle East.
                  Today, it seamlessly blends historic preservation with modern luxury, hosting
                  innovative startups, Michelin-recommended restaurants, and exclusive residences.
                </p>
                <p>
                  Living on Rothschild means waking up to the rustling of century-old Ficus trees,
                  morning coffee at iconic cafés, and evening strolls past illuminated International
                  Style facades. It's where Tel Aviv's past meets its future—a neighborhood that
                  honors heritage while embracing innovation.
                </p>
              </div>
            </section>

            {/* Key Features */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                Neighborhood Highlights
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Star, text: "UNESCO World Heritage Site" },
                  { icon: Building2, text: "Bauhaus architectural gems" },
                  { icon: Coffee, text: "Iconic cafés and restaurants" },
                  { icon: Home, text: "Central Tel Aviv location" },
                  { icon: TrendingUp, text: "High investment value" },
                  { icon: MapPin, text: "Walking distance to beaches" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <feature.icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-montserrat text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Nearby Attractions */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                Nearby Attractions
              </h2>
              <div className="space-y-3">
                {[
                  "Independence Hall - Historic declaration site",
                  "Habima Theatre - Israel's national theater",
                  "Dizengoff Center - Shopping and entertainment",
                  "Carmel Market - Vibrant local market",
                  "Tel Aviv Museum of Art - 5-minute walk",
                  "Gordon Beach - 15-minute walk",
                ].map((attraction, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="font-montserrat text-muted-foreground">{attraction}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Available Properties */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                Available Properties
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    {...property}
                    onClick={() => navigate(`/en/property/${property.id}`)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4 shadow-lg">
              <h3 className="font-playfair text-2xl font-bold text-foreground mb-4">
                Quick Facts
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Average Prices</span>
                  </div>
                  <p className="font-playfair text-xl font-bold">₪4.5M - ₪12M</p>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    Rentals: ₪10,000 - ₪25,000/mo
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Location</span>
                  </div>
                  <p className="font-montserrat text-sm">Central Tel Aviv</p>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    District 1 - The White City
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Property Types</span>
                  </div>
                  <p className="font-montserrat text-sm">Bauhaus apartments, penthouses, villas</p>
                </div>

                <div className="pt-6 border-t">
                  <Button className="w-full font-montserrat font-semibold" size="lg">
                    View All Properties
                  </Button>
                </div>
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

export default RothschildNeighborhood;
