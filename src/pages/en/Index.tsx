import EnglishHeader from "@/components/en/Header";
import VideoHero from "@/components/en/VideoHero";
import { RelizPropertyCard } from "@/components/en/RelizPropertyCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Award, Users } from "lucide-react";

const EnglishIndex = () => {
  const navigate = useNavigate();

  const featuredProperties = [
    {
      id: "1",
      title: "Rothschild Penthouse",
      location: "Rothschild Boulevard",
      price: "₪8,500,000",
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
      type: "For Sale",
    },
    {
      id: "2",
      title: "Bauhaus Apartment",
      location: "Dizengoff Street",
      price: "₪12,000/mo",
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
      type: "For Rent",
    },
    {
      id: "3",
      title: "Modern Villa",
      location: "Neve Tzedek",
      price: "₪15,000,000",
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
      type: "For Sale",
    },
    {
      id: "4",
      title: "Sunny Terrace Flat",
      location: "Old North",
      price: "₪10,500/mo",
      imageUrl: "/images/en/properties/sunny-balcony.jpg",
      type: "For Rent",
    },
  ];

  const neighborhoods = [
    {
      id: "rothschild",
      name: "Rothschild",
      image: "/images/en/neighborhoods/rothschild.jpg",
    },
    {
      id: "neve-tzedek",
      name: "Neve Tzedek",
      image: "/images/en/neighborhoods/neve-tzedek.jpg",
    },
    {
      id: "florentin",
      name: "Florentin",
      image: "/images/en/neighborhoods/florentin.jpg",
    },
    {
      id: "dizengoff",
      name: "Dizengoff",
      image: "/images/en/neighborhoods/dizengoff.jpg",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />

      {/* Hero Section */}
      <VideoHero
        title="WELCOME. HOME."
        subtitle="Find your ideal home. Explore our exclusive listings."
        imageUrl="/images/en/hero-telaviv-bauhaus-morning.jpg"
      />

      {/* About Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              City Market – Real Estate
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed mb-8">
              At <strong>City Market Real Estate</strong>, we offer personalized service to
              guide you through every step of the real estate journey. We help you find the
              perfect property and finalize the sales agreement, ensuring a smooth and rewarding
              experience.
            </p>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              Whether you are buying your dream home or investing in premium real estate, our
              dedicated team is here to make the process seamless, professional, and tailored to
              your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              Handpicked For You
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              Featured Properties
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredProperties.map((property) => (
              <RelizPropertyCard
                key={property.id}
                {...property}
                onClick={() => navigate(`/en/property/${property.id}`)}
              />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/en/sales")}
              className="reliz-button"
            >
              View All Properties
            </button>
          </div>
        </div>
      </section>

      {/* Neighborhoods Guide */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              Discover Tel Aviv
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              Neighborhoods Guide
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {neighborhoods.map((neighborhood) => (
              <div
                key={neighborhood.id}
                onClick={() => navigate(`/en/neighborhoods/${neighborhood.id}`)}
                className="group relative aspect-[3/4] overflow-hidden cursor-pointer"
              >
                <img
                  src={neighborhood.image}
                  alt={neighborhood.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-center p-8">
                  <h3 className="font-playfair text-3xl font-normal text-white tracking-wide">
                    {neighborhood.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/en/neighborhoods")}
              className="reliz-button"
            >
              Explore All Neighborhoods
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                15+ Years
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                Of Excellence
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                500+
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                Successful Deals
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                24/7
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                Availability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                Get In Touch
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
                Let&apos;s Find Your Dream Home
              </h2>
              <p className="font-montserrat text-lg text-muted-foreground">
                Contact us today to schedule a viewing or learn more about our exclusive properties.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                />
              </div>
              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="Phone"
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                />
                <textarea
                  placeholder="Message"
                  rows={4}
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none"
                />
              </div>
            </div>

            <div className="text-center mt-8">
              <button className="reliz-button">
                Send Message
              </button>
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
              © 2024 City Market Real Estate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnglishIndex;
