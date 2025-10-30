import { useState, useMemo } from 'react';
import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Square, TrendingUp, Shield, Users, Award } from 'lucide-react';
import { usePublicProperties } from "@/hooks/usePublicProperties";
import { useTranslation } from "@/hooks/useTranslation";

const EnglishSales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch real data from database
  const { data: realProperties, isLoading } = usePublicProperties({ propertyType: 'sale' });

  // Collect all texts that need translation
  const textsToTranslate = useMemo(() => {
    if (!realProperties) return [];
    const texts: string[] = [];
    realProperties.forEach(prop => {
      if (prop.title) texts.push(prop.title);
      if (prop.address) texts.push(prop.address);
      if (prop.description) texts.push(prop.description);
    });
    return [...new Set(texts)]; // Remove duplicates
  }, [realProperties]);

  const { translations, isLoading: isTranslating } = useTranslation(textsToTranslate);

  // Use real data
  const properties = (realProperties || []).map(prop => ({
    id: prop.id,
    title: prop.title || '',
    address: prop.address,
    city: prop.city,
    price: prop.monthly_rent || 0,
    rooms: prop.rooms,
    property_size: prop.property_size,
    description: prop.description || '',
    image: prop.images[0]?.image_url || '',
    features: [
      prop.parking ? 'Parking' : null,
      prop.elevator ? 'Elevator' : null,
      prop.balcony ? 'Balcony' : null,
    ].filter(Boolean) as string[]
  }));

  const filteredProperties = properties.filter((property) => {
    const translatedAddress = translations[property.address || ''] || property.address || '';
    const translatedTitle = translations[property.title || ''] || property.title || '';
    const matchesSearch = translatedAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         translatedTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const services = [
    { icon: TrendingUp, title: 'Consultation & Valuation', description: 'Professional assessment of property value and guidance on optimal sale price' },
    { icon: Shield, title: 'Full Legal Support', description: 'Handling all legal matters, checking for liens and encumbrances' },
    { icon: Users, title: 'Professional Negotiation', description: 'Expert negotiation with potential buyers to achieve the best price' },
    { icon: Award, title: 'Advanced Marketing', description: 'Advertising your property on all relevant platforms with professional photography' },
  ];

  const stats = [
    { value: '98%', label: 'Success rate in sales' },
    { value: '45', label: 'Average days to sale' },
    { value: '150+', label: 'Properties sold this year' },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <EnglishHeader />
      <section className="relative h-[30vh] overflow-hidden">
        <img
          src="/images/en/hero-telaviv.jpg"
          alt="Properties for Sale"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white">
              Properties for Sale
            </h1>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {isLoading || isTranslating ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {isLoading ? 'Loading properties...' : 'Translating...'}
              </p>
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={property.image || '/images/en/properties/luxury-rothschild.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/en/properties/luxury-rothschild.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded font-bold text-sm">
                      ₪ {property.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{translations[property.title] || property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{translations[property.address] || property.address}</span>
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
                          <span>{property.property_size} m²</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {translations[property.description] || property.description}
                    </p>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {property.features.map((feature, idx) => (
                        <Badge key={idx} className="bg-orange-500 hover:bg-orange-600 text-white">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild className="w-full">
                      <a href={`/en/property/${property.id}`}>View Details</a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No properties found</p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Our Sales Services</h2>
          <p className="text-center text-muted-foreground mb-12">
            We provide comprehensive professional service including all stages from valuation to signing the sales contract
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

      <EnglishFooter />
    </div>
  );
};

export default EnglishSales;
