import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
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
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/en/hero-telaviv.jpg"
          alt="Properties for Sale"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              Properties for Sale
            </h1>
          </div>
        </div>
      </section>

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

      <EnglishFooter />
    </div>
  );
};

export default EnglishSales;
