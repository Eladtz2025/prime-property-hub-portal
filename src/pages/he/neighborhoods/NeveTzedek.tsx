import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Heart, Coffee, Palette, Building2, Star, ChevronLeft } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";
import HebrewHeader from "@/components/he/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";

const NeveTzedekNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <HebrewHeader />

      <FullScreenHero
        title="נווה צדק"
        subtitle="השכונה הראשונה של תל אביב - קסם היסטורי ואווירה בוהמית"
        backgroundImage="/images/en/neighborhoods/neve-tzedek-hero.jpg"
        minHeight="100vh"
      />

      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs 
          items={[
            { label: "שכונות", href: "/he/neighborhoods" },
            { label: "נווה צדק", href: "/he/neighborhoods/neve-tzedek" }
          ]} 
        />
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
                <p>
                  מגורים בנווה צדק משמעותם בוקר עם מאפים ארטיזניים, צהריים עם טיול בחצרות 
                  נסתרות, וערבים במרכז סוזן דלל. כל פינה לוחשת היסטוריה אך פועמת עם יצירתיות 
                  עכשווית - שכונה נצחית שמסרבת להזדקן.
                </p>
              </div>
            </section>

            {/* תמונת רחוב */}
            <section>
              <img
                src="/images/neighborhoods/neve-tzedek-street.jpg"
                alt="רחוב בנווה צדק"
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
                    <Palette className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אמנות ותרבות</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    גלריות אמנות, תיאטרון סוזן דלל ומרכז האמנויות המפורסם
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Coffee className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קפה ומסעדות</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    מסעדות שף מובילות ובתי קפה בוטיק בסמטאות הקסומות
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אווירה רומנטית</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    סמטאות אבן, בתים היסטוריים וחצרות פנימיות מקסימות
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קרבה לחוף</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    דקות הליכה מטיילת תל אביב והים התיכון
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

export default NeveTzedekNeighborhood;
