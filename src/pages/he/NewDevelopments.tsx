import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { FlippablePropertyCard } from "@/components/he/FlippablePropertyCard";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";

const NewDevelopments = () => {
  const developments = [
    {
      title: "פרויקט נווה צדק",
      location: "נווה צדק, תל אביב",
      price: "החל מ-₪8,500,000",
      imageUrl: "/images/en/neighborhoods/neve-tzedek.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "פרויקט רוטשילד",
      location: "שדרות רוטשילד, תל אביב",
      price: "החל מ-₪12,000,000",
      imageUrl: "/images/en/neighborhoods/rothschild.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "פרויקט הצפון הישן",
      location: "הצפון הישן, תל אביב",
      price: "החל מ-₪9,000,000",
      imageUrl: "/images/en/neighborhoods/old-north.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "פרויקט פלורנטין",
      location: "פלורנטין, תל אביב",
      price: "החל מ-₪5,500,000",
      imageUrl: "/images/en/neighborhoods/florentin.jpg",
      type: "פרויקט חדש",
    },
  ];

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <title>פרויקטים חדשים - סיטי מרקט נדל"ן | תל אביב</title>
        <meta name="description" content="גלו פרויקטים חדשים בשכונות המבוקשות של תל אביב. עיצוב מודרני, אמנות גבוהה ומיקומים מעולים." />
        <meta property="og:title" content="פרויקטים חדשים - סיטי מרקט נדל״ן" />
        <meta property="og:description" content="העתיד של המגורים המודרניים - פרויקטים יוקרתיים בתל אביב." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket.co.il/he/new-developments" />
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
              העתיד של המגורים המודרניים
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              גלו את הפרויקטים החדשים והמבוקשים ביותר בתל אביב. כל פרויקט מייצג 
              את שיא העיצוב המודרני, אדריכלות בת-קיימא ואמנויות פרימיום.
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
              פרויקטים בשכונות המובילות
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
      <HebrewFooter />
    </div>
  );
};

export default NewDevelopments;
