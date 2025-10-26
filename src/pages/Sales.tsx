import { useState } from 'react';
import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import { RelizPropertyCard } from '@/components/he/RelizPropertyCard';
import VideoHero from '@/components/he/VideoHero';
import { Input } from '@/components/ui/input';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Users, Award } from 'lucide-react';

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

  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <WhatsAppFloat />
      <HebrewHeader />
      
      <VideoHero
        title="מכירות"
        subtitle="מתמחים במכירת נכסים ברחבי הארץ"
        imageUrl="/images/sales-villa.jpg"
      />

      {/* Properties Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              נכסים זמינים למכירה
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              נכסים למכירה
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
                  price={`₪${property.price.toLocaleString()}`}
                  imageUrl={property.image}
                  type="למכירה"
                  onClick={() => navigate(`/sales/property/${property.id}`)}
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
              מכירות מקצועיות
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              שירות מלא ומקצועי הכולל את כל השלבים מהערכת שווי ועד חתימה על חוזה המכירה
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

export default Sales;
