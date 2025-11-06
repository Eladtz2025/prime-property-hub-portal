import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Trees, Users, Home, ChevronLeft } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";

const OldNorthNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-row-reverse" aria-label="Breadcrumb" dir="rtl">
            <Link to="/" className="hover:text-primary transition-colors">
              דף הבית
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/neighborhoods" className="hover:text-primary transition-colors">
              שכונות
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">צפון הישן</span>
          </nav>
        </div>
      </div>

      <FullScreenHero
        title="צפון הישן"
        subtitle="שכונה שקטה ומשפחתית עם מורשת באוהאוס ושטחים ירוקים"
        backgroundImage="/images/en/neighborhoods/old-north-hero.jpg"
        minHeight="100vh"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                היסטוריה ואופי
              </h2>
              <div className="space-y-4 font-montserrat text-muted-foreground leading-relaxed">
                <p>
                  צפון הישן, שהוקמה בשנות ה-20 וה-30, היא אחת השכונות השקטות והמשפחתיות 
                  ביותר בתל אביב. השכונה מפורסמת באדריכלות הבאוהאוס המשומרת היטב שלה, 
                  הרחובות הרחבים והשטחים הירוקים הרבים.
                </p>
                <p>
                  השכונה מושכת משפחות צעירות, זוגות ואנשים המחפשים איזון בין חיי העיר 
                  התוססים לאווירה שקטה ונעימה. הקרבה לחוף הים, לפארקים ולבתי ספר מצוינים 
                  הופכים אותה למקום מושלם למגורים ארוכי טווח.
                </p>
                <p>
                  חיים בצפון הישן משמעותם בוקר שקט עם ריצה בפארק, צהריים במשחקייה עם 
                  הילדים, וערבים עם ארוחת משפחה. זו שכונה שמציעה את האיזון המושלם - 
                  קרוב לכל מה שתל אביב מציעה, אך רחוק מהרעש.
                </p>
              </div>
            </section>

            {/* תמונת רחוב */}
            <section>
              <img
                src="/images/neighborhoods/old-north-street.jpg"
                alt="רחוב בצפון הישן"
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
                loading="lazy"
              />
            </section>

            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                אורח חיים
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Users className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">ידידותי למשפחות</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    גנים, מגרשי משחקים ובתי ספר מובילים בסביבה
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Trees className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">שטחים ירוקים</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    פארקים, גנים ציבוריים ושדרות עצים מוצלות
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Home className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אדריכלות באוהאוס</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    בתים היסטוריים משוקמים בסגנון הבינלאומי
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קרבה לחוף</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    דקות הליכה מחופי הים ומהטיילת
                  </p>
                </Card>
              </div>
            </section>
          </div>

        </div>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default OldNorthNeighborhood;
