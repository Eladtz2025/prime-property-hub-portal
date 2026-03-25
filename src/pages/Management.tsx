import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import FullScreenHero from '@/components/FullScreenHero';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { usePublicProperties } from "@/hooks/usePublicProperties";
import { Shield, DollarSign, Wrench, FileText, Phone, TrendingUp } from "lucide-react";
import { FlippablePropertyCard } from '@/components/he/FlippablePropertyCard';
import { ConsultationModal } from '@/components/he/ConsultationModal';
import { Helmet } from "react-helmet";
import HreflangMeta from '@/components/seo/HreflangMeta';
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from '@/components/seo/SchemaOrg';

const Management = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const { data: properties, isLoading } = usePublicProperties({ propertyType: 'management' });

  const filteredProperties = (properties || []).filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const services = [
    {
      icon: <DollarSign className="w-10 h-10 text-primary" />,
      title: "גביה ודיווח",
      description: "גביה אוטומטית של דמי שכירות ודיווח פיננסי מפורט. בלי לרדוף אחרי תשלומים מאחרים.",
    },
    {
      icon: <Wrench className="w-10 h-10 text-primary" />,
      title: "תחזוקה",
      description: "תיאום תחזוקה 24/7 עם קבלנים מהימנים. מענה מהיר ואמין לכל בקשה של הדיירים.",
    },
    {
      icon: <FileText className="w-10 h-10 text-primary" />,
      title: "ציות משפטי",
      description: "ליווי מקצועי והפניה לאנשי מקצוע משפטיים מהימנים לכל התיעוד והציות הנדרשים.",
    },
    {
      icon: <Phone className="w-10 h-10 text-primary" />,
      title: "קשרי דיירים",
      description: "בדיקת דיירים מקצועית, תקשורת ברורה ויחסי דיירים חזקים ליציבות לטווח ארוך.",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-primary" />,
      title: "אופטימיזציה פיננסית",
      description: "מקסום תשואה באמצעות תמחור אסטרטגי, בקרת הוצאות ותובנות על תיק הנכסים.",
    },
    {
      icon: <Shield className="w-10 h-10 text-primary" />,
      title: "הגנת רכוש",
      description: "בדיקות שוטפות ותחזוקה מונעת שנועדו להגן ולשמר את ההשקעה שלכם.",
    },
  ];

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>ניהול נכסים בתל אביב | CITY MARKET Properties - ניהול דירות מקצועי ואמין</title>
        <meta name="description" content="שירותי ניהול נכסים מקצועי בתל אביב. גביה, תחזוקה, בדיקת דיירים וניהול שוטף. שקט נפשי לבעלי נכסים עם תשואות עקביות." />
        <meta property="og:image" content="https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/city-market-logo.png" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he/management" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he/management" />
      <OrganizationSchema language="he" />
      <WebSiteSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" },
        { name: "ניהול נכסים", url: "https://www.ctmarketproperties.com/he/management" }
      ]} />
      <HebrewHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="ניהול נכסים"
        backgroundImage="/images/management-lobby.jpg"
        minHeight="100vh"
      />

      {/* Properties Grid */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <Input
              placeholder="חיפוש נכסים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">טוען נכסים...</p>
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <FlippablePropertyCard
                  key={property.id}
                  title={property.title || `${property.rooms} חדרים ${property.address}`}
                  location={property.address || ''}
                  price={property.show_management_badge ? 'ניהול מלא' : 'ניהול נכסים'}
                  imageUrl={property.images?.[0]?.image_url || '/images/properties/building-management-1.jpg'}
                  type={property.property_size ? `${property.property_size} מ²` : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">לא נמצאו נכסים</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              מה אנחנו מנהלים
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              מדירות בודדות ועד בניינים שלמים, אנחנו מטפלים בהכל
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group text-right"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-end">
                  {service.icon}
                </div>
                <h3 className="font-playfair text-xl font-bold text-foreground mb-2 text-right">
                  {service.title}
                </h3>
                <p className="font-montserrat text-muted-foreground text-sm leading-relaxed text-right">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-foreground">
            מוכנים לשתף פעולה עם מומחים?
          </h2>
          <p className="font-montserrat text-base mb-6 max-w-2xl mx-auto text-muted-foreground">
            תנו לנו לטפל בפרטים בזמן שאתם נהנים משקט נפשי ותשואות עקביות
          </p>
          <Button
            size="lg"
            className="font-montserrat font-semibold px-8"
            onClick={() => setConsultationModalOpen(true)}
          >
            קבלו ייעוץ חינם
          </Button>
        </div>
      </section>

      <ConsultationModal 
        open={consultationModalOpen} 
        onOpenChange={setConsultationModalOpen} 
      />

      <HebrewFooter />
    </div>
  );
};

export default Management;