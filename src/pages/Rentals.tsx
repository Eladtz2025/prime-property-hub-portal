import { useState } from 'react';
import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import { RelizPropertyCard } from '@/components/he/RelizPropertyCard';
import VideoHero from '@/components/he/VideoHero';
import { Input } from '@/components/ui/input';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Star, Users, TrendingUp } from 'lucide-react';

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

  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <WhatsAppFloat />
      <HebrewHeader />
      
      <VideoHero
        title="השכרות"
        subtitle="השכירו את הנכס שלכם בביטחון ובמקצועיות"
        imageUrl="/images/rental-interior.jpg"
      />

      {/* Properties Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              נכסים זמינים להשכרה
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              נכסים להשכרה
            </h2>
          </div>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <Input
              placeholder="חיפוש נכס..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base px-6 bg-background border border-border focus:border-primary"
            />
          </div>

          {filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProperties.map((property) => (
                <RelizPropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  location={property.address}
                  price={`₪${property.monthly_rent.toLocaleString()}/חודש`}
                  imageUrl={property.image}
                  type="להשכרה"
                  onClick={() => navigate(`/rentals/property/${property.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-montserrat text-lg text-muted-foreground">לא נמצאו נכסים התואמים את הסינון</p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              השירותים שלנו
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-6">
              השכרות מקצועיות
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              שירות מלא ומקצועי הכולל את כל השלבים מהערכת שווי ועד חתימה על חוזה השכירות
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map((service, index) => (
              <div key={index} className="p-8 border border-border hover:shadow-card transition-shadow">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-normal mb-2">{service.title}</h3>
                    <p className="font-montserrat text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default Rentals;