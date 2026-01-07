import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star, TreePine, Users, ChevronRight } from "lucide-react";
import EnglishFooter from "@/components/en/Footer";
import EnglishHeader from "@/components/en/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema } from "@/components/seo/SchemaOrg";

const NeveTzedekNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <html lang="en" dir="ltr" />
        <title>Neve Tzedek - Tel Aviv's First Neighborhood | CITY MARKET Properties Luxury Real Estate</title>
        <meta name="description" content="Properties for sale and rent in Neve Tzedek. Historic charm, boutique shops, and bohemian atmosphere. Real estate experts in Tel Aviv's first neighborhood." />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/neighborhoods/neve-tzedek" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/neighborhoods/neve-tzedek" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "Neighborhoods", url: "https://www.ctmarketproperties.com/en/neighborhoods" },
        { name: "Neve Tzedek", url: "https://www.ctmarketproperties.com/en/neighborhoods/neve-tzedek" }
      ]} />
      <EnglishHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="Neve Tzedek"
        subtitle="Tel Aviv's first neighborhood, charming and artistic"
        backgroundImage="/images/en/neighborhoods/neve-tzedek-hero.jpg"
        minHeight="60vh"
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/en" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/en/neighborhoods" className="hover:text-primary transition-colors">Neighborhoods</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Neve Tzedek</span>
        </nav>
      </div>

      {/* History & Character */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">History & Character</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 1887, Neve Tzedek (Hebrew for "Oasis of Justice") is Tel Aviv's oldest neighborhood.
                Its narrow streets, low-rise buildings, and Mediterranean architecture create an intimate village
                atmosphere within the bustling city.
              </p>
              <p>
                Once neglected, Neve Tzedek has been lovingly restored and is now one of the city's most desirable
                areas. Artists, designers, and creative professionals have made it their home, filling the neighborhood
                with galleries, boutiques, and charming cafés.
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
                  <h3 className="font-bold mb-2">Historic Charm</h3>
                  <p className="text-sm text-muted-foreground">
                    Tel Aviv's first neighborhood, established in 1887
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Coffee className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Boutique Culture</h3>
                  <p className="text-sm text-muted-foreground">
                    Unique shops, galleries, and artisan boutiques
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TreePine className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Mediterranean Vibe</h3>
                  <p className="text-sm text-muted-foreground">
                    Narrow streets and restored historic buildings
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Artistic Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Home to artists, designers, and creative professionals
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
                  <h4 className="font-bold">Suzanne Dellal Center</h4>
                  <p className="text-sm text-muted-foreground">Dance and theater performances in a historic square</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Nahum Gutman Museum</h4>
                  <p className="text-sm text-muted-foreground">Museum dedicated to the famous Israeli artist</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-bold">Jaffa Port</h4>
                  <p className="text-sm text-muted-foreground">Historic port area, just a short walk away</p>
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

export default NeveTzedekNeighborhood;
