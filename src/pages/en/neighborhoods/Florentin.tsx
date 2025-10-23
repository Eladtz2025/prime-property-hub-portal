import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";

const FlorentinNeighborhood = () => {
  const navigate = useNavigate();

  const properties = [
    {
      id: "4",
      title: "Industrial Loft Conversion",
      address: "Florentin Street 45",
      neighborhood: "Florentin",
      price: "₪8,000",
      priceLabel: "/month",
      size: 95,
      rooms: 2,
      bathrooms: 1,
      parking: false,
      imageUrl: "/images/en/properties/sunny-balcony.jpg",
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
          src="/images/en/neighborhoods/florentin-hero.jpg"
          alt="Florentin"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            Florentin
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            Tel Aviv's bohemian heart—street art, nightlife, and creative energy
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
                  Florentin emerged in the 1920s as a working-class neighborhood of artisans and
                  craftsmen. For decades, it remained Tel Aviv's gritty, overlooked quarter—home to
                  workshops, small factories, and immigrant families. But what establishment
                  overlooked, artists discovered.
                </p>
                <p>
                  In the 2000s, Florentin transformed into Tel Aviv's alternative culture capital.
                  Street artists claimed its walls, musicians filled its basements, and vintage
                  shops occupied its storefronts. The neighborhood became synonymous with creative
                  rebellion—a place where avant-garde galleries neighbor hookah bars, and graffiti
                  is considered legitimate art.
                </p>
                <p>
                  Today, Florentin pulses with youthful energy. Its streets come alive after dark
                  with underground clubs, craft cocktail bars, and late-night falafel stands.
                  Industrial lofts have become coveted addresses, yet the neighborhood retains its
                  raw, unpolished authenticity—Tel Aviv's perpetual counterculture.
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
                  { icon: Star, text: "Vibrant street art scene" },
                  { icon: Building2, text: "Industrial loft conversions" },
                  { icon: Coffee, text: "Alternative cafés and bars" },
                  { icon: Home, text: "Young, creative community" },
                  { icon: TrendingUp, text: "Affordable by TLV standards" },
                  { icon: MapPin, text: "Central-south location" },
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
                  "Levinsky Market - Spice and specialty foods",
                  "Street art walking tours",
                  "Underground music venues",
                  "Vintage clothing shops",
                  "Jaffa Flea Market - 10-minute walk",
                  "Rothschild Boulevard - 15-minute walk",
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
                  <p className="font-playfair text-xl font-bold">₪2.5M - ₪6M</p>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    Rentals: ₪6,000 - ₪12,000/mo
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Location</span>
                  </div>
                  <p className="font-montserrat text-sm">South-Central Tel Aviv</p>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    Adjacent to Neve Tzedek
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Property Types</span>
                  </div>
                  <p className="font-montserrat text-sm">Lofts, apartments, studios</p>
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

export default FlorentinNeighborhood;
