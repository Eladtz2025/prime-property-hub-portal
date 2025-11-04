import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";
import EnglishFooter from "@/components/en/Footer";

const NeveTzedekNeighborhood = () => {
  const navigate = useNavigate();

  const properties = [
    {
      id: "3",
      title: "Charming Restored Home",
      address: "Shabazi Street 12",
      neighborhood: "Neve Tzedek",
      price: "₪15,000",
      priceLabel: "/month",
      size: 140,
      rooms: 3,
      bathrooms: 2,
      parking: false,
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
    },
  ];

  return (
    <>
    <div className="min-h-screen english-luxury" dir="ltr">
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-background border-b">
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
          src="/images/en/neighborhoods/neve-tzedek-hero.jpg"
          alt="Neve Tzedek"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            Neve Tzedek
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            Tel Aviv's first neighborhood—where history meets artisan charm
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
                  Founded in 1887, Neve Tzedek is Tel Aviv's original neighborhood—predating the
                  city itself by 22 years. Its narrow cobblestone lanes and restored Ottoman-era
                  buildings tell the story of Jewish settlement outside Jaffa's ancient walls,
                  marking the birthplace of modern Tel Aviv.
                </p>
                <p>
                  Once neglected and nearly demolished, Neve Tzedek underwent a stunning renaissance
                  in the 1990s. Artists, designers, and visionaries transformed crumbling buildings
                  into boutique galleries, intimate theaters, and architectural showcases. Today,
                  it's Tel Aviv's most romantic quarter—a pedestrian-friendly village within the
                  metropolis.
                </p>
                <p>
                  Living in Neve Tzedek means morning pastries from artisan bakeries, afternoon
                  strolls through hidden courtyards, and evenings at the Suzanne Dellal Centre.
                  Every corner whispers history, yet pulses with contemporary creativity—a timeless
                  neighborhood that refuses to age.
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
                  { icon: Star, text: "Tel Aviv's first neighborhood (1887)" },
                  { icon: Building2, text: "Restored historic architecture" },
                  { icon: Coffee, text: "Boutique shops and galleries" },
                  { icon: Home, text: "Pedestrian-friendly streets" },
                  { icon: TrendingUp, text: "Premium real estate" },
                  { icon: MapPin, text: "Steps from the beach" },
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
                  "Suzanne Dellal Centre - Contemporary dance hub",
                  "Shabazi Street - Artisan boutiques and cafés",
                  "Rokach House Museum - Local heritage",
                  "Old Jaffa - Ancient port city",
                  "Tel Aviv Port - Modern waterfront",
                  "Frishman Beach - 5-minute walk",
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
    <EnglishFooter />
    </>
  );
};

export default NeveTzedekNeighborhood;
