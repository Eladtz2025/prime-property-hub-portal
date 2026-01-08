import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Coffee, Building2 } from "lucide-react";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const EnglishNeighborhoods = () => {
  const navigate = useNavigate();

  const neighborhoods = [
    {
      id: "rothschild",
      name: "Rothschild Boulevard",
      description: "The heart of Tel Aviv's Bauhaus architecture and cultural scene",
      imageUrl: "/images/en/neighborhoods/rothschild-hero.jpg",
      avgPrice: "₪4.5M - ₪12M",
      highlights: ["UNESCO Heritage", "Tree-lined boulevard", "Iconic cafés"],
    },
    {
      id: "neve-tzedek",
      name: "Neve Tzedek",
      description: "Tel Aviv's first neighborhood, charming and artistic",
      imageUrl: "/images/en/neighborhoods/neve-tzedek-hero.jpg",
      avgPrice: "₪5M - ₪15M",
      highlights: ["Historic charm", "Boutique shops", "Mediterranean vibe"],
    },
    {
      id: "florentin",
      name: "Florentin",
      description: "Bohemian neighborhood with vibrant street art and nightlife",
      imageUrl: "/images/en/neighborhoods/florentin-hero.jpg",
      avgPrice: "₪2.5M - ₪6M",
      highlights: ["Street art", "Young vibe", "Nightlife hub"],
    },
    {
      id: "old-north",
      name: "Old North",
      description: "Where calm living meets the heart of the city",
      imageUrl: "/images/en/neighborhoods/old-north-hero.jpg",
      avgPrice: "₪3.5M - ₪9M",
      highlights: ["Family-friendly", "Bauhaus gems", "Parks & green spaces"],
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>Tel Aviv Neighborhoods | City Market Real Estate</title>
        <meta name="description" content="Explore Tel Aviv's finest neighborhoods - Rothschild, Neve Tzedek, Florentin, and Old North. Find your perfect location in the White City. Contact us for expert guidance!" />
        <meta property="og:title" content="Tel Aviv Neighborhoods - City Market Properties" />
        <meta property="og:description" content="Discover Tel Aviv's most prestigious neighborhoods. Each area tells its own story." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/neighborhoods" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/neighborhoods" />
      <OrganizationSchema language="en" />
      <WebSiteSchema language="en" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "Neighborhoods", url: "https://www.ctmarketproperties.com/en/neighborhoods" }
      ]} />
      <EnglishHeader />

      <FullScreenHero
        title="Tel Aviv Neighborhoods"
        backgroundImage="/images/hero-neighborhoods.jpg"
        minHeight="100vh"
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              Where Will You Call Home?
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              Each neighborhood tells its own story. Find yours.
            </p>
          </div>

          <div className="relative px-16">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {neighborhoods.map((neighborhood) => (
                  <CarouselItem key={neighborhood.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card
                      className="group overflow-hidden border-0 shadow-card hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 h-full"
                      onClick={() => navigate(`/en/neighborhoods/${neighborhood.id}`)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={neighborhood.imageUrl}
                          alt={`${neighborhood.name} - ${neighborhood.description}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="font-playfair text-2xl font-bold mb-2">
                            {neighborhood.name}
                          </h3>
                          <p className="font-montserrat text-sm opacity-90">
                            {neighborhood.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <TrendingUp className="w-5 h-5" />
                          <span className="font-montserrat font-semibold">
                            {neighborhood.avgPrice}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {neighborhood.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="font-montserrat text-sm">{highlight}</span>
                            </div>
                          ))}
                        </div>

                        <Button 
                          className="w-full font-montserrat" 
                          variant="outline"
                          aria-label={`Explore ${neighborhood.name} neighborhood`}
                        >
                          Explore Neighborhood
                        </Button>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Why Choose Tel Aviv */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-foreground mb-4">
              Why Tel Aviv?
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              More than a city, it's a lifestyle
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Coffee className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-xl font-bold mb-2">Vibrant Culture</h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                World-class dining, art galleries, and nightlife
              </p>
            </div>
            <div className="text-center">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-xl font-bold mb-2">UNESCO Heritage</h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                Largest collection of Bauhaus architecture worldwide
              </p>
            </div>
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-xl font-bold mb-2">Mediterranean Lifestyle</h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                Beach culture meets urban sophistication
              </p>
            </div>
          </div>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default EnglishNeighborhoods;
