import EnglishHeader from "@/components/en/Header";
import { RelizPropertyCard } from "@/components/en/RelizPropertyCard";
import { useNavigate } from "react-router-dom";

const NewDevelopments = () => {
  const navigate = useNavigate();

  const developments = [
    {
      id: "dev-1",
      title: "Rothschild Tower",
      location: "Rothschild Boulevard",
      price: "From ₪12,000,000",
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
      type: "New Development",
    },
    {
      id: "dev-2",
      title: "Neve Tzedek Residences",
      location: "Neve Tzedek",
      price: "From ₪8,500,000",
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
      type: "New Development",
    },
    {
      id: "dev-3",
      title: "Mediterranean Heights",
      location: "Old North",
      price: "From ₪6,800,000",
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
      type: "New Development",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/hero-new-developments.jpg"
          alt="New Developments"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <p className="font-montserrat text-sm tracking-widest uppercase text-white/80 mb-4">
              Exclusive Projects
            </p>
            <h1 className="reliz-hero-title text-white">
              New Developments
            </h1>
            <p className="reliz-subtitle text-white/90 mt-6 max-w-2xl mx-auto">
              Discover Tel Aviv's most prestigious upcoming properties
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              The Future of Modern Living
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
               Explore Tel Aviv's most anticipated new developments. Each project represents 
              the pinnacle of modern design, sustainable architecture, and premium amenities.
            </p>
          </div>
        </div>
      </section>

      {/* Developments Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developments.map((dev) => (
              <RelizPropertyCard
                key={dev.id}
                {...dev}
                onClick={() => navigate(`/en/property/${dev.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              What Sets Us Apart
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              Development Features
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                Prime
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                Locations
              </p>
            </div>
            <div className="text-center">
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                Exclusive
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                Amenities
              </p>
            </div>
            <div className="text-center">
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                Premium
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                Finishes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-playfair text-2xl font-normal mb-4 tracking-wide">
                CITY MARKET
              </h3>
              <p className="font-montserrat text-sm text-background/70">
                 Real Estate
              </p>
            </div>
            <div>
              <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
                Quick Links
              </h4>
              <div className="space-y-2 font-montserrat text-sm text-background/70">
                <p className="cursor-pointer hover:text-background transition-colors">Home</p>
                <p className="cursor-pointer hover:text-background transition-colors">Buy</p>
                <p className="cursor-pointer hover:text-background transition-colors">Rent</p>
                <p className="cursor-pointer hover:text-background transition-colors">Neighborhoods</p>
              </div>
            </div>
            <div>
              <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
                Company
              </h4>
              <div className="space-y-2 font-montserrat text-sm text-background/70">
                <p className="cursor-pointer hover:text-background transition-colors">About Us</p>
                <p className="cursor-pointer hover:text-background transition-colors">Contact</p>
                <p className="cursor-pointer hover:text-background transition-colors">Blog</p>
              </div>
            </div>
            <div>
              <h4 className="font-montserrat text-sm tracking-widest uppercase mb-4">
                Contact
              </h4>
              <div className="space-y-2 font-montserrat text-sm text-background/70">
                <p>Tel Aviv, Israel</p>
                <p>info@citymarket.co.il</p>
                <p>+972-XX-XXXXXXX</p>
              </div>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center">
            <p className="font-montserrat text-sm text-background/70">
              © 2024 City Market Properties. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewDevelopments;
