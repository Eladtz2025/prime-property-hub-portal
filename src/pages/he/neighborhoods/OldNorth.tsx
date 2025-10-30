import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Trees, Users, Home } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";

const OldNorthNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      
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
                מידע מהיר
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">מחירים ממוצעים</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪3.5M - ₪9M
                  </div>
                  <div className="text-sm text-muted-foreground">
                    השכרה: ₪7,000 - ₪16,000/חודש
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">מיקום</div>
                  <div className="font-montserrat text-sm">צפון תל אביב</div>
                  <div className="text-sm text-muted-foreground">מבן יהודה עד יבנה</div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">סוגי נכסים</div>
                  <div className="font-montserrat text-sm">דירות משפחתיות, בתים פרטיים</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-playfair text-xl font-bold mb-4">אטרקציות קרובות</h3>
              <div className="space-y-3">
                {[
                  "פארק הירקון - פארק עירוני גדול",
                  "נמל תל אביב - בילוי ומסעדות",
                  "חוף הילטון - חוף פופולרי",
                  "שוק שרונה - שוק גורמה",
                  "בתי ספר מצוינים",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <span className="font-montserrat text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default OldNorthNeighborhood;
