import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { FlippablePropertyCard } from "@/components/en/FlippablePropertyCard";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";

const NewDevelopments = () => {
  const developments = [
    {
      title: "Neve Tzedek Project",
      location: "Neve Tzedek, Tel Aviv",
      price: "From ₪8,500,000",
      imageUrl: "/images/en/neighborhoods/neve-tzedek.jpg",
      type: "New Development",
    },
    {
      title: "Rothschild Project",
      location: "Rothschild Boulevard, Tel Aviv",
      price: "From ₪12,000,000",
      imageUrl: "/images/en/neighborhoods/rothschild.jpg",
      type: "New Development",
    },
    {
      title: "Old North Project",
      location: "Old North, Tel Aviv",
      price: "From ₪9,000,000",
      imageUrl: "/images/en/neighborhoods/old-north.jpg",
      type: "New Development",
    },
    {
      title: "Florentin Project",
      location: "Florentin, Tel Aviv",
      price: "From ₪5,500,000",
      imageUrl: "/images/en/neighborhoods/florentin.jpg",
      type: "New Development",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>New Developments - City Market Properties | Tel Aviv</title>
        <meta name="description" content="Explore luxury new developments in Tel Aviv's most sought-after neighborhoods. Modern design, premium amenities, and prime locations." />
        <meta property="og:title" content="New Developments - City Market Properties" />
        <meta property="og:description" content="The future of modern living - luxury developments in Tel Aviv." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket.co.il/en/new-developments" />
      </Helmet>
      <EnglishHeader />

      <FullScreenHero
        title="New Developments"
        backgroundImage="/images/hero-new-developments.jpg"
        minHeight="100vh"
      />

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
              Projects in the leading neighborhoods
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {developments.map((dev, idx) => (
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
