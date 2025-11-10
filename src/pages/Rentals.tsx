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
import { MapPin, Home, Bath, Square, MessageCircle, Building, Settings, CheckCircle, Star, Users, TrendingUp } from 'lucide-react';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { Helmet } from "react-helmet";

// Use real database data
const USE_REAL_DATA = true;

const Rentals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Fetch real data from database
  const { data: realProperties, isLoading } = usePublicProperties({ propertyType: 'rental' });

  // Mock data - נכסים לדוגמה
  const mockProperties = [
    {
      id: '1',
      title: 'דירת 4 חדרים משופצת ברחוב דיזנגוף',
      address: 'דיזנגוף 125, תל אביב',
      city: 'תל אביב',
      monthly_rent: 8500,
      rooms: 4,
      property_size: 95,
      description: 'דירה יפהפייה ומשופצת בלב הצפון הישן, תקרות גבוהות, ריצוף מקורי, מרפסת גדולה עם נוף לשדרות. במרחק הליכה מהים, בתי קפה ומסעדות.',
      image: '/images/properties/rental-dizengoff-interior.jpg',
      features: ['חניה', 'מעלית', 'מרפסת']
    },
    {
      id: '2',
      title: 'דירת 3 חדרים בשכונת בן יהודה',
      address: 'בן יהודה 43, תל אביב',
      city: 'תל אביב',
      monthly_rent: 7200,
      rooms: 3,
      property_size: 75,
      description: 'דירה מקסימה עם אופי בשכונה שקטה, 2 חדרי שינה מרווחים, מטבח מודרני, מזגן בכל חדר. קרוב לתחבורה ציבורית ולכל השירותים.',
      image: '/images/properties/rental-ben-yehuda-kitchen.jpg',
      features: ['מרפסת']
    },
    {
      id: '3',
      title: 'דירת 3 חדרים משופצת ברחוב גורדון',
      address: 'גורדון 18, תל אביב',
      city: 'תל אביב',
      monthly_rent: 6800,
      rooms: 3,
      property_size: 65,
      description: 'דירה חמודה ומשופצת בשכונת נווה צדק, קרוב לחוף הים, 2 חדרי שינה, סלון מואר, מטבח מעוצב. מתאים לזוג או משפחה קטנה.',
      image: '/images/properties/rental-gordon-bedroom.jpg',
      features: ['מרפסת']
    },
    {
      id: '4',
      title: 'סטודיו מרוהט ברחוב פרישמן',
      address: 'פרישמן 45, תל אביב',
      city: 'תל אביב',
      monthly_rent: 4500,
      rooms: 1,
      property_size: 32,
      description: 'סטודיו מעוצב ומרוהט, מטבח פתוח, אזור מיטה מופרד, מרפסת קטנה. מתאים לעצמאי או זוג צעיר. במרחק הליכה מהים.',
      image: '/images/properties/studio-frishman.jpg',
      features: ['מעלית', 'מרפסת']
    },
    {
      id: '5',
      title: 'דירת 2 חדרים ברחוב ביאליק',
      address: 'ביאליק 12, תל אביב',
      city: 'תל אביב',
      monthly_rent: 5500,
      rooms: 2,
      property_size: 55,
      description: 'דירה נעימה במיקום מרכזי, חדר שינה אחד, סלון בהיר, מטבח מאובזר. קרוב לתחנת רכבת ולמרכזי קניות. מתאים ליחיד או זוג.',
      image: '/images/properties/2br-bialik.jpg',
      features: []
    }
  ];

  // Use real data or mock data based on toggle
  const properties = USE_REAL_DATA 
    ? (realProperties || []).map(prop => ({
        id: prop.id,
        title: prop.title || '',
        address: prop.address,
        city: prop.city,
        monthly_rent: prop.monthly_rent || 0,
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
    const matchesPrice = !maxPrice || (property.monthly_rent && property.monthly_rent <= parseFloat(maxPrice));

    return matchesSearch && matchesCity && matchesRooms && matchesPrice;
  });

  const cities = ['תל אביב'];

  const services = [
    { icon: CheckCircle, title: 'הערכת שווי מקצועית', description: 'הערכה מדויקת של שווי הנכס והמלצה על מחיר השכירות האופטימלי' },
    { icon: Star, title: 'שיווק יעיל', description: 'פרסום הנכס בכל הפלטפורמות הרלוונטיות והבאת דיירים איכותיים' },
    { icon: Users, title: 'בדיקת דיירים', description: 'בדיקה יסודית של דיירים פוטנציאליים כולל המלצות ויכולת פיננסית' },
    { icon: TrendingUp, title: 'ליווי ותמיכה', description: 'ליווי מקצועי לאורך כל תקופת השכירות וטיפול בכל הבעיות שעולות' },
  ];

  const stats = [
    { value: '95%', label: 'שיעור הצלחה בהשכרות' },
    { value: '30', label: 'ימים ממוצע להשכרה' },
    { value: '200+', label: 'נכסים בהשכרה פעילה' },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="rtl">
      <WhatsAppFloat />
      <HebrewHeader />
      
      {/* Hero Section */}
      <FullScreenHero
        title="השכרות"
        backgroundImage="/images/rental-interior.jpg"
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
                      src={property.image || '/images/rental-interior.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/rental-interior.jpg';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded font-bold text-sm">
                      ₪ {property.monthly_rent.toLocaleString()} לחודש
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
                    <div className="flex gap-2 mb-4 flex-wrap">
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
          <h2 className="text-3xl font-bold text-center mb-4">השירותים שלנו בהשכרות</h2>
          <p className="text-center text-muted-foreground mb-12">
            אנו מעניקים שירות מלא ומקצועי הכולל את כל השלבים מהערכת שווי ועד חתימה על חוזה השכירות
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

export default Rentals;