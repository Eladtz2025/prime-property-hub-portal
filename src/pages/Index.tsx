import Hero from '@/components/Hero';
import DivisionCard from '@/components/DivisionCard';
import GoogleReviews from '@/components/GoogleReviews';
import ContactSection from '@/components/ContactSection';
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
        'מגוון רחב של דירות להשכרה',
        'ליווי מקצועי בכל שלב',
        'בדיקת דיירים יסודית',
        'ייעוץ משפטי מלא',
      ],
      link: '/rentals',
    },
    {
      title: 'מכירות',
      description: 'קונים או מוכרים? אנחנו נדאג לעסקה המושלמת',
      image: '/images/sales-villa.jpg',
      features: [
        'הערכת שווי מקצועית',
        'שיווק מתקדם ויעיל',
        'ליווי משפטי מלא',
        'ניהול מו"מ מקצועי',
      ],
      link: '/sales',
    },
    {
      title: 'ניהול נכסים',
      description: 'ניהול מקצועי ומלא עבור הנכס שלכם',
      image: '/images/management-lobby.jpg',
      features: [
        'ניהול תחזוקה שוטפת',
        'גביה ודיווח חודשי',
        'ניהול דיירים מקצועי',
        'זמינות 24/7',
      ],
      link: '/management',
    },
  ];

  const stats = [
    {
      icon: Building2,
      value: '15+',
      label: 'שנות ניסיון',
    },
    {
      icon: TrendingUp,
      value: '500+',
      label: 'עסקאות מוצלחות',
    },
    {
      icon: Users,
      value: '24/7',
      label: 'זמינות מלאה',
    },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      {/* Hero Section */}
      <Hero
        title="City Market Properties"
        subtitle="סיטי מרקט נכסים"
        description="מלב תל אביב הלבנה עד הבית החדש שלכם"
        backgroundImage="/images/hero-building.jpg"
      />

      {/* Divisions Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">השירותים שלנו</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              מומחים בתיווך נדל"ן, השכרה, מכירה וניהול נכסים
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
              <Card key={index} className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-lg text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviews />

      {/* Contact Section */}
      <ContactSection />
    </div>
  );
};

export default Index;
