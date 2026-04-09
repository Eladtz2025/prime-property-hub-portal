import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Square, CheckCircle, Star, Users, TrendingUp } from 'lucide-react';
import { usePublicProperties } from "@/hooks/usePublicProperties";
import { Helmet } from "react-helmet";
import { removeAddressNumber } from '@/lib/utils';
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";

const EnglishRentals = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch real data from database
  const { data: realProperties, isLoading } = usePublicProperties({ propertyType: 'rental' });

  // Use real data with English fields from database
  const properties = (realProperties || []).map(prop => ({
    id: prop.id,
    title: prop.title_en || prop.title || '',
    address: prop.address,
    city: prop.city,
    neighborhood: prop.neighborhood_en || prop.neighborhood || prop.city,
    status: prop.status,
    monthly_rent: prop.monthly_rent || 0,
    rooms: prop.rooms,
    property_size: prop.property_size,
    description: prop.description_en || prop.description || '',
    image: prop.images[0]?.image_url || '',
    features: [
      prop.parking ? 'Parking' : null,
      prop.elevator ? 'Elevator' : null,
      prop.balcony ? 'Balcony' : null,
    ].filter(Boolean) as string[]
  }));

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = 
      property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const services = [
    { icon: CheckCircle, title: 'Professional Valuation', description: 'Accurate property valuation and recommendation on optimal rental price' },
    { icon: Star, title: 'Effective Marketing', description: 'Advertising the property on all relevant platforms and bringing quality tenants' },
    { icon: Users, title: 'Tenant Screening', description: 'Thorough screening of potential tenants including references and financial capability' },
    { icon: TrendingUp, title: 'Support & Management', description: 'Professional support throughout the rental period and handling all issues that arise' },
  ];

  const stats = [
    { value: '95%', label: 'Success rate in rentals' },
    { value: '30', label: 'Average days to rent' },
    { value: '200+', label: 'Properties in active rental' },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>Rental Properties in Tel Aviv - CITY MARKET Properties</title>
        <meta name="description" content="Apartments and properties for rent in Tel Aviv. Full professional service including valuation, effective marketing, tenant screening and ongoing support." />
        <meta property="og:title" content="Rental Properties - CITY MARKET Properties" />
        <meta property="og:description" content="Wide range of apartments and properties for rent in Tel Aviv with full professional service" />
        <meta property="og:image" content="https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/city-market-logo.png" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/rentals" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/rentals" />
      <OrganizationSchema language="en" />
      <WebSiteSchema language="en" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "Rentals", url: "https://www.ctmarketproperties.com/en/rentals" }
      ]} />
      <EnglishHeader />
      
      <FullScreenHero
        title="Apartments for Rent in Tel Aviv"
        backgroundImage="/images/rental-interior.jpg"
        minHeight="100vh"
      />

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

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading properties...</p>
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/en/property/${property.id}`)}>
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
                      ₪ {property.monthly_rent.toLocaleString()} /month
                    </div>
                    {/* Status Badge for Rented Properties */}
                    {(property as any).status === 'occupied' && (
                      <div className="absolute top-2 left-2 text-white px-3 py-1 rounded font-bold text-sm" style={{ backgroundColor: '#3A8C8C' }}>
                        Rented
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{property.neighborhood}</span>
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
                      <Link to={`/en/property/${property.id}`}>View Details</Link>
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
          <h2 className="text-3xl font-bold text-center mb-4">Our Rental Services</h2>
          <p className="text-center text-muted-foreground mb-12">
            We provide comprehensive professional service including all stages from valuation to signing the rental contract
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

export default EnglishRentals;
