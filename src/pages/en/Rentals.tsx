import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import Hero from "@/components/Hero";
import { PropertyCard } from "@/components/en/PropertyCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EnglishRentals = () => {
  const navigate = useNavigate();

  const rentalProperties = [
    {
      id: "1",
      title: "Bauhaus Apartment",
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
    {
      id: "4",
      title: "Sunny 2BR with Balcony",
      address: "Neve Tzedek, Tel Aviv",
      price: "₪15,000",
      priceLabel: "/month",
      size: 95,
      rooms: 2,
      bathrooms: 2,
      parking: true,
      imageUrl: "/images/en/properties/sunny-balcony.jpg",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />
      <Hero
        title="Rental Properties"
        subtitle="Find Your Perfect Home"
        description="Curated selection of premium rental apartments and penthouses in Tel Aviv's most sought-after neighborhoods"
        backgroundImage="/images/en/hero-telaviv.jpg"
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rentalProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onClick={() => navigate(`/en/property/${property.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default EnglishRentals;
