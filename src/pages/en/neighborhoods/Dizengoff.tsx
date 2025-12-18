import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users, ChevronRight } from "lucide-react";
import EnglishFooter from "@/components/en/Footer";
import EnglishHeader from "@/components/en/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";

const DizengoffNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="Dizengoff"
        subtitle="Bustling commercial heart with shopping and entertainment"
        backgroundImage="/images/en/neighborhoods/dizengoff-hero.jpg"
        minHeight="60vh"
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/en" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/en/neighborhoods" className="hover:text-primary transition-colors">Neighborhoods</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Dizengoff</span>
        </nav>
      </div>

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

      <EnglishFooter />
    </div>
  );
};

export default DizengoffNeighborhood;
