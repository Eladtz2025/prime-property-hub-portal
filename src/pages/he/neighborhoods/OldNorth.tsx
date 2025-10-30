import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Trees, Users, Home } from "lucide-react";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";

const OldNorthNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HebrewHeader />
      
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/neighborhoods")}
            className="font-montserrat"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה לשכונות
          </Button>
        </div>
      </div>

      <div className="relative h-[60vh] overflow-hidden">
        <img
          src="/images/en/neighborhoods/old-north-hero.jpg"
          alt="צפון הישן"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            צפון הישן
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            שכונה שקטה ומשפחתית עם מורשת באוהאוס ושטחים ירוקים
          </p>
        </div>
      </div>

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
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                אורח חיים
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <Users className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">ידידותי למשפחות</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    גנים, מגרשי משחקים ובתי ספר מובילים בסביבה
                  </p>
                </Card>
                <Card className="p-6">
                  <Trees className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">שטחים ירוקים</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    פארקים, גנים ציבוריים ושדרות עצים מוצלות
                  </p>
                </Card>
                <Card className="p-6">
                  <Home className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">אדריכלות באוהאוס</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    בתים היסטוריים משוקמים בסגנון הבינלאומי
                  </p>
                </Card>
                <Card className="p-6">
                  <MapPin className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">קרבה לחוף</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    דקות הליכה מחופי הים ומהטיילת
                  </p>
                </Card>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-6">
              <h3 className="font-playfair text-2xl font-bold mb-6">
                מחירים ממוצעים
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">מכירות</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪3.5M - ₪9M
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">השכרות</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪7,000 - ₪16,000/חודש
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" onClick={() => navigate("/contact")}>
                קבעו צפייה
              </Button>
            </Card>
          </div>
        </div>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default OldNorthNeighborhood;
