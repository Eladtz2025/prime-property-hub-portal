import VideoHero from '@/components/he/VideoHero';
import HebrewHeader from '@/components/he/Header';
import DivisionCard from '@/components/DivisionCard';
import GoogleReviews from '@/components/GoogleReviews';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Building2, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Index = () => {
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

      {/* Divisions Section */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">החטיבות שלנו</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              ניהול, מכירה והשכרה במקום אחד
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {divisions.map((division) => (
              <DivisionCard key={division.title} {...division} />
            ))}
          </div>
        </div>
      </section>


      {/* Why Choose Us Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">למה לבחור בנו?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className={`${stat.color} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold`}>
                  {stat.icon}
                </div>
                <p className="text-lg font-semibold">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviews />
    </div>
  );
};

export default Index;
