import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, TrendingUp, Coffee, Building2, Home, Star } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";

const RothschildNeighborhood = () => {
  const navigate = useNavigate();

  const properties = [
    {
      id: "1",
      title: "דירת באוהאוס יוקרתית",
      address: "שדרות רוטשילד 45",
      neighborhood: "רוטשילד",
      price: "₪12,000",
      priceLabel: "/חודש",
      size: 120,
      rooms: 3,
      bathrooms: 2,
      parking: true,
      imageUrl: "/images/en/properties/luxury-rothschild.jpg",
    },
    {
      id: "2",
      title: "פנטהאוז עם נוף לשדרה",
      address: "שדרות רוטשילד 78",
      neighborhood: "רוטשילד",
      price: "₪8.5M",
      priceLabel: "",
      size: 180,
      rooms: 4,
      bathrooms: 3,
      parking: true,
      imageUrl: "/images/en/properties/modern-penthouse.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      
      {/* Back Button */}
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

      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src="/images/en/neighborhoods/rothschild-hero.jpg"
          alt="שדרות רוטשילד"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-4">
            שדרות רוטשילד
          </h1>
          <p className="font-montserrat text-xl text-white/90 max-w-2xl">
            לב אדריכלות הבאוהאוס של תל אביב - אתר מורשת עולמית של אונסק״ו
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* History & Character */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                היסטוריה ואופי
              </h2>
              <div className="space-y-4 font-montserrat text-muted-foreground leading-relaxed">
                <p>
                  שדרות רוטשילד, שהוקמה ב-1910, מייצגת את פסגת המורשת האדריכלית של תל אביב. 
                  השדרה, הקרויה על שם משפחת הבנקאים המפורסמת, משתרעת על פני 1.5 קילומטרים 
                  בלב העיר הלבנה, ומציגה את הריכוז הגדול ביותר בעולם של בניינים בסגנון הבינלאומי.
                </p>
                <p>
                  השדרה הפכה לשם נרדף לרנסנס התרבותי של תל אביב בשנות ה-30, כאשר 
                  אדריכלים יהודיים אירופאים הביאו את תנועת הבאוהאוס למזרח התיכון. 
                  כיום היא משלבת בצורה חלקה שימור היסטורי עם יוקרה מודרנית, ומארחת 
                  סטארט-אפים חדשניים, מסעדות המומלצות על ידי מישלן ובתי מגורים בלעדיים.
                </p>
                <p>
                  חיים ברוטשילד פירושם להתעורר לרשרוש עצי פיקוס בני מאה, קפה בוקר 
                  בבתי קפה אייקוניים, וטיולי ערב על פני חזיתות מוארות בסגנון הבינלאומי. 
                  זה המקום שבו העבר של תל אביב פוגש את עתידה - שכונה המכבדת מורשת 
                  ומאמצת חדשנות.
                </p>
              </div>
            </section>

            {/* Lifestyle */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                אורח חיים
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <Coffee className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">תרבות קפה</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    בתי קפה אייקוניים ומסעדות עטורות פרסים לאורך כל השדרה
                  </p>
                </Card>
                <Card className="p-6">
                  <Building2 className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">אדריכלות באוהאוס</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    בתים בסגנון הבינלאומי המשוקמים היטב עם חזיתות מקוריות
                  </p>
                </Card>
                <Card className="p-6">
                  <Home className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">מרכז עסקים</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    ליבת סצנת הסטארט-אפים והיזמות של תל אביב
                  </p>
                </Card>
                <Card className="p-6">
                  <Star className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">אירועים תרבותיים</h3>
                  <p className="font-montserrat text-sm text-muted-foreground">
                    פסטיבלים שנתיים, שווקי אמנות ואירועי רחוב
                  </p>
                </Card>
              </div>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
                שירותים וגישה
              </h2>
              <div className="space-y-4 font-montserrat text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">תחבורה ציבורית:</span> 
                    {" "}גישה מצוינת לאוטובוסים, שתי תחנות רכבת קלה, ורכבת העיר העתידית
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">קניות:</span> 
                    {" "}שדרות רוטשילד ושוק הכרמל הסמוכים מציעים מגוון מותגים ייחודיים
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">פארקים:</span> 
                    {" "}השדרה עצמה משמשת כפארק עירוני עם שבילי אופניים וספסלי ישיבה
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">חינוך:</span> 
                    {" "}בתי ספר יסודיים ותיכוניים מובילים ברדיוס הליכה
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
              <h3 className="font-playfair text-2xl font-bold mb-6">
                מחירים ממוצעים
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">מכירות</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪4.5M - ₪12M
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-1">השכרות</div>
                  <div className="font-playfair text-2xl font-bold text-primary">
                    ₪8,000 - ₪25,000/חודש
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">סוג נכסים:</span>
                  <span className="font-semibold">דירות באוהאוס</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">גודל ממוצע:</span>
                  <span className="font-semibold">80-180 מ״ר</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">אוכלוסייה:</span>
                  <span className="font-semibold">מעורבת, מקצועית</span>
                </div>
              </div>
            </Card>

            {/* תמונת השדרה */}
            <Card className="p-0 overflow-hidden">
              <img
                src="/images/neighborhoods/rothschild-boulevard.jpg"
                alt="שדרות רוטשילד"
                className="w-full h-[250px] object-cover"
                loading="lazy"
              />
            </Card>

            <Card className="p-6">
              <h3 className="font-playfair text-xl font-bold mb-4">אטרקציות קרובות</h3>
              <div className="space-y-3">
                {[
                  "אנדרטת עצמאות ישראל",
                  "בית ראשונים - מוזיאון",
                  "שוק נחלת בנימין - שוק אמנים",
                  "שוק הכרמל - שוק אוכל",
                  "מרכז סוזן דלל - מחול",
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

export default RothschildNeighborhood;
