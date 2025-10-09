import { useState } from 'react';
import CompactHero from '@/components/CompactHero';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Square, MessageCircle, X, Wrench, Check } from 'lucide-react';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const Rentals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');

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

  const filteredProperties = mockProperties.filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || property.city === cityFilter;
    const matchesRooms = roomsFilter === 'all' || property.rooms?.toString() === roomsFilter;
    const matchesPrice = !maxPrice || (property.monthly_rent && property.monthly_rent <= parseFloat(maxPrice));

    return matchesSearch && matchesCity && matchesRooms && matchesPrice;
  });

  const cities = ['תל אביב'];

  const services = [
    { icon: Check, title: 'הערכת שווי מקצועית', description: 'הערכה מדויקת של שווי הנכס והמלצה על מחיר השכירות האופטימלי' },
    { icon: Check, title: 'שיווק יעיל', description: 'פרסום הנכס בכל הפלטפורמות הרלוונטיות והבאת דיירים איכותיים' },
    { icon: Check, title: 'בדיקת דיירים', description: 'בדיקה יסודית של דיירים פוטנציאליים כולל המלצות ויכולת פיננסית' },
    { icon: Check, title: 'ליווי ותמיכה', description: 'ליווי מקצועי לאורך כל תקופת השכירות וטיפול בכל הבעיות שעולות' },
  ];

  const stats = [
    { value: '95%', label: 'שיעור הצלחה בהשכרות' },
    { value: '30', label: 'ימים ממוצע להשכרה' },
    { value: '200+', label: 'נכסים בהשכרה פעילה' },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      <CompactHero
        title="מומחי ההשכרות"
        subtitle="השכירו את הנכס שלכם בביטחון ובמקצועיות"
        backgroundImage="/images/rental-interior.jpg"
      />

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">דירות להשכרה</h2>
          <p className="text-center text-muted-foreground mb-8">
            מגוון רחב של דירות להשכרה באזורים מבוקשים עם שירות מקצועי ואמין
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
                    <Button asChild className="w-full">
                      <a href={`/rentals/property/${property.id}`}>פרטים נוספים</a>
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

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">למה לבחור בנו להשכרות?</h2>
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

export default Rentals;