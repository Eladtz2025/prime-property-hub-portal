import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";

const OldNorthNeighborhood = () => {
  const navigate = useNavigate();

  const properties = [
    {
      id: "6",
      title: "Family Bauhaus Apartment",
      address: "Ben Yehuda Street 34",
      neighborhood: "Old North",
      price: "₪3.8M",
      priceLabel: "",
      size: 110,
      rooms: 3,
      bathrooms: 2,
      parking: true,
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Back Button */}
      <div className="relative bg-background border-b">
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
          src="/images/en/neighborhoods/old-north-hero.jpg"
          alt="Old North"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            Old North
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            Quiet residential elegance with Bauhaus heritage and family appeal
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
                  The Old North (HaTzafon HaYashan) represents Tel Aviv's residential ideal—a quiet,
                  tree-lined neighborhood that balances central location with suburban tranquility.
                  Developed in the 1920s-1930s, it became home to Tel Aviv's emerging middle class
                  and intellectual elite.
                </p>
                <p>
                  The neighborhood's streets preserve exceptional examples of International Style
                  architecture, earning it UNESCO World Heritage status as part of the White City.
                  Unlike commercial Dizengoff or bohemian Florentin, Old North prioritized family
                  life—wide sidewalks, neighborhood parks, and residential buildings with shared
                  courtyards.
                </p>
                <p>
                  Today, Old North attracts families and professionals seeking quality of life
                  without sacrificing urban convenience. Its streets remain remarkably peaceful,
                  yet Gordon Beach is a 5-minute walk and Dizengoff's shops are around the corner.
                  It's Tel Aviv's best-kept secret—centrality with serenity.
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
                  { icon: Star, text: "UNESCO Bauhaus architecture" },
                  { icon: Building2, text: "Well-maintained buildings" },
                  { icon: Coffee, text: "Neighborhood cafés" },
                  { icon: Home, text: "Family-friendly atmosphere" },
                  { icon: TrendingUp, text: "Stable real estate" },
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
                  "Independence Park - Green spaces and sea views",
                  "Ben Yehuda Street - Shops and restaurants",
                  "Gordon Beach - Popular beach strip",
                  "Dizengoff Center - 10-minute walk",
                  "Tel Aviv Port - 15-minute walk",
                  "Yarkon Park - Jogging and cycling",
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
  );
};

export default OldNorthNeighborhood;
