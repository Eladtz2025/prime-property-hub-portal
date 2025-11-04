import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Music, Palette, Users } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";

const FlorentinNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/neighborhoods")}
            className="font-montserrat flex items-center gap-2 flex-row-reverse"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה לשכונות</span>
          </Button>
        </div>
      </div>

      <div className="relative h-[60vh] overflow-hidden">
        <img
          src="/images/en/neighborhoods/florentin-hero.jpg"
          alt="פלורנטין"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            פלורנטין
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            השכונה הבוהמית - אמנות רחוב, חיי לילה ואנרגיה צעירה
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
                  פלורנטין הוקמה בשנות ה-20 והיא ידועה כאחת השכונות הצעירות והתוססות ביותר 
                  בתל אביב. במשך שנים רבות שימשה כשכונת עובדים, אך בעשורים האחרונים עברה 
                  תהליך התחדשות מרשים והפכה למרכז תרבותי ואמנותי.
                </p>
                <p>
                  השכונה מפורסמת באמנות הרחוב המרשימה שלה, הבארים והמועדונים התוססים, 
                  והאווירה הבוהמית הייחודית. זו שכונה שמושכת אמנים, מוזיקאים, סטודנטים 
                  וצעירים שמחפשים חווית חיים אותנטית ודינמית.
                </p>
                <p>
                  חיים בפלורנטין משמעותם להקיץ לאמנות רחוב צבעונית, בראנץ׳ בקפה וינטג׳, 
                  ולילות שמסתיימים בשעות הבוקר המוקדמות. זו שכונה עם נשמה אמיתית - 
                  מקום שבו כל קיר מספר סיפור וכל פינה מזמינה להיכנס.
                </p>
              </div>
            </section>

            {/* תמונת רחוב */}
            <section>
              <img
                src="/images/neighborhoods/florentin-street.jpg"
                alt="רחוב בפלורנטין"
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
                    <h3 className="font-playfair text-xl font-bold">אמנות רחוב</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    ציורי קיר מרהיבים וגרפיטי אמנותי בכל פינה
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Music className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">חיי לילה</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    ברים, מועדונים ומקומות בילוי עד השעות הקטנות
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Users className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קהילה צעירה</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    אווירה דינמית של אמנים, סטודנטים ויזמים צעירים
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">מיקום מרכזי</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    קרבה לשוק הכרמל, נווה צדק ותחנת הרכבת המרכזית
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

export default FlorentinNeighborhood;
