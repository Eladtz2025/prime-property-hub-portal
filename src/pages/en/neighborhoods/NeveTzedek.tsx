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
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";

const NeveTzedekNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <html lang="en" dir="ltr" />
        <title>Neve Tzedek | Tel Aviv Luxury Real Estate</title>
        <meta name="description" content="Properties for sale and rent in Neve Tzedek. Historic charm, boutique shops, galleries, and bohemian atmosphere. Real estate experts in Tel Aviv's first neighborhood. Contact us!" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/neighborhoods/neve-tzedek" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/neighborhoods/neve-tzedek" />
      <OrganizationSchema language="en" />
      <WebSiteSchema language="en" />
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
        backgroundAlt="Historic stone alley with restored buildings in Neve Tzedek Tel Aviv"
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

      {/* Internal Links Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
            Properties in Neve Tzedek
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              to="/en/sales" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Properties for Sale
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/en/rentals" 
              className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Properties for Rent
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/en/about" 
              className="inline-flex items-center gap-2 px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              About City Market
            </Link>
          </div>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default NeveTzedekNeighborhood;
