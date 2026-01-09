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

const FlorentinNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <html lang="en" dir="ltr" />
        <title>Florentin Tel Aviv | Urban Real Estate</title>
        <meta name="description" content="Properties for sale and rent in Florentin Tel Aviv. Street art, vibrant nightlife, and young creative vibe. Real estate experts in Tel Aviv's most vibrant neighborhood. Contact us!" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/neighborhoods/florentin" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/neighborhoods/florentin" />
      <OrganizationSchema language="en" />
      <WebSiteSchema language="en" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "Neighborhoods", url: "https://www.ctmarketproperties.com/en/neighborhoods" },
        { name: "Florentin", url: "https://www.ctmarketproperties.com/en/neighborhoods/florentin" }
      ]} />
      <EnglishHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="Florentin"
        subtitle="Bohemian neighborhood with vibrant street art and nightlife"
        backgroundImage="/images/en/neighborhoods/florentin-hero.jpg"
        backgroundAlt="Colorful street art and graffiti murals in Florentin neighborhood Tel Aviv"
        minHeight="100vh"
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/en" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/en/neighborhoods" className="hover:text-primary transition-colors">Neighborhoods</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Florentin</span>
        </nav>
      </div>

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

      {/* Internal Links Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
            Properties in Florentin
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

export default FlorentinNeighborhood;
