import HebrewHeader from '@/components/he/Header';
import VideoHero from '@/components/he/VideoHero';
import HebrewFooter from '@/components/he/Footer';
import { RelizPropertyCard } from '@/components/he/RelizPropertyCard';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const featuredProperties = [
    {
      id: "1",
      title: "פנטהאוז ברוטשילד",
      location: "שדרות רוטשילד",
      price: "₪8,500,000",
      imageUrl: "/images/properties/sale-rothschild-exterior.jpg",
      type: "למכירה",
    },
    {
      id: "2",
      title: "דירת באוהאוס",
      location: "רחוב דיזנגוף",
      price: "₪12,000/חודש",
      imageUrl: "/images/properties/living-bauhaus-1.jpg",
      type: "להשכרה",
    },
    {
      id: "3",
      title: "וילה מודרנית",
      location: "נווה צדק",
      price: "₪15,000,000",
      imageUrl: "/images/properties/penthouse-allenby.jpg",
      type: "למכירה",
    },
    {
      id: "4",
      title: "דירה עם מרפסת שמש",
      location: "צפון הישן",
      price: "₪10,500/חודש",
      imageUrl: "/images/properties/balcony-sunny-1.jpg",
      type: "להשכרה",
    },
  ];

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <WhatsAppFloat />
      <HebrewHeader />
      {/* Hero Section */}
      <VideoHero
        title="ברוכים הבאים הביתה"
        subtitle="מצאו את הבית האידיאלי. גלו את הנכסים האקסקלוסיביים שלנו."
        imageUrl="/images/hero-building.jpg"
      />

      {/* About Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              סיטי מרקט – נדל"ן
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed mb-8">
              ב<strong>סיטי מרקט נדל"ן</strong>, אנו מציעים שירות אישי ומותאם אישית שילווה אתכם בכל שלב בדרך
              הנדל"ן. אנו עוזרים לכם למצוא את הנכס המושלם ולסגור את עסקת המכירה, תוך הבטחת חוויה חלקה ומתגמלת.
            </p>
            <p className="font-montserrat text-lg text-muted-foreground leading-relaxed">
              בין אם אתם רוכשים את בית החלומות שלכם או משקיעים בנדל"ן פרימיום, הצוות המסור שלנו כאן כדי להפוך
              את התהליך לחלק, מקצועי ומותאם לצרכים שלכם.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              נבחרו במיוחד עבורכם
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              נכסים נבחרים
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredProperties.map((property) => (
              <RelizPropertyCard
                key={property.id}
                {...property}
                onClick={() => navigate(`/property/${property.id}`)}
              />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/sales")}
              className="reliz-button"
            >
              צפה בכל הנכסים
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                15+ שנים
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                של מצוינות
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                +500
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                עסקאות מוצלחות
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-playfair text-4xl font-normal text-foreground mb-2">
                24/7
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                זמינות
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
                צרו קשר
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
                בואו נמצא את בית החלומות שלכם
              </h2>
              <p className="font-montserrat text-lg text-muted-foreground">
                צרו איתנו קשר היום כדי לתאם צפייה או ללמוד עוד על הנכסים האקסקלוסיביים שלנו.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="שם"
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                />
                <input
                  type="email"
                  placeholder="אימייל"
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                />
              </div>
              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="טלפון"
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat"
                />
                <textarea
                  placeholder="הודעה"
                  rows={4}
                  className="w-full px-6 py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none"
                />
              </div>
            </div>

            <div className="text-center mt-8">
              <button className="reliz-button">
                שלח הודעה
              </button>
            </div>
          </div>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default Index;
