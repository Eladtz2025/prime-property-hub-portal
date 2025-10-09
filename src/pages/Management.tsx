import { useState } from 'react';
import CompactHero from '@/components/CompactHero';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Square, Wrench, Check } from 'lucide-react';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const Management = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  // Mock data - נכסים לדוגמה
  const mockProperties = [
    {
      id: '1',
      title: 'בניין משרדים ומקסור בניהול אלנבי',
      address: 'אלנבי 120, תל אביב-יפו',
      city: 'תל אביב',
      building_floors: 8,
      property_size: 850,
      description: 'בניין משרדים מרכזי המנוהל על ידינו. תחזוקה שוטפת, ניהול דיירים ומערכות. מיקום מרכזי במיוחד.',
      image: '/images/properties/building-management-1.jpg',
      features: ['מעלית', 'חניה', 'אבטחה']
    },
    {
      id: '2',
      title: 'בניין מגורים ב-8 יחידות בניהול שינקין',
      address: 'שינקין 24, תל אביב-יפו',
      city: 'תל אביב',
      building_floors: 4,
      property_size: 600,
      description: 'בניין בוטיק עם 8 דירות בניהול מלא. גביית דמי שכירות, תחזוקה, תיקונים ומענה לדיירים 24/7.',
      image: '/images/properties/management-sheinkin-lobby.jpg',
      features: ['מעלית', 'חניה']
    },
    {
      id: '3',
      title: 'בניין בסגנון באוהאוס בניהול',
      address: 'דיזנגוף 100, תל אביב-יפו',
      city: 'תל אביב',
      building_floors: 5,
      property_size: 720,
      description: 'בניין היסטורי בסגנון באוהאוס המנוהל על ידינו. שמירה על אופי המבנה תוך תחזוקה מתמדת.',
      image: '/images/properties/building-bauhaus-1.jpg',
      features: ['אבטחה', 'תחזוקה 24/7']
    }
  ];

  const filteredProperties = mockProperties.filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || property.city === cityFilter;

    return matchesSearch && matchesCity;
  });

  const cities = ['תל אביב'];

  const services = [
    { icon: Check, title: 'ניהול תחזוקה', description: 'ניהול תחזוקה שוטפת ומקיפה של הנכס כולל תיקונים ושיפוצים' },
    { icon: Check, title: 'גביה ודיווח', description: 'גביה יעילה של דמי שכירות ודיווח חודשי מפורט לבעלי הנכסים' },
    { icon: Check, title: 'ניהול דיירים', description: 'ניהול מקצועי של דיירים כולל טיפול בפניות ובקשות' },
    { icon: Check, title: 'זמינות 24/7', description: 'מענה מהיר וזמינות בכל שעות היום לטיפול בכל בעיה שתתעורר' },
  ];

  const stats = [
    { value: '300+', label: 'נכסים בניהול' },
    { value: '99%', label: 'שביעות רצון לקוחות' },
    { value: '24', label: 'שעות זמינות ביום' },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      <CompactHero
        title="ניהול נכסים"
        subtitle="ניהול מקצועי ומלא עבור הנכס שלכם"
        backgroundImage="/images/management-lobby.jpg"
      />

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">נכסים בניהול</h2>
          <p className="text-center text-muted-foreground mb-8">
            מגוון רחב של נכסים שאנו מנהלים עם שירות מלא ותחזוקה שוטפת
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="באזור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הערים</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="חיפוש לפי כתובת או עיר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" className="gap-2">
              <Wrench className="h-4 w-4" />
              סינון מתקדם
            </Button>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          {filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded font-bold text-sm">
                      בניהול מלא
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{property.address}</span>
                    </div>
                    <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
                      {property.building_floors && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{property.building_floors} קומות</span>
                        </div>
                      )}
                      {property.property_size && (
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          <span>{property.property_size} מ"ר</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {property.description}
                    </p>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {property.features.map((feature, idx) => (
                        <Badge key={idx} className="bg-orange-500 hover:bg-orange-600 text-white">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full">פרטים נוספים</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">לא נמצאו נכסים התואמים את הסינון</p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">השירותים שלנו בניהול נכסים</h2>
          <p className="text-center text-muted-foreground mb-12">
            אנו מעניקים שירות מלא ומקצועי לניהול הנכס שלכם באופן יעיל ומדויק
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">למה לבחור בנו לניהול נכסים?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-lg text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Management;
