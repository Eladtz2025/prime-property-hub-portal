import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import VideoHero from "@/components/en/VideoHero";
import { RelizPropertyCard } from "@/components/en/RelizPropertyCard";
import { useNavigate } from "react-router-dom";
import { Award, TrendingUp, Users } from "lucide-react";

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
        imageUrl="/images/en/hero-last-one.png"
      />

      {/* About Section */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              City Market Properties
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed mb-8">
              At <strong>City Market Properties</strong>, we offer personalized service to
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
      <section className="py-8 bg-muted/30">
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
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              Discover Tel Aviv
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
              Tel Aviv is a vibrant and diverse city, where each neighborhood tells its own unique story. 
              From the bohemian atmosphere of Neve Tzedek to the youthful energy of Florentin, from the 
              elegance of Rothschild Boulevard to the rich culture of Dizengoff - every corner offers a 
              different experience. Discover the perfect neighborhood for you, one that perfectly matches 
              your lifestyle and dreams. Come explore with us the colorful mosaic of Tel Aviv.
            </p>
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
      <section className="py-8 bg-muted/30">
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
      <section className="py-8 bg-background">
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
      <EnglishFooter />
    </div>
  );
};

export default EnglishIndex;
