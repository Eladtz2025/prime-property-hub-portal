import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { FlippablePropertyCard } from "@/components/en/FlippablePropertyCard";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema } from "@/components/seo/SchemaOrg";

const NewDevelopments = () => {
  const telAvivDevelopments = [
    {
      title: "Rothschild Tower",
      location: "Tel Aviv",
      imageUrl: "/images/developments/telaviv-rothschild-tower.jpg",
      type: "New Development",
    },
    {
      title: "Neve Tzedek Residences",
      location: "Tel Aviv",
      imageUrl: "/images/developments/telaviv-neve-tzedek.jpg",
      type: "New Development",
    },
    {
      title: "Dizengoff Tower",
      location: "Tel Aviv",
      imageUrl: "/images/developments/telaviv-dizengoff-tower.jpg",
      type: "New Development",
    },
  ];

  const florentinDevelopments = [
    {
      title: "Industrial Loft Florentin",
      location: "Florentin",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      type: "New Development",
    },
    {
      title: "Art Boutique Florentin",
      location: "Florentin",
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      type: "New Development",
    },
    {
      title: "Gallery Studio",
      location: "Florentin",
      imageUrl: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80",
      type: "New Development",
    },
  ];

  const neveTzedekDevelopments = [
    {
      title: "Restored Historic Home",
      location: "Neve Tzedek",
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      type: "New Development",
    },
    {
      title: "Boutique Villa Neve Tzedek",
      location: "Neve Tzedek",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      type: "New Development",
    },
    {
      title: "Romantic Garden Apartment",
      location: "Neve Tzedek",
      imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      type: "New Development",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <html lang="en" dir="ltr" />
        <title>New Developments - City Market Properties | Tel Aviv, Florentin & Neve Tzedek</title>
        <meta name="description" content="Explore luxury new developments in Tel Aviv, Florentin, and Neve Tzedek. Modern design, premium amenities, and prime locations." />
        <meta property="og:title" content="New Developments - City Market Properties" />
        <meta property="og:description" content="The future of modern living - luxury developments in Israel's top locations." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/new-developments" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/new-developments" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "New Developments", url: "https://www.ctmarketproperties.com/en/new-developments" }
      ]} />
      <EnglishHeader />

      <FullScreenHero
        title="New Developments"
        backgroundImage="/images/hero-new-developments.jpg"
        minHeight="100vh"
      />

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

      {/* Florentin Developments */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              Florentin
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              Urban, Creative, Young
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {florentinDevelopments.map((dev, idx) => (
              <FlippablePropertyCard key={idx} {...dev} />
            ))}
          </div>
        </div>
      </section>

      {/* Neve Tzedek Developments */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              Neve Tzedek
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              History, Luxury & Romance
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {neveTzedekDevelopments.map((dev, idx) => (
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
