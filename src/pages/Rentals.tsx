import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CompactHero from '@/components/CompactHero';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, MessageCircle, X, Check } from 'lucide-react';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ContactSection from '@/components/ContactSection';
import { Skeleton } from '@/components/ui/skeleton';

const Rentals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');

  const { data: properties, isLoading } = useQuery({
    queryKey: ['rental-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            id,
            image_url,
            alt_text,
            is_main,
            order_index
          )
        `)
        .eq('property_type', 'rental')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProperties = properties?.filter((property) => {
    const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'all' || property.city === cityFilter;
    const matchesRooms = roomsFilter === 'all' || property.rooms?.toString() === roomsFilter;
    const matchesPrice = !maxPrice || (property.monthly_rent && property.monthly_rent <= parseFloat(maxPrice));

    return matchesSearch && matchesCity && matchesRooms && matchesPrice;
  });

  const cities = [...new Set(properties?.map(p => p.city).filter(Boolean))];

  const services = [
    { icon: Check, title: 'הערכת שווי מקצועית', description: 'הערכת שווי מדויקת לנכס שלכם' },
    { icon: Check, title: 'שיווק יעיל', description: 'חשיפה מקסימלית בכל הערוצים' },
    { icon: Check, title: 'בדיקת דיירים', description: 'בדיקה יסודית של דיירים פוטנציאליים' },
    { icon: Check, title: 'ליווי ותמיכה', description: 'תמיכה מלאה לאורך כל התהליך' },
  ];

  const stats = [
    { value: '95%', label: 'שיעור הצלחה' },
    { value: '30', label: 'ימים ממוצע להשכרה' },
    { value: '200+', label: 'נכסים בהשכרה פעילה' },
  ];

  return (
    <div className="min-h-screen">
      <WhatsAppFloat />
      
      <CompactHero
        title="נכסים להשכרה"
        subtitle="מצא את הדירה המושלמת שלך"
        backgroundImage="/images/rental-interior.jpg"
      />

      {/* Filters */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="חיפוש לפי כתובת או עיר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הערים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הערים</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roomsFilter} onValueChange={setRoomsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="מספר חדרים" />
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
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="מחיר מקסימלי"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchTerm('');
                  setCityFilter('all');
                  setRoomsFilter('all');
                  setMaxPrice('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => {
                const mainImage = property.property_images?.find(img => img.is_main) || property.property_images?.[0];
                
                return (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <img
                        src={mainImage?.image_url || '/images/properties/placeholder.jpg'}
                        alt={property.title || property.address}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {property.featured && (
                        <Badge className="absolute top-2 right-2">מומלץ</Badge>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{property.title || property.address}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{property.city}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary mb-4">
                        ₪{property.monthly_rent?.toLocaleString()}/חודש
                      </div>
                      <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                        {property.rooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.rooms}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        {property.property_size && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{property.property_size} מ"ר</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {property.parking && <Badge variant="outline">חניה</Badge>}
                        {property.elevator && <Badge variant="outline">מעלית</Badge>}
                        {property.balcony && <Badge variant="outline">מרפסת</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild className="flex-1">
                          <Link to={`/rentals/property/${property.id}`}>פרטים נוספים</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const phone = '972545503055';
                            const message = `שלום, מעוניין/ת במידע על ${property.title || property.address}`;
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">לא נמצאו נכסים התואמים את הסינון</p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">השירותים שלנו</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="p-6 text-center">
                <service.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-lg text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </div>
  );
};

export default Rentals;