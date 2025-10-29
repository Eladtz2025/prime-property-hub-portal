import VideoHero from '@/components/he/VideoHero';
import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import DivisionCard from '@/components/DivisionCard';
import GoogleReviews from '@/components/GoogleReviews';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { RelizPropertyCard } from '@/components/en/RelizPropertyCard';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { usePublicProperties } from '@/hooks/usePublicProperties';

const Index = () => {
  const navigate = useNavigate();
  const { data: rentalProperties = [], isLoading: isLoadingRentals } = usePublicProperties({ propertyType: 'rental' });
  const { data: saleProperties = [], isLoading: isLoadingSales } = usePublicProperties({ propertyType: 'sale' });
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const isLoading = isLoadingRentals || isLoadingSales;
  
  // Filter for featured properties - only rental or sale properties with images
  const featuredProperties = [...rentalProperties, ...saleProperties]
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    })
    .slice(0, 6)
    .map(property => ({
      id: property.id,
      title: property.title || property.address,
      location: property.city || 'תל אביב',
      price: property.monthly_rent 
        ? `₪${property.monthly_rent.toLocaleString()}/חודש`
        : 'מחיר לא זמין',
      imageUrl: property.images[0]?.image_url || '/images/rental-interior.jpg',
      type: property.property_type === 'rental' ? 'להשכרה' : 'למכירה',
    }));

  const neighborhoods = [
    {
      id: "rothschild",
      name: "רוטשילד",
      image: "/images/en/neighborhoods/rothschild.jpg",
    },
    {
      id: "neve-tzedek",
      name: "נווה צדק",
      image: "/images/en/neighborhoods/neve-tzedek.jpg",
    },
    {
      id: "florentin",
      name: "פלורנטין",
      image: "/images/en/neighborhoods/florentin.jpg",
    },
    {
      id: "dizengoff",
      name: "דיזנגוף",
      image: "/images/en/neighborhoods/dizengoff.jpg",
    },
  ];

  const divisions = [
    {
      title: 'השכרות',
      description: 'מחפשים דירה להשכרה? אנחנו כאן בשבילכם',
      image: '/images/rental-interior.jpg',
      features: [
        'ליווי מקצועי בחיפוש הנכס המתאים',
        'בדיקת דיירים מקיפה',
        'הכנת חוזים משפטיים',
        'שירות אישי ומסור',
      ],
      link: '/rentals',
      icon: 'users' as const,
    },
    {
      title: 'מכירות',
      description: 'קונים או מוכרים? אנחנו נדאג לעסקה המושלמת',
      image: '/images/sales-villa.jpg',
      features: [
        'הערכת שווי מקצועית ומדויקת',
        'שיווק יעיל ומתקדם',
        'ייעוץ משפטי ומיסוי מלא',
        'ניהול מו"מ וליווי עד לסגירה',
      ],
      link: '/sales',
      icon: 'trending' as const,
    },
    {
      title: 'ניהול נכסים',
      description: 'ניהול מקצועי ומלא עבור הנכס שלכם',
      image: '/images/management-lobby.jpg',
      features: [
        'ניהול תחזוקה שוטפת ופתרונות מהירים',
        'גביה ודיווח חודשי',
        'ניהול דיירים מקצועי',
        'זמינות ושירות 24/7',
      ],
      link: '/management',
      icon: 'building' as const,
    },
  ];

  const stats = [
    {
      icon: '24/7',
      label: 'זמינות מלאה',
      color: 'bg-primary',
    },
    {
      icon: '+500',
      label: 'עסקאות מוצלחות',
      color: 'bg-secondary',
    },
    {
      icon: '+15',
      label: 'שנות ניסיון',
      color: 'bg-primary',
    },
  ];

  return (
    <div className="min-h-screen hebrew-luxury">
      <WhatsAppFloat />
      <HebrewHeader />
      
      {/* Hero Section */}
      <VideoHero
        title="ברוכים הבאים הביתה"
        subtitle="מצאו את הבית האידיאלי שלכם. חקרו את הנכסים הבלעדיים שלנו בלב תל אביב"
        imageUrl="/images/en/hero-last-one.png"
      />

      {/* About Section */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground mb-4 md:mb-6">
              City Market – נדל"ן
            </h2>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground leading-relaxed mb-6 md:mb-8">
              ב-<strong>City Market Real Estate</strong> אנחנו מציעים שירות אישי שילווה אותך בכל שלב בתהליך הנדל"ני. 
              אנחנו עוזרים לך למצוא את הנכס המושלם ולסיים את הסכם המכירה, תוך הבטחת חוויה חלקה ומתגמלת.
            </p>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground leading-relaxed">
              בין אם אתה קונה את בית החלומות שלך או משקיע בנדל"ן איכותי, הצוות המסור שלנו כאן כדי להפוך את התהליך לחלק, מקצועי ומותאם לצרכים שלך.
            </p>
          </div>
        </div>
      </section>

      {/* Divisions Section */}
      <section className="py-12 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <p className="font-montserrat text-xs md:text-sm tracking-widest uppercase text-muted-foreground mb-3 md:mb-4">
              השירותים שלנו
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground mb-3 md:mb-4">החטיבות שלנו</h2>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              ניהול, מכירה והשכרה במקום אחד
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {divisions.map((division) => (
              <DivisionCard key={division.title} {...division} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <p className="font-montserrat text-xs md:text-sm tracking-widest uppercase text-muted-foreground mb-3 md:mb-4">
              נבחרו במיוחד בשבילך
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground">
              נכסים מומלצים
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">טוען נכסים...</p>
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">אין נכסים זמינים כרגע</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 md:gap-6 mb-8 md:mb-12 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
              {featuredProperties.map((property) => (
                <div key={property.id} className="flex-none w-[280px] sm:w-[320px] md:w-[360px] snap-center">
                  <RelizPropertyCard
                    {...property}
                    onClick={() => navigate(`/property/${property.id}`)}
                  />
                </div>
              ))}
            </div>
          )}

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

      {/* Neighborhoods Guide */}
      <section className="py-12 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <p className="font-montserrat text-xs md:text-sm tracking-widest uppercase text-muted-foreground mb-3 md:mb-4">
              גלה את תל אביב
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground">
              מדריך שכונות
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            {neighborhoods.map((neighborhood) => (
              <div
                key={neighborhood.id}
                onClick={() => navigate(`/neighborhoods/${neighborhood.id}`)}
                className="group relative aspect-[3/4] overflow-hidden cursor-pointer"
              >
                <img
                  src={neighborhood.image}
                  alt={neighborhood.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-center p-4 md:p-8">
                  <h3 className="font-playfair text-2xl md:text-3xl font-normal text-white tracking-wide">
                    {neighborhood.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/neighborhoods")}
              className="reliz-button"
            >
              חקור את כל השכונות
            </button>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <Award className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
              <div className="font-playfair text-3xl md:text-4xl font-normal text-foreground mb-2">
                +15 שנים
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                של מצוינות
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
              <div className="font-playfair text-3xl md:text-4xl font-normal text-foreground mb-2">
                +500
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                עסקאות מוצלחות
              </p>
            </div>
            <div className="text-center">
              <Users className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
              <div className="font-playfair text-3xl md:text-4xl font-normal text-foreground mb-2">
                24/7
              </div>
              <p className="font-montserrat text-sm text-muted-foreground tracking-wide uppercase">
                זמינות מלאה
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="font-montserrat text-xs md:text-sm tracking-widest uppercase text-muted-foreground mb-3 md:mb-4">
                צור קשר
              </p>
              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-normal tracking-wide text-foreground mb-4 md:mb-6">
                בואו נמצא את בית החלומות שלכם
              </h2>
              <p className="font-montserrat text-base md:text-lg text-muted-foreground px-4">
                צרו קשר היום כדי לתאם צפייה או ללמוד עוד על הנכסים הבלעדיים שלנו.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="שם"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-sm md:text-base"
                />
                <input
                  type="email"
                  placeholder="אימייל"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-sm md:text-base"
                />
              </div>
              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="טלפון"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat text-sm md:text-base"
                />
                <textarea
                  placeholder="הודעה"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-background border border-border focus:border-primary outline-none transition-colors font-montserrat resize-none text-sm md:text-base"
                />
              </div>
            </div>

            <div className="text-center mt-6 md:mt-8">
              <button className="reliz-button">
                שלח הודעה
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviews />

      {/* Footer */}
      <HebrewFooter />
    </div>
  );
};

export default Index;
