import { useState } from 'react';
import CompactHero from '@/components/CompactHero';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Bath, Square, Building, Building2, Wrench, FileCheck, Users, ClipboardList } from 'lucide-react';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { usePublicProperties } from '@/hooks/usePublicProperties';

// Use real database data
const USE_REAL_DATA = true;

const Management = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  
  // Fetch real data from database
  const { data: realProperties, isLoading } = usePublicProperties({ propertyType: 'management' });

  // Mock data - נכסים לדוגמה
  const mockProperties = [
    {
      id: '1',
      title: 'בניין מגורים 12 יחידות ברחוב שיינקין',
      address: 'שיינקין 87, תל אביב',
      city: 'תל אביב',
      building_floors: 3,
      property_size: 850,
      description: 'בניין בוטיק מתחזק ומשופץ, 12 דירות להשכרה, כולן מושכרות, ניהול מלא כולל תחזוקה, גביה ודיווח. תפוסה 100%.',
      image: '/images/properties/management-sheinkin-lobby.jpg',
      features: ['חניה', 'תחזוקה שוטפת', 'ניהול מלא']
    },
    {
      id: '2',
      title: 'בניין מגורים 8 יחידות ברחוב מונטיפיורי',
      address: 'מונטיפיורי 23, תל אביב',
      city: 'תל אביב',
      building_floors: 3,
      property_size: 520,
      description: 'בניין בוטיק משופץ ומתוחזק, 8 דירות, כולן מושכרות, ניהול מקצועי כולל גביה ותחזוקה שוטפת. דיירים איכותיים ויציבים.',
      image: '/images/properties/building-management-1.jpg',
      features: ['חניה', 'תחזוקה מלאה']
    },
    {
      id: '3',
      title: 'בניין משרדים ומסחר ברחוב אלנבי',
      address: 'אלנבי 112, תל אביב',
      city: 'תל אביב',
      building_floors: 4,
      property_size: 650,
      description: 'בניין היסטורי מתוחזק, משרדים וחנויות, ניהול מקצועי כולל אחזקה שוטפת, ליווי דיירים ותיאום עבודות. מיקום מרכזי.',
      image: '/images/properties/management-sheinkin-lobby.jpg',
      features: ['חניה', 'מעלית', 'אבטחה']
    }
  ];

  // Use real data or mock data based on toggle
  const properties = USE_REAL_DATA 
    ? (realProperties || []).map(prop => ({
        id: prop.id,
        title: prop.title || '',
        address: prop.address,
        city: prop.city,
        building_floors: prop.floor,
        property_size: prop.property_size,
        description: prop.description || '',
        image: prop.images[0]?.image_url || '/images/properties/building-management-1.jpg',
        features: [
          prop.parking ? 'חניה' : null,
          prop.elevator ? 'מעלית' : null,
          prop.balcony ? 'מרפסת' : null,
          prop.show_management_badge !== false ? 'ניהול מלא' : null
        ].filter(Boolean) as string[]
      }))
    : mockProperties;

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || property.city === cityFilter;

    return matchesSearch && matchesCity;
  });

  const cities = ['תל אביב'];

  const services = [
    { icon: Wrench, title: 'ניהול תחזוקה', description: 'תיאום עבודות תחזוקה, שיפוצים וטיפול בכל הבעיות הטכניות בנכס' },
    { icon: FileCheck, title: 'גביה ודיווח', description: 'גביית דמי שכירות, ועד בית ודיווח מפורט לבעלי הנכסים מדי חודש' },
    { icon: Users, title: 'ניהול דיירים', description: 'טיפול בפניות דיירים, חידוש חוזים וטיפול בכל הנושאים השוטפים' },
    { icon: ClipboardList, title: 'זמינות 24/7', description: 'מענה מיידי לכל הבעיות והפניות בכל שעות היום והלילה' },
  ];

  const stats = [
    { value: '300+', label: 'נכסים בניהול' },
    { value: '99%', label: 'שיעור שביעות רצון' },
    { value: '24', label: 'שעות מענה ביום' },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      <CompactHero
        title="ניהול נכסים"
        subtitle="ניהול מקצועי ומסור לנכס שלך"
        backgroundImage="/images/management-lobby.jpg"
      />

      {/* Properties Grid */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <Input
              placeholder="חיפוש נכס..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base"
            />
          </div>

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
                    {property.features.some(f => f === 'ניהול מלא') && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded font-bold text-sm">
                        בניהול מלא
                      </div>
                    )}
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
                          <Building className="h-4 w-4" />
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
                    <Button asChild className="w-full">
                      <a href={`/management/property/${property.id}`}>פרטים נוספים</a>
                    </Button>
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
            אנו מעניקים שירות מלא ומקצועי לניהול הנכסים שלכם, כדי שתוכלו להתרכז במה שחשוב לכם
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

    </div>
  );
};

export default Management;