import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { FlippablePropertyCard } from "@/components/he/FlippablePropertyCard";

const NewDevelopments = () => {
  const telAvivDevelopments = [
    {
      title: "מגדל רוטשילד",
      location: "תל אביב",
      price: "החל מ-₪12,000,000",
      imageUrl: "/images/developments/telaviv-rothschild-tower.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "נווה צדק רזידנסס",
      location: "תל אביב",
      price: "החל מ-₪8,500,000",
      imageUrl: "/images/developments/telaviv-neve-tzedek.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "דיזנגוף טאוור",
      location: "תל אביב",
      price: "החל מ-₪7,200,000",
      imageUrl: "/images/developments/telaviv-dizengoff-tower.jpg",
      type: "פרויקט חדש",
    },
  ];

  const herzliyaDevelopments = [
    {
      title: "הרצליה פיתוח מרינה",
      location: "הרצליה",
      price: "החל מ-₪9,500,000",
      imageUrl: "/images/developments/herzliya-marina.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "מגדלי הים",
      location: "הרצליה",
      price: "החל מ-₪8,800,000",
      imageUrl: "/images/developments/herzliya-sea-towers.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "פארק הרצליה",
      location: "הרצליה",
      price: "החל מ-₪7,900,000",
      imageUrl: "/images/developments/herzliya-park.jpg",
      type: "פרויקט חדש",
    },
  ];

  const philadelphiaDevelopments = [
    {
      title: "ריטנהאוס רזידנסס",
      location: "פילדלפיה",
      price: "החל מ-$1,200,000",
      imageUrl: "/images/developments/philadelphia-rittenhouse.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "סנטר סיטי טאוור",
      location: "פילדלפיה",
      price: "החל מ-$950,000",
      imageUrl: "/images/developments/philadelphia-center-city.jpg",
      type: "פרויקט חדש",
    },
    {
      title: "דלאוור ווטרפרונט",
      location: "פילדלפיה",
      price: "החל מ-$1,100,000",
      imageUrl: "/images/developments/philadelphia-delaware.jpg",
      type: "פרויקט חדש",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="rtl">
      <HebrewHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/hero-new-developments.jpg"
          alt="פרויקטים חדשים"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              פרויקטים חדשים
            </h1>
          </div>
        </div>
      </section>

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

      {/* Herzliya Developments */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
              הרצליה
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              יוקרה על חוף הים
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
              פילדלפיה
            </h2>
            <p className="font-montserrat text-sm text-muted-foreground tracking-widest uppercase">
              השקעה בארה"ב
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
      <HebrewFooter />
    </div>
  );
};

export default NewDevelopments;
