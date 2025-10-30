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
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/en/hero-telaviv.jpg"
          alt="Rental Properties"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              Rental Properties
            </h1>
          </div>
        </div>
      </section>

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
