import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Heart, Coffee, Palette } from "lucide-react";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";

const NeveTzedekNeighborhood = () => {
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
          src="/images/en/neighborhoods/neve-tzedek-hero.jpg"
          alt="נווה צדק"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            נווה צדק
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            השכונה הראשונה של תל אביב - קסם היסטורי ואווירה בוהמית
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
                  נווה צדק, שנוסדה בשנת 1887, היא השכונה הראשונה של תל אביב והיא שומרת 
                  על קסמה ההיסטורי עד היום. הסמטאות הצרות, הבתים הנמוכים והחצרות הפנימיות 
                  יוצרים אווירה ייחודית המזכירת את התקופה העותומאנית.
                </p>
                <p>
                  השכונה עברה תהליך התחדשות עירונית מרשים בעשורים האחרונים והפכה למרכז 
                  תרבותי ואמנותי. כיום היא מארחת בוטיקים יוקרתיים, גלריות אמנות, תיאטראות 
                  ומסעדות גורמה, תוך שמירה על האופי ההיסטורי המיוחד שלה.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                אורח חיים
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <Palette className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">אמנות ותרבות</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    גלריות אמנות, תיאטרון סוזן דלל ומרכז האמנויות המפורסם
                  </p>
                </Card>
                <Card className="p-6">
                  <Coffee className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">קפה ומסעדות</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    מסעדות שף מובילות ובתי קפה בוטיק בסמטאות הקסומות
                  </p>
                </Card>
                <Card className="p-6">
                  <Heart className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">אווירה רומנטית</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    סמטאות אבן, בתים היסטוריים וחצרות פנימיות מקסימות
                  </p>
                </Card>
                <Card className="p-6">
                  <MapPin className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">קרבה לחוף</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    דקות הליכה מטיילת תל אביב והים התיכון
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
                    ₪5M - ₪15M
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">השכרות</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪10,000 - ₪30,000/חודש
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

export default NeveTzedekNeighborhood;
