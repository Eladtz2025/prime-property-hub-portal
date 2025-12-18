import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, ShoppingBag, Coffee, Building, ChevronLeft } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";
import HebrewHeader from "@/components/he/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";

const DizengoffNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <HebrewHeader />

      <FullScreenHero
        title="דיזנגוף"
        subtitle="הלב המסחרי התוסס - קניות, בידור ודופק העיר"
        backgroundImage="/images/en/neighborhoods/dizengoff-hero.jpg"
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
                  רחוב דיזנגוף, שנקרא על שם מאיר דיזנגוף ראש העיר הראשון של תל אביב, 
                  הוא אחד הרחובות המפורסמים והתוססים ביותר בעיר. השכונה שמסביבו היא 
                  מרכז מסחרי, תרבותי ובידורי מרכזי.
                </p>
                <p>
                  כיום דיזנגוף ידועה בחנויות האופנה, בתי הקפה המפורסמים, הגלריות 
                  והמסעדות המובילות. השכונה משלבת אדריכלות באוהאוס מתחילת המאה ה-20 
                  עם מבנים מודרניים, ויוצרת אווירה עירונית דינמית וקוסמופוליטית.
                </p>
                <p>
                  חיים בדיזנגוף משמעותם להיות במרכז הפעילות - קפה בוקר בכיכר, קניות 
                  אחר הצהריים במותגים הטובים ביותר, וערבים בסינמטק או במסעדות גורמה. 
                  זו שכונה שלא ישנה לעולם.
                </p>
              </div>
            </section>

            {/* תמונת רחוב */}
            <section>
              <img
                src="/images/neighborhoods/dizengoff-street.jpg"
                alt="רחוב דיזנגוף"
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
                    <ShoppingBag className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קניות</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    דיזנגוף סנטר, בוטיקים יוקרתיים וחנויות מעצבים
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Coffee className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">תרבות קפה</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    בתי קפה אייקוניים וכיכר דיזנגוף המפורסמת
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <Building className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">בידור</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    סינמטקים, תיאטראות ומרכזי תרבות מובילים
                  </p>
                </Card>
                <Card className="p-6" dir="rtl">
                  <div className="flex items-center gap-3 flex-row-reverse mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">מיקום מרכזי</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    קרבה לחוף הים, שוק הכרמל ושדרות רוטשילד
                  </p>
                </Card>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-playfair text-2xl font-bold mb-6">
                מידע מהיר
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">מחירים ממוצעים</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪3M - ₪8M
                  </div>
                  <div className="text-sm text-muted-foreground">
                    השכרה: ₪6,000 - ₪15,000/חודש
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">מיקום</div>
                  <div className="font-montserrat text-sm">מרכז תל אביב</div>
                  <div className="text-sm text-muted-foreground">צומת דיזנגוף-גורדון</div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">סוגי נכסים</div>
                  <div className="font-montserrat text-sm">דירות באוהאוס ובניינים מודרניים</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-playfair text-xl font-bold mb-4">אטרקציות קרובות</h3>
              <div className="space-y-3">
                {[
                  "דיזנגוף סנטר - מרכז קניות",
                  "כיכר דיזנגוף - אייקון תרבותי",
                  "מוזיאון תל אביב לאמנות",
                  "שוק הכרמל - שוק מסורתי",
                  "חוף גורדון - חוף ים פופולרי",
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

export default DizengoffNeighborhood;
