import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, ShoppingBag, Coffee, Building } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";

const DizengoffNeighborhood = () => {
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
          src="/images/en/neighborhoods/dizengoff-hero.jpg"
          alt="דיזנגוף"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            דיזנגוף
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            הלב המסחרי התוסס - קניות, בידור ודופק העיר
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
                <Card className="p-6">
                  <ShoppingBag className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">קניות</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    דיזנגוף סנטר, בוטיקים יוקרתיים וחנויות מעצבים
                  </p>
                </Card>
                <Card className="p-6">
                  <Coffee className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">תרבות קפה</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    בתי קפה אייקוניים וכיכר דיזנגוף המפורסמת
                  </p>
                </Card>
                <Card className="p-6">
                  <Building className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">בידור</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    סינמטקים, תיאטראות ומרכזי תרבות מובילים
                  </p>
                </Card>
                <Card className="p-6">
                  <MapPin className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">מיקום מרכזי</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    קרבה לחוף הים, שוק הכרמל ושדרות רוטשילד
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
