import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, TrendingUp, Coffee, Building2, Home, Star, ChevronLeft } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";
import HebrewHeader from "@/components/he/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";

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
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <HebrewHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="שדרות רוטשילד"
        subtitle='לב אדריכלות הבאוהאוס של תל אביב - אתר מורשת עולמית של אונסק״ו'
        backgroundImage="/images/en/neighborhoods/rothschild-hero.jpg"
        minHeight="100vh"
      />

      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs 
          items={[
            { label: "שכונות", href: "/he/neighborhoods" },
            { label: "שדרות רוטשילד", href: "/he/neighborhoods/rothschild" }
          ]} 
        />
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
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Coffee className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">תרבות קפה</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    בתי קפה אייקוניים ומסעדות עטורות פרסים לאורך כל השדרה
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אדריכלות באוהאוס</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    בתים בסגנון הבינלאומי המשוקמים היטב עם חזיתות מקוריות
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Home className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">מרכז עסקים</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    ליבת סצנת הסטארט-אפים והיזמות של תל אביב
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אירועים תרבותיים</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
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
                  <div className="text-right">
                    <span className="font-semibold text-foreground">תחבורה ציבורית:</span> 
                    {" "}גישה מצוינת לאוטובוסים, שתי תחנות רכבת קלה, ורכבת העיר העתידית
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <span className="font-semibold text-foreground">קניות:</span> 
                    {" "}שדרות רוטשילד ושוק הכרמל הסמוכים מציעים מגוון מותגים ייחודיים
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <span className="font-semibold text-foreground">פארקים:</span> 
                    {" "}השדרה עצמה משמשת כפארק עירוני עם שבילי אופניים וספסלי ישיבה
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <span className="font-semibold text-foreground">חינוך:</span> 
                    {" "}בתי ספר יסודיים ותיכוניים מובילים ברדיוס הליכה
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default RothschildNeighborhood;
