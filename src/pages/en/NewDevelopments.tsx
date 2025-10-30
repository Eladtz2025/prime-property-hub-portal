import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { FlippablePropertyCard } from "@/components/en/FlippablePropertyCard";

const NewDevelopments = () => {
  const telAvivDevelopments = [
    {
      title: "Rothschild Tower",
      location: "Tel Aviv",
      price: "From ₪12,000,000",
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
      type: "New Development",
    },
    {
      title: "Neve Tzedek Residences",
      location: "Tel Aviv",
      price: "From ₪8,500,000",
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
      type: "New Development",
    },
    {
      title: "Dizengoff Tower",
      location: "Tel Aviv",
      price: "From ₪7,200,000",
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
      type: "New Development",
    },
  ];

  const herzliyaDevelopments = [
    {
      title: "Herzliya Marina",
      location: "Herzliya",
      price: "From ₪9,500,000",
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
      type: "New Development",
    },
    {
      title: "Sea Towers",
      location: "Herzliya",
      price: "From ₪8,800,000",
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
      type: "New Development",
    },
    {
      title: "Herzliya Park",
      location: "Herzliya",
      price: "From ₪7,900,000",
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
      type: "New Development",
    },
  ];

  const philadelphiaDevelopments = [
    {
      title: "Rittenhouse Residences",
      location: "Philadelphia",
      price: "From $1,200,000",
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
      type: "New Development",
    },
    {
      title: "Center City Tower",
      location: "Philadelphia",
      price: "From $950,000",
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
      type: "New Development",
    },
    {
      title: "Delaware Waterfront",
      location: "Philadelphia",
      price: "From $1,100,000",
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
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
            New Developments
          </h1>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-background">
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

      {/* Tel Aviv Developments */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              Tel Aviv
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              Projects in the heart of the White City
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {telAvivDevelopments.map((dev, idx) => (
              <FlippablePropertyCard key={idx} {...dev} />
            ))}
          </div>
        </div>
      </section>

      {/* Herzliya Developments */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              Herzliya
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              Luxury by the sea
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {herzliyaDevelopments.map((dev, idx) => (
              <FlippablePropertyCard key={idx} {...dev} />
            ))}
          </div>
        </div>
      </section>

      {/* Philadelphia Developments */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              Philadelphia
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              Investment in the USA
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {philadelphiaDevelopments.map((dev, idx) => (
              <FlippablePropertyCard key={idx} {...dev} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <EnglishFooter />
    </div>
  );
};

export default NewDevelopments;
