import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import { PropertyCard } from "@/components/en/PropertyCard";
import { useNavigate } from "react-router-dom";
import { Building2, Key, Shield, Clock } from "lucide-react";

const EnglishIndex = () => {
  const navigate = useNavigate();

  const featuredProperties = [
    {
      id: "1",
      title: "Luxury Bauhaus Apartment",
      address: "Rothschild Boulevard, Tel Aviv",
      price: "₪12,000",
      priceLabel: "/month",
      size: 120,
      rooms: 3,
      bathrooms: 2,
      parking: true,
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
    },
    {
      id: "2",
      title: "Modern Penthouse",
      address: "Dizengoff Street, Tel Aviv",
      price: "₪18,000",
      priceLabel: "/month",
      size: 150,
      rooms: 4,
      bathrooms: 3,
      parking: true,
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
    },
    {
      id: "3",
      title: "Charming Studio",
      address: "Florentin, Tel Aviv",
      price: "₪5,500",
      priceLabel: "/month",
      size: 45,
      rooms: 1,
      bathrooms: 1,
      parking: false,
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
    },
  ];

  const services = [
    {
      icon: <Key className="w-12 h-12 text-primary" />,
      title: "Rentals",
      description: "Find your perfect rental home in the heart of Tel Aviv. Curated selection of premium apartments and penthouses.",
    },
    {
      icon: <Building2 className="w-12 h-12 text-primary" />,
      title: "Sales",
      description: "Expert guidance for buyers and sellers. From Bauhaus gems to modern luxury, we navigate every transaction with precision.",
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: "Management",
      description: "Comprehensive property management services. Maximize your investment while we handle every detail.",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Hero Section */}
      <Hero
        title="City Market Properties"
        subtitle="From the Heart of White Tel Aviv to Your New Home"
        description="Leading real estate agency specializing in rentals, sales, and property management in Tel Aviv's most prestigious neighborhoods"
        backgroundImage="/images/en/hero-telaviv.jpg"
      >
        <div className="flex gap-4 justify-center mt-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/en/rentals')}
            className="font-montserrat font-semibold text-base px-8 hover:scale-105 transition-transform duration-300"
          >
            Browse Rentals
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/en/sales')}
            className="font-montserrat font-semibold text-base px-8 hover:scale-105 transition-transform duration-300"
          >
            View Sales
          </Button>
        </div>
      </Hero>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Services
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive real estate solutions tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-background p-8 rounded-lg shadow-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="font-playfair text-2xl font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="font-montserrat text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              Featured Properties
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              Handpicked selection of our finest listings
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onClick={() => navigate(`/en/property/${property.id}`)}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/en/rentals')}
              className="font-montserrat font-semibold px-8"
            >
              View All Properties
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-playfair text-4xl font-bold mb-2">24/7</h3>
              <p className="font-montserrat text-lg">Availability</p>
            </div>
            <div>
              <Building2 className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-playfair text-4xl font-bold mb-2">500+</h3>
              <p className="font-montserrat text-lg">Successful Deals</p>
            </div>
            <div>
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-playfair text-4xl font-bold mb-2">15+</h3>
              <p className="font-montserrat text-lg">Years of Experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Language Switcher */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="font-montserrat shadow-lg"
        >
          עברית
        </Button>
      </div>
    </div>
  );
};

export default EnglishIndex;
