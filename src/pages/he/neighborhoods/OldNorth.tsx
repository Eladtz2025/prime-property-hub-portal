import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Trees, Users, Home, ChevronLeft } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";
import HebrewHeader from "@/components/he/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Helmet } from "react-helmet";
import HreflangMeta from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";

const OldNorthNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>צפון ישן תל אביב | נדל"ן קלאסי - סיטי מרקט</title>
        <meta name="description" content="נכסים למכירה ולהשכרה בצפון הישן תל אביב. שכונה שקטה ומשפחתית, אדריכלות באוהאוס ושטחים ירוקים. מומחים בנדל״ן באזור המבוקש. צרו קשר!" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he/neighborhoods/old-north" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he/neighborhoods/old-north" />
      <OrganizationSchema language="he" />
      <WebSiteSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" },
        { name: "שכונות", url: "https://www.ctmarketproperties.com/he/neighborhoods" },
        { name: "צפון הישן", url: "https://www.ctmarketproperties.com/he/neighborhoods/old-north" }
      ]} />
      <HebrewHeader />

      <FullScreenHero
        title="צפון הישן"
        subtitle="שכונה שקטה ומשפחתית עם מורשת באוהאוס ושטחים ירוקים"
        backgroundImage="/images/en/neighborhoods/old-north-hero.jpg"
        backgroundAlt="רחוב מוצל עם עצים ובניינים בסגנון באוהאוס בצפון הישן תל אביב"
        minHeight="100vh"
      />

      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs 
          items={[
            { label: "שכונות", href: "/he/neighborhoods" },
            { label: "צפון הישן", href: "/he/neighborhoods/old-north" }
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
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">ידידותי למשפחות</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    גנים, מגרשי משחקים ובתי ספר מובילים בסביבה
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Trees className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">שטחים ירוקים</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    פארקים, גנים ציבוריים ושדרות עצים מוצלות
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Home className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אדריכלות באוהאוס</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    בתים היסטוריים משוקמים בסגנון הבינלאומי
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קרבה לחוף</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    דקות הליכה מחופי הים ומהטיילת
                  </p>
                </Card>
              </div>
            </section>
          </div>

        </div>
      </div>

      {/* Internal Links Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
            נכסים זמינים בצפון הישן
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              to="/he/sales" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              נכסים למכירה
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/he/rentals" 
              className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              נכסים להשכרה
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/he/about" 
              className="inline-flex items-center gap-2 px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              אודות City Market
            </Link>
          </div>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default OldNorthNeighborhood;
