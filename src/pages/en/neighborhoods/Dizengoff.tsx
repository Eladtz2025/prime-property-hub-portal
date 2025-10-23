import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star } from "lucide-react";
import { PropertyCard } from "@/components/en/PropertyCard";

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
          src="/images/en/neighborhoods/dizengoff-hero.jpg"
          alt="Dizengoff"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            Dizengoff
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            Tel Aviv's commercial heartbeat—shopping, dining, and urban energy
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
                  Named after Tel Aviv's first mayor, Meir Dizengoff, this iconic street stretches
                  from the port in the north to Rothschild Boulevard in the south. Since the 1930s,
                  Dizengoff has been synonymous with urban Tel Aviv—the place where the city shops,
                  socializes, and celebrates.
                </p>
                <p>
                  Dizengoff Center, Israel's first indoor shopping mall (1985), became a cultural
                  landmark and social hub. The street itself evolved into a continuous strip of
                  fashion boutiques, design studios, and sidewalk cafés. By the 1990s, "sitting at
                  Dizengoff" meant people-watching at legendary cafés—a quintessential Tel Aviv
                  experience.
                </p>
                <p>
                  Today, Dizengoff represents Tel Aviv's vibrant urbanism. Living here means stepping
                  outside into the city's pulse—morning runs to Dizengoff Square, afternoon shopping
                  sprees, and evenings watching the promenade from balconies. It's metropolitan life
                  at its most Tel Avivian—energetic, diverse, and always in motion.
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
                  { icon: Star, text: "Dizengoff Center shopping mall" },
                  { icon: Building2, text: "Mix of Bauhaus and modern" },
                  { icon: Coffee, text: "Legendary café culture" },
                  { icon: Home, text: "Central urban location" },
                  { icon: TrendingUp, text: "Commercial hub" },
                  { icon: MapPin, text: "Walking to everywhere" },
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
                  "Dizengoff Square - Iconic fountain plaza",
                  "Dizengoff Center - Shopping and cinema",
                  "King George Street - Fashion and dining",
                  "Rabin Square - Events and memorials",
                  "Tel Aviv Museum of Art - 10-minute walk",
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
                  <p className="font-playfair text-xl font-bold">₪3M - ₪8M</p>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    Rentals: ₪7,000 - ₪15,000/mo
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Location</span>
                  </div>
                  <p className="font-montserrat text-sm">Central Tel Aviv</p>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    Main commercial artery
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-montserrat text-sm">Property Types</span>
                  </div>
                  <p className="font-montserrat text-sm">Urban apartments, commercial spaces</p>
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

export default DizengoffNeighborhood;
