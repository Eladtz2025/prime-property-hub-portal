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
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      {/* Hero Section */}
      <Hero
        title="סיטי מרקט נכסים"
        subtitle="מלב תל-אביב הלבנה עד הבית החדש שלכם"
        description="חברת תיווך מובילה עם שלוש חטיבות המתמחות בהשכרות, מכירות וניהול נכסים"
        backgroundImage={heroImage}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8 justify-center items-center mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-white/20 w-full max-w-2xl mx-auto px-4">
          <Button
            size="lg"
            variant="ghost"
            className="w-full sm:w-auto space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:text-secondary hover:scale-105 text-base sm:text-lg md:text-xl font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 touch-target"
            asChild
          >
            <a href="mailto:eladtz@gmail.com" className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate">eladtz@gmail.com</span>
            </a>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full sm:w-auto space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:text-secondary hover:scale-105 text-base sm:text-lg md:text-xl font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 touch-target"
            asChild
          >
            <a href="tel:054-550-3055" className="flex items-center justify-center gap-2">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span>054-550-3055</span>
            </a>
          </Button>
        </div>
      </Hero>

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
