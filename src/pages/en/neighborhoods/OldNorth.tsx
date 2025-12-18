import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users } from "lucide-react";
import EnglishFooter from "@/components/en/Footer";
import EnglishHeader from "@/components/en/Header";
import FullScreenHero from "@/components/FullScreenHero";

const OldNorthNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="Old North"
        subtitle="Quiet residential area with Bauhaus heritage and family appeal"
        backgroundImage="/images/en/neighborhoods/old-north-hero.jpg"
        minHeight="100vh"
      />

      {/* History & Character */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">History & Character</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Old North (Tzafon HaYashan) is one of Tel Aviv's most charming residential neighborhoods. Established
                in the 1920s, it features tree-lined streets, beautiful Bauhaus buildings, and a peaceful, family-friendly
                atmosphere.
              </p>
              <p>
                The neighborhood offers a perfect balance - quiet residential streets yet close to the beach, Dizengoff
                Center, and the city's cultural institutions. Many of its buildings have been carefully preserved,
                making it a living museum of Bauhaus architecture.
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
                  <h3 className="font-bold mb-2">Family-Friendly</h3>
                  <p className="text-sm text-muted-foreground">
                    Safe, quiet streets perfect for families
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Coffee className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Bauhaus Gems</h3>
                  <p className="text-sm text-muted-foreground">
                    Well-preserved examples of Bauhaus architecture
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TreePine className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Parks & Green Spaces</h3>
                  <p className="text-sm text-muted-foreground">
                    Nordau Boulevard and nearby parks
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Close to Everything</h3>
                  <p className="text-sm text-muted-foreground">
                    Beach, shopping, culture all nearby
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
                  <h4 className="font-bold">Nordau Beach</h4>
                  <p className="text-sm text-muted-foreground">Family-friendly beach with lifeguards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Yarkon Park</h4>
                  <p className="text-sm text-muted-foreground">Tel Aviv's largest park, perfect for recreation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Independence Hall</h4>
                  <p className="text-sm text-muted-foreground">Historic museum and cultural landmark</p>
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

export default OldNorthNeighborhood;
