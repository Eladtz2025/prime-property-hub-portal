import { useState } from 'react';
import { Link } from 'react-router-dom';
import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import FullScreenHero from '@/components/FullScreenHero';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Bath, Square, Building2, TrendingUp, Shield, Users, Award } from 'lucide-react';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { Helmet } from "react-helmet";
import { removeAddressNumber } from '@/lib/utils';

// Use real database data
const USE_REAL_DATA = true;

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Fetch real data from database
  const { data: realProperties, isLoading } = usePublicProperties({ propertyType: 'sale' });

  // Mock data - נכסים לדוגמה
  const mockProperties = [
    {
      id: '1',
      title: 'דירת 5 חדרים משופצת ברחוב רוטשילד',
      address: 'רוטשילד 88, תל אביב',
      city: 'תל אביב',
      price: 5200000,
      rooms: 5,
      property_size: 130,
      description: 'דירת יוקרה בבניין בוטיק משופץ, תקרות גבוהות, חלונות גדולים, מרפסת מרווחה. מיקום פרימיום על השדרה היוקרתית.',
      image: '/images/properties/sale-rothschild-exterior.jpg',
      features: ['חניה', 'מעלית', 'מרפסת']
    },
    {
      id: '2',
      title: 'פנטהאוז 4 חדרים ברחוב אלנבי',
      address: 'אלנבי 234, תל אביב',
      city: 'תל אביב',
      price: 6800000,
      rooms: 4,
      property_size: 140,
      description: 'פנטהאוז מדהים עם גג פרטי מרהיב, נוף לעיר, עיצוב מודרני, מטבח שף, 2 חדרי רחצה יוקרתיים. חניה כפולה.',
      image: '/images/properties/penthouse-allenby.jpg',
      features: ['חניה', 'מעלית', 'מרפסת', 'נוף פנורמי']
    },
    {
      id: '3',
      title: 'דירת 3 חדרים בסגנון באוהאוס ברחוב נחמני',
      address: 'נחמני 14, תל אביב',
      city: 'תל אביב',
      price: 3900000,
      rooms: 3,
      property_size: 85,
      description: 'דירה קלאסית בבניין באוהאוס משופץ, שימור אדריכלי, פרקט מקורי, תקרות גבוהות. קרוב לרוטשילד ולבתי קפה טרנדיים.',
      image: '/images/properties/classic-nahmani.jpg',
      features: ['מרפסת', 'סגנון באוהאוס']
    },
    {
      id: '4',
      title: 'דירת 4 חדרים עם מרפסת גדולה ברחוב דיזנגוף',
      address: 'דיזנגוף 201, תל אביב',
      city: 'תל אביב',
      price: 4500000,
      rooms: 4,
      property_size: 120,
      description: 'דירת גן משופצת, מרפסת ענקית 60 מ"ר, 3 חדרי שינה, סלון מרווח, מטבח חדש. אידיאלי למשפחה.',
      image: '/images/properties/sale-dizengoff-terrace.jpg',
      features: ['חניה', 'מעלית', 'מרפסת גדולה']
    }
  ];

  // Use real data or mock data based on toggle
  const properties = USE_REAL_DATA 
    ? (realProperties || []).map(prop => ({
        id: prop.id,
        title: prop.title || '',
        address: prop.address,
        city: prop.city,
        neighborhood: (prop as any).neighborhood,
        status: prop.status,
        price: prop.monthly_rent || 0, // Will need to add price field later for sales
        rooms: prop.rooms,
        property_size: prop.property_size,
        description: prop.description || '',
        image: prop.images[0]?.image_url || '',
        features: [
          prop.parking ? 'חניה' : null,
          prop.elevator ? 'מעלית' : null,
          prop.balcony ? 'מרפסת' : null,
        ].filter(Boolean) as string[]
      }))
    : mockProperties;

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || property.city === cityFilter;
    const matchesRooms = roomsFilter === 'all' || property.rooms?.toString() === roomsFilter;
    const matchesPrice = !maxPrice || (property.price && property.price <= parseFloat(maxPrice));

    return matchesSearch && matchesCity && matchesRooms && matchesPrice;
  });

  const cities = ['תל אביב'];

  const services = [
    { icon: TrendingUp, title: 'ייעוץ והערכת שווי', description: 'הערכה מקצועית של שווי הנכס והכוונה לגבי מחיר המכירה האופטימלי' },
    { icon: Shield, title: 'ליווי משפטי מלא', description: 'טיפול בכל הנושאים המשפטיים, בדיקת הימצאות מאסרים ועיקולים' },
    { icon: Users, title: 'מו"מ מקצועי', description: 'ניהול משא ומתן מקצועי עם קונים פוטנציאליים להשגת המחיר הטוב ביותר' },
    { icon: Award, title: 'שיווק מתקדם', description: 'פרסום הנכס בכל הפלטפורמות הרלוונטיות עם צילום מקצועי ותיאור מפורט' },
  ];

  const stats = [
    { value: '98%', label: 'שיעור הצלחה במכירות' },
    { value: '45', label: 'ימים ממוצע למכירה' },
    { value: '150+', label: 'נכסים נמכרו השנה' },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="rtl">
      <HebrewHeader />
      
      {/* Hero Section */}
      <FullScreenHero
        title="מכירות"
        backgroundImage="/images/sales-villa.jpg"
        minHeight="100vh"
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
                      src={property.image || '/images/sales-villa.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/sales-villa.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded font-bold text-sm">
                      ₪ {property.price.toLocaleString()}
                    </div>
                    {/* Status Badge for Sold Properties */}
                    {(property as any).status === 'occupied' && (
                      <div className="absolute top-2 left-2 text-white px-3 py-1 rounded font-bold text-sm" style={{ backgroundColor: '#3A8C8C' }}>
                        נמכר
                      </div>
                    )}
                  </div>
                  <div className="p-6 text-right">
                    <h3 className="text-lg font-bold mb-2">{property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm" dir="rtl">
                      <MapPin className="h-4 w-4" />
                      <span>{(property as any).neighborhood || property.city}</span>
                    </div>
                    <div className="flex gap-4 mb-3 text-sm text-muted-foreground" dir="rtl">
                      {property.rooms && (
                        <div className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
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
                    <div className="flex gap-2 mb-4 flex-wrap justify-end">
                      {property.features.map((feature, idx) => (
                        <Badge key={idx} className="bg-orange-500 hover:bg-orange-600 text-white">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/he/property/${property.id}`}>פרטים נוספים</Link>
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
          <h2 className="text-3xl font-bold text-center mb-4">השירותים שלנו במכירות</h2>
          <p className="text-center text-muted-foreground mb-12">
            אנו מעניקים שירות מלא ומקצועי הכולל את כל השלבים מהערכת שווי ועד חתימה על חוזה המכירה
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

      <HebrewFooter />
    </div>
  );
};

export default Sales;
