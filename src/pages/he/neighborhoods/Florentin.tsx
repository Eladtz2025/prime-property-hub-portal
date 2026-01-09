import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Music, Palette, Users, ChevronLeft } from "lucide-react";
import HebrewFooter from "@/components/he/Footer";
import HebrewHeader from "@/components/he/Header";
import FullScreenHero from "@/components/FullScreenHero";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Helmet } from "react-helmet";
import HreflangMeta from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";

const FlorentinNeighborhood = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>פלורנטין תל אביב | נדל"ן אורבני - סיטי מרקט</title>
        <meta name="description" content="נכסים למכירה ולהשכרה בפלורנטין. אמנות רחוב, חיי לילה תוססים ואווירה צעירה. מומחים בנדל״ן בשכונה הכי תוססת בתל אביב. צרו קשר עוד היום!" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he/neighborhoods/florentin" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he/neighborhoods/florentin" />
      <OrganizationSchema language="he" />
      <WebSiteSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" },
        { name: "שכונות", url: "https://www.ctmarketproperties.com/he/neighborhoods" },
        { name: "פלורנטין", url: "https://www.ctmarketproperties.com/he/neighborhoods/florentin" }
      ]} />
      <HebrewHeader />

      <FullScreenHero
        title="פלורנטין"
        subtitle="השכונה הבוהמית - אמנות רחוב, חיי לילה ואנרגיה צעירה"
        backgroundImage="/images/en/neighborhoods/florentin-hero.jpg"
        backgroundAlt="אמנות רחוב וגרפיטי צבעוני בשכונת פלורנטין תל אביב"
        minHeight="100vh"
      />

      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs 
          items={[
            { label: "שכונות", href: "/he/neighborhoods" },
            { label: "פלורנטין", href: "/he/neighborhoods/florentin" }
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
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Palette className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">אמנות רחוב</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    ציורי קיר מרהיבים וגרפיטי אמנותי בכל פינה
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Music className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">חיי לילה</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    ברים, מועדונים ומקומות בילוי עד השעות הקטנות
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">קהילה צעירה</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    אווירה דינמית של אמנים, סטודנטים ויזמים צעירים
                  </p>
                </Card>
                <Card className="p-6 text-right">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <h3 className="font-playfair text-xl font-bold">מיקום מרכזי</h3>
                  </div>
                  <p className="font-montserrat text-sm text-muted-foreground text-right">
                    קרבה לשוק הכרמל, נווה צדק ותחנת הרכבת המרכזית
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
            נכסים זמינים בפלורנטין
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

export default FlorentinNeighborhood;
