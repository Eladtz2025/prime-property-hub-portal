import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users } from "lucide-react";
import EnglishFooter from "@/components/en/Footer";

const FlorentinNeighborhood = () => {
  const navigate = useNavigate();

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
              onClick={() => navigate('/he/neighborhoods/florentin')}
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
          src="/images/en/neighborhoods/florentin-hero.jpg"
          alt="Florentin"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-4">
              Florentin
            </h1>
            <p className="font-montserrat text-lg text-white/90 max-w-2xl">
              Bohemian neighborhood with vibrant street art and nightlife
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
                Florentin is Tel Aviv's creative soul, a neighborhood where street art adorns nearly every wall and
                independent boutiques line the streets. Once an industrial area, it has transformed into the city's
                most bohemian district.
              </p>
              <p>
                Young artists, musicians, and creative professionals have made Florentin their home, creating a unique
                atmosphere that combines gritty urban edge with artistic expression. The neighborhood's bars and clubs
                make it the epicenter of Tel Aviv's nightlife.
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
                  <h3 className="font-bold mb-2">Street Art</h3>
                  <p className="text-sm text-muted-foreground">
                    Every corner features colorful murals and graffiti
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Coffee className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Young Vibe</h3>
                  <p className="text-sm text-muted-foreground">
                    Popular with young professionals and creatives
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TreePine className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Nightlife Hub</h3>
                  <p className="text-sm text-muted-foreground">
                    Bars, clubs, and live music venues
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Artistic Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Studios, galleries, and creative spaces
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
                  <h4 className="font-bold">Levinsky Market</h4>
                  <p className="text-sm text-muted-foreground">Spice market and authentic Middle Eastern eateries</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">HaTachana (The Station)</h4>
                  <p className="text-sm text-muted-foreground">Renovated train station with shops and restaurants</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Jaffa Flea Market</h4>
                  <p className="text-sm text-muted-foreground">Antiques, vintage finds, and eclectic treasures</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default FlorentinNeighborhood;
