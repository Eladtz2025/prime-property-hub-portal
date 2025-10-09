import { useState } from 'react';
import CompactHero from '@/components/CompactHero';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Square, Wrench, Check } from 'lucide-react';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');

  // Mock data - נכסים לדוגמה
  const mockProperties = [
    {
      id: '1',
      title: 'פנטהאוז יוקרתי בניהול אלנבי',
      address: 'אלנבי 62, תל אביב-יפו',
      city: 'תל אביב',
      price: 4500000,
      rooms: 5,
      property_size: 160,
      description: 'פנטהאוז מרהיב עם נוף פנורמי לים, מרפסת גדולה, עיצוב מודרני ויוקרתי. מעלית פרטית, חניה כפולה.',
      image: '/images/properties/penthouse-allenby.jpg',
      features: ['מעלית', 'חניה', 'מרפסת', 'נוף לים']
    },
    {
      id: '2',
      title: 'דירת 4 חדרים בניהול רוטשילד',
      address: 'רוטשילד 45, תל אביב-יפו',
      city: 'תל אביב',
      price: 2900000,
      rooms: 4,
      property_size: 120,
      description: 'דירה מושקעת בבניין בוטיק, שופצה ברמה גבוהה. מיקום יוקרתי בשדרת רוטשילד, קרוב לכל השירותים.',
      image: '/images/properties/sale-rothschild-exterior.jpg',
      features: ['מעלית', 'חניה', 'מרפסת']
    },
    {
      id: '3',
      title: 'דירת 3 חדרים במרכז דיזנגוף',
      address: 'דיזנגוף 88, תל אביב-יפו',
      city: 'תל אביב',
      price: 3500000,
      rooms: 3,
      property_size: 95,
      description: 'דירה מרווחת עם מרפסת גדולה, משופצת מהיסוד. מיקום מעולה במרכז תל אביב, קרוב לכל.',
      image: '/images/properties/sale-dizengoff-terrace.jpg',
      features: ['מעלית', 'מרפסת', 'חניה']
    },
    {
      id: '4',
      title: 'דירת 4 חדרים משופצת בניהול דיזנגוף',
      address: 'דיזנגוף 120, תל אביב-יפו',
      city: 'תל אביב',
      price: 6800000,
      rooms: 4,
      property_size: 140,
      description: 'דירה מרווחת במיקום מעולה, שופצה ברמה גבוהה עם חומרים איכותיים. מרפסת שמש גדולה.',
      image: '/images/properties/rental-dizengoff-interior.jpg',
      features: ['מעלית', 'חניה', 'מרפסת']
    }
  ];

  const filteredProperties = mockProperties.filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || property.city === cityFilter;
    const matchesRooms = roomsFilter === 'all' || property.rooms?.toString() === roomsFilter;
    const matchesPrice = !maxPrice || (property.price && property.price <= parseFloat(maxPrice));

    return matchesSearch && matchesCity && matchesRooms && matchesPrice;
  });

  const cities = ['תל אביב'];

  const services = [
    { icon: Check, title: 'ייעוץ והערכת שווי', description: 'הערכת שווי מקצועית ומדויקת על ידי מומחים בתחום הנדל"ן' },
    { icon: Check, title: 'ליווי משפטי מלא', description: 'ליווי משפטי מקצועי לאורך כל התהליך, מהבדיקה ועד החתימה' },
    { icon: Check, title: 'מו"מ מקצועי', description: 'ניהול מו"מ מיטבי עבורכם להשגת המחיר והתנאים הטובים ביותר' },
    { icon: Check, title: 'שיווק מתקדם', description: 'חשיפה מקסימלית בכל הפלטפורמות והערוצים הרלוונטיים' },
  ];

  const stats = [
    { value: '98%', label: 'שיעור הצלחה במכירות' },
    { value: '45', label: 'ימים ממוצע למכירה' },
    { value: '150+', label: 'נכסים נמכרו השנה' },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      <CompactHero
        title="נכסים למכירה"
        subtitle="השקעה נבונה מתחילה כאן"
        backgroundImage="/images/sales-villa.jpg"
      />

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">נכסים למכירה</h2>
          <p className="text-center text-muted-foreground mb-8">
            נכסים איכותיים למכירה עם ליווי מלא ותחזוקה שוטפת
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={roomsFilter} onValueChange={setRoomsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="טווח חדרים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל מספרי החדרים</SelectItem>
                <SelectItem value="1">1 חדר</SelectItem>
                <SelectItem value="2">2 חדרים</SelectItem>
                <SelectItem value="3">3 חדרים</SelectItem>
                <SelectItem value="4">4 חדרים</SelectItem>
                <SelectItem value="5">5+ חדרים</SelectItem>
              </SelectContent>
            </Select>
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
                      ₪ {property.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{property.address}</span>
                    </div>
                    <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
                      {property.rooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.rooms}</span>
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
          <h2 className="text-3xl font-bold text-center mb-4">השירותים שלנו במכירות</h2>
          <p className="text-center text-muted-foreground mb-12">
            אנו מעניקים שירות מלא ומקצועי לאורך כל תהליך המכירה והרכישה
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
          <h2 className="text-3xl font-bold text-center mb-12">למה לבחור בנו למכירה?</h2>
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

export default Sales;
