import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users } from "lucide-react";
import EnglishFooter from "@/components/en/Footer";
import FullScreenHero from "@/components/FullScreenHero";

const RothschildNeighborhood = () => {
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
              onClick={() => navigate('/he/neighborhoods/rothschild')}
              className="gap-2"
            >
              עברית
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <FullScreenHero
        title="Rothschild Boulevard"
        subtitle="The heart of Tel Aviv's Bauhaus architecture and cultural scene"
        backgroundImage="/images/en/neighborhoods/rothschild-hero.jpg"
        minHeight="60vh"
      />

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

      <EnglishFooter />
    </div>
  );
};

export default RothschildNeighborhood;
