import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { RelizPropertyCard } from "@/components/en/RelizPropertyCard";
import { useNavigate } from "react-router-dom";

const NewDevelopments = () => {
  const navigate = useNavigate();

  const developments = [
    {
      id: "dev-1",
      title: "מגדל רוטשילד",
      location: "שדרות רוטשילד",
      price: "החל מ-₪12,000,000",
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
      type: "פרויקט חדש",
    },
    {
      id: "dev-2",
      title: "נווה צדק רזידנסס",
      location: "נווה צדק",
      price: "החל מ-₪8,500,000",
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
      type: "פרויקט חדש",
    },
    {
      id: "dev-3",
      title: "רמות הים התיכון",
      location: "צפון הישן",
      price: "החל מ-₪6,800,000",
      imageUrl: "/images/en/properties/bauhaus-bedroom.jpg",
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
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>
              פרויקטים חדשים
            </h1>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-24 bg-background">
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

      {/* Developments Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developments.map((dev) => (
              <RelizPropertyCard
                key={dev.id}
                {...dev}
                onClick={() => navigate(`/property/${dev.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              מה מייחד אותנו
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              מאפייני הפיתוח
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                מיקומים
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                מובחרים
              </p>
            </div>
            <div className="text-center">
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                שירותים
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                בלעדיים
              </p>
            </div>
            <div className="text-center">
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                גימורים
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                פרימיום
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HebrewFooter />
    </div>
  );
};

export default NewDevelopments;
