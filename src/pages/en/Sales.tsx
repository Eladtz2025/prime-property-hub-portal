import Hero from "@/components/Hero";
import { PropertyCard } from "@/components/en/PropertyCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EnglishSales = () => {
  const navigate = useNavigate();

  const salesProperties = [
    {
      id: "s1",
      title: "Rothschild Villa",
      address: "Rothschild Boulevard, Tel Aviv",
      price: "₪8.5M",
      priceLabel: "",
      size: 250,
      rooms: 5,
      bathrooms: 4,
      parking: true,
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
    },
    {
      id: "s2",
      title: "Modern Penthouse with City Views",
      address: "Dizengoff Tower, Tel Aviv",
      price: "₪6.8M",
      priceLabel: "",
      size: 180,
      rooms: 4,
      bathrooms: 3,
      parking: true,
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
    },
    {
      id: "s3",
      title: "Bauhaus Gem on Bialik",
      address: "Bialik Street, Tel Aviv",
      price: "₪4.2M",
      priceLabel: "",
      size: 120,
      rooms: 3,
      bathrooms: 2,
      parking: true,
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <Hero
        title="Properties for Sale"
        subtitle="Your Investment in Tel Aviv's Future"
        description="From iconic Bauhaus architecture to contemporary design, discover exceptional properties in Israel's cultural capital"
        backgroundImage="/images/en/hero-telaviv.jpg"
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {salesProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onClick={() => navigate(`/en/property/${property.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Language Switcher */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/sales')}
          className="font-montserrat shadow-lg"
        >
          עברית
        </Button>
      </div>
    </div>
  );
};

export default EnglishSales;
