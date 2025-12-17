import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Coffee, Building2 } from "lucide-react";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";

const HebrewNeighborhoods = () => {
  const navigate = useNavigate();

  const neighborhoods = [
    {
      id: "rothschild",
      name: "שדרות רוטשילד",
      description: "לב אדריכלות הבאוהאוס והתרבות של תל אביב",
      imageUrl: "/images/en/neighborhoods/rothschild-hero.jpg",
      avgPrice: "₪4.5M - ₪12M",
      highlights: ["מורשת אונסק״ו", "שדרה עצים", "בתי קפה אייקוניים"],
    },
    {
      id: "neve-tzedek",
      name: "נווה צדק",
      description: "השכונה הראשונה של תל אביב, מקסימה ואמנותית",
      imageUrl: "/images/en/neighborhoods/neve-tzedek-hero.jpg",
      avgPrice: "₪5M - ₪15M",
      highlights: ["קסם היסטורי", "חנויות בוטיק", "אווירה ים תיכונית"],
    },
    {
      id: "florentin",
      name: "פלורנטין",
      description: "שכונה בוהמית עם אמנות רחוב תוססת וחיי לילה",
      imageUrl: "/images/en/neighborhoods/florentin-hero.jpg",
      avgPrice: "₪2.5M - ₪6M",
      highlights: ["אמנות רחוב", "אווירה צעירה", "מרכז חיי לילה"],
    },
    {
      id: "dizengoff",
      name: "דיזנגוף",
      description: "לב מסחרי תוסס עם קניות ובידור",
      imageUrl: "/images/en/neighborhoods/dizengoff-hero.jpg",
      avgPrice: "₪3M - ₪8M",
      highlights: ["אזור קניות", "דיזנגוף סנטר", "דופק העיר"],
    },
    {
      id: "old-north",
      name: "צפון הישן",
      description: "שקט ואיכות חיים בלב העיר",
      imageUrl: "/images/en/neighborhoods/old-north-hero.jpg",
      avgPrice: "₪3.5M - ₪9M",
      highlights: ["ידידותי למשפחות", "אוצרות באוהאוס", "פארקים ושטחים ירוקים"],
    },
  ];

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <title>שכונות תל אביב - מדריך לשכונות היוקרתיות | City Market Properties</title>
        <meta name="description" content="גלו את השכונות המובחרות של תל אביב: רוטשילד, נווה צדק, פלורנטין, דיזנגוף והצפון הישן. מחירים, מאפיינים ונכסים למכירה ולהשכרה." />
        <meta property="og:title" content="שכונות תל אביב - מדריך לשכונות היוקרתיות | City Market Properties" />
        <meta property="og:description" content="גלו את השכונות המובחרות של תל אביב: רוטשילד, נווה צדק, פלורנטין, דיזנגוף והצפון הישן. מחירים, מאפיינים ונכסים למכירה ולהשכרה." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket-properties.com/neighborhoods" />
      </Helmet>
      <HebrewHeader />

      <FullScreenHero
        title="שכונות"
        backgroundImage="/images/hero-neighborhoods.jpg"
        minHeight="100vh"
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              איפה תקראו לביתכם?
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              כל שכונה מספרת את הסיפור שלה. מצאו את שלכם.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {neighborhoods.map((neighborhood) => (
              <Card
                key={neighborhood.id}
                className="group overflow-hidden border-0 shadow-card hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
                onClick={() => navigate(`/he/neighborhoods/${neighborhood.id}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={neighborhood.imageUrl}
                    alt={neighborhood.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="font-playfair text-2xl font-bold mb-2">
                      {neighborhood.name}
                    </h3>
                    <p className="font-montserrat text-sm opacity-90">
                      {neighborhood.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 flex-row-reverse text-primary">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-montserrat font-semibold">
                      {neighborhood.avgPrice}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {neighborhood.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 justify-end text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="font-montserrat text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full font-montserrat" variant="outline">
                    חקור שכונה
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Tel Aviv */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-foreground mb-4">
              למה תל אביב?
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              יותר מעיר, זה אורח חיים
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Coffee className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-xl font-bold mb-2">תרבות תוססת</h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                אוכל ברמה עולמית, גלריות אמנות וחיי לילה
              </p>
            </div>
            <div className="text-center">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-xl font-bold mb-2">מורשת אונסק״ו</h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                האוסף הגדול ביותר של אדריכלות באוהאוס בעולם
              </p>
            </div>
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-playfair text-xl font-bold mb-2">אורח חיים ים תיכוני</h3>
              <p className="font-montserrat text-sm text-muted-foreground">
                תרבות החוף פוגשת תחכום עירוני
              </p>
            </div>
          </div>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default HebrewNeighborhoods;
