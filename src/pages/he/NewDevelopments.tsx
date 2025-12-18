import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { FlippablePropertyCard } from "@/components/he/FlippablePropertyCard";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";

const NewDevelopments = () => {
  const telAvivDevelopments = [
    {
      title: "מגדל רוטשילד",
      location: "תל אביב",
      imageUrl: "/images/developments/telaviv-rothschild-tower.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "נווה צדק רזידנסס",
      location: "תל אביב",
      imageUrl: "/images/developments/telaviv-neve-tzedek.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "דיזנגוף טאוור",
      location: "תל אביב",
      imageUrl: "/images/developments/telaviv-dizengoff-tower.jpg",
      type: "פרויקט חדש",
    },
  ];

  const florentinDevelopments = [
    {
      title: "לופט תעשייתי פלורנטין",
      location: "פלורנטין",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      type: "פרויקט חדש",
    },
    {
      title: "בוטיק ארט פלורנטין",
      location: "פלורנטין",
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      type: "פרויקט חדש",
    },
    {
      title: "סטודיו גלריה",
      location: "פלורנטין",
      imageUrl: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80",
      type: "פרויקט חדש",
    },
  ];

  const neveTzedekDevelopments = [
    {
      title: "בית היסטורי משוחזר",
      location: "נווה צדק",
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      type: "פרויקט חדש",
    },
    {
      title: "וילה בוטיק נווה צדק",
      location: "נווה צדק",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      type: "פרויקט חדש",
    },
    {
      title: "דירת גן רומנטית",
      location: "נווה צדק",
      imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      type: "פרויקט חדש",
    },
  ];

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <title>פרויקטים חדשים - נכסים חדשים בתל אביב, פלורנטין ונווה צדק | City Market</title>
        <meta name="description" content="פרויקטי נדל&quot;ן חדשים ויוקרתיים בתל אביב, פלורנטין ונווה צדק. גלו דירות חדשות, פנטהאוזים ונכסי בוטיק בפרויקטים המובילים." />
        <meta property="og:title" content="פרויקטים חדשים - נכסים חדשים בתל אביב, פלורנטין ונווה צדק | City Market" />
        <meta property="og:description" content="פרויקטי נדל&quot;ן חדשים ויוקרתיים בתל אביב, פלורנטין ונווה צדק. גלו דירות חדשות, פנטהאוזים ונכסי בוטיק בפרויקטים המובילים." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket-properties.com/new-developments" />
      </Helmet>
      <HebrewHeader />

      <FullScreenHero
        title="פרויקטים חדשים"
        backgroundImage="/images/hero-new-developments.jpg"
        minHeight="100vh"
      />

      {/* Introduction */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              עתיד החיים המודרניים
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              חקרו את הפיתוחים החדשים המצופים ביותר של תל אביב. כל פרויקט מייצג 
              את פסגת העיצוב המודרני, אדריכלות בת קיימא ושירותים פרימיום.
            </p>
          </div>
        </div>
      </section>

      {/* Tel Aviv Developments */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              תל אביב
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              פרויקטים בלב העיר הלבנה
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
              פלורנטין
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              אורבני, יצירתי, צעיר
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
              נווה צדק
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              היסטוריה, יוקרה ורומנטיקה
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
      <HebrewFooter />
    </div>
  );
};

export default NewDevelopments;
