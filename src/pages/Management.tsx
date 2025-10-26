import { useState } from 'react';
import HebrewHeader from '@/components/he/Header';
import HebrewFooter from '@/components/he/Footer';
import { RelizPropertyCard } from '@/components/he/RelizPropertyCard';
import VideoHero from '@/components/he/VideoHero';
import { Input } from '@/components/ui/input';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { useNavigate } from 'react-router-dom';
import { Wrench, FileCheck, Users, ClipboardList } from 'lucide-react';

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

  const navigate = useNavigate();

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <WhatsAppFloat />
      <HebrewHeader />
      
      <VideoHero
        title="ניהול נכסים"
        subtitle="ניהול מקצועי ומסור לנכס שלך"
        imageUrl="/images/management-lobby.jpg"
      />

      {/* Properties Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-4">
              נכסים בניהול
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground">
              ניהול נכסים
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
                  price={property.building_floors ? `${property.building_floors} קומות` : 'ניהול מלא'}
                  imageUrl={property.image}
                  type="בניהול"
                  onClick={() => navigate(`/management/property/${property.id}`)}
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
              ניהול נכסים מקצועי
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              שירות מלא ומקצועי לניהול הנכסים שלכם, כדי שתוכלו להתרכז במה שחשוב לכם
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

export default Management;