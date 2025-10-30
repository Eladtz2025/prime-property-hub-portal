import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { usePublicProperties } from "@/hooks/usePublicProperties";
import { Shield, DollarSign, Wrench, FileText, Phone, TrendingUp, MapPin, Square, Building } from "lucide-react";
import WhatsAppFloat from '@/components/WhatsAppFloat';

const Management = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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
      description: "גביה אוטומטית של דמי שכירות ודיווח פיננסי. לעולם לא תצטרכו לדאוג לגבי תשלומים מאוחרים.",
    },
    {
      icon: <Wrench className="w-10 h-10 text-primary" />,
      title: "תחזוקה",
      description: "תיאום תחזוקה 24/7 עם קבלנים מאומתים. מענה מהיר לצרכי הדיירים.",
    },
    {
      icon: <FileText className="w-10 h-10 text-primary" />,
      title: "ציות משפטי",
      description: "ציות משפטי מלא ותיעוד. הישארו מוגנים עם ניהול חוזים מומחה.",
    },
    {
      icon: <Phone className="w-10 h-10 text-primary" />,
      title: "קשרי דיירים",
      description: "בדיקת דיירים מקצועית ותקשורת. דיירים איכותיים, בעלים מרוצים.",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-primary" />,
      title: "אופטימיזציה פיננסית",
      description: "מקסמו את התשואה שלכם עם תמחור אסטרטגי וניהול עלויות.",
    },
    {
      icon: <Shield className="w-10 h-10 text-primary" />,
      title: "הגנת רכוש",
      description: "בדיקות קבועות ותחזוקה מונעת כדי לשמר את ההשקעה שלכם.",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="rtl">
      <WhatsAppFloat />
      <HebrewHeader />

      {/* Hero Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/management-lobby.jpg"
          alt="ניהול נכסים"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              ניהול נכסים
            </h1>
          </div>
        </div>
      </section>

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
                <Card key={property.id} className="overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-video relative">
                    <img
                      src={property.images[0]?.image_url || '/images/properties/building-management-1.jpg'}
                      alt={property.title || property.address}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {property.show_management_badge && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded font-bold text-sm">
                        ניהול מלא
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-playfair text-xl font-bold mb-2">
                      {property.title || `${property.rooms} חדרים ${property.address}`}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{property.address}</span>
                    </div>
                    <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
                      {property.floor && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>{property.floor} קומות</span>
                        </div>
                      )}
                      {property.property_size && (
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          <span>{property.property_size} מ²</span>
                        </div>
                      )}
                    </div>
                    {property.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {property.parking && (
                        <Badge className="bg-primary hover:bg-primary/90">חניה</Badge>
                      )}
                      {property.elevator && (
                        <Badge className="bg-primary hover:bg-primary/90">מעלית</Badge>
                      )}
                      {property.balcony && (
                        <Badge className="bg-primary hover:bg-primary/90">מרפסת</Badge>
                      )}
                    </div>
                    <Button className="w-full font-montserrat">
                      פרטים נוספים
                    </Button>
                  </div>
                </Card>
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
                className="p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="font-montserrat text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            מוכנים לשתף פעולה עם מומחים?
          </h2>
          <p className="font-montserrat text-lg mb-8 max-w-2xl mx-auto opacity-90">
            תנו לנו לטפל בפרטים בזמן שאתם נהנים משקט נפשי ותשואות עקביות
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="font-montserrat font-semibold px-8"
          >
            קבלו ייעוץ חינם
          </Button>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default Management;