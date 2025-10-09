import Hero from '@/components/Hero';
import DivisionCard from '@/components/DivisionCard';
import GoogleReviews from '@/components/GoogleReviews';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Building2, TrendingUp, Users, Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-building.jpg';

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
      icon: '+15',
      label: 'שנות ניסיון',
    },
    {
      icon: '+500',
      label: 'עסקאות מוצלחות',
    },
    {
      icon: '24/7',
      label: 'זמינות מלאה',
    },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      {/* Hero Section */}
      <Hero
        title="סיטי מרקט נכסים"
        subtitle="מלב תל-אביב הלבנה עד הבית החדש שלכם"
        description="חברת תיווך מובילה עם שלוש חטיבות המתמחות בהשכרות, מכירות וניהול נכסים"
        backgroundImage={heroImage}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent border-white/50 text-white hover:bg-white/10 text-lg font-bold px-8 py-6"
            asChild
          >
            <a href="mailto:eladtz@gmail.com">
              <Mail className="h-5 w-5" />
              eladtz@gmail.com
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent border-white/50 text-white hover:bg-white/10 text-lg font-bold px-8 py-6"
            asChild
          >
            <a href="tel:054-550-3055">
              <Phone className="h-5 w-5" />
              054-550-3055
            </a>
          </Button>
        </div>
      </Hero>

      {/* Divisions Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">החטיבות שלנו</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ניהול, מכירה והשכרה במקום אחד
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {divisions.map((division) => (
              <DivisionCard key={division.title} {...division} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">למה לבחור בנו?</h2>
            <p className="text-lg text-muted-foreground">
              הניסיון והמקצועיות שלנו עושים את ההבדל
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-8 text-center bg-primary-light/30 border-0">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                  index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : 'bg-primary'
                }`}>
                  <div className="text-3xl font-bold text-white">{stat.icon}</div>
                </div>
                <div className="text-lg text-muted-foreground">{stat.label}</div>
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
