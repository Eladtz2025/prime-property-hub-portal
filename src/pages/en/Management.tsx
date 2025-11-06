import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { usePublicProperties } from "@/hooks/usePublicProperties";
import { useTranslation } from "@/hooks/useTranslation";
import { Shield, DollarSign, Wrench, FileText, Phone, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet";
import { FlippablePropertyCard } from "@/components/en/FlippablePropertyCard";
import { ConsultationModal } from "@/components/en/ConsultationModal";

const EnglishManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const { data: properties, isLoading } = usePublicProperties({ propertyType: 'management' });

  // Translate common Tel Aviv street names
  const translateStreetName = (hebrewAddress: string): string => {
    const streetMap: Record<string, string> = {
      'אלנבי': 'Allenby',
      'שינקין': 'Sheinkin',
      'שיינקין': 'Sheinkin',
      'דיזנגוף': 'Dizengoff',
      'רוטשילד': 'Rothschild',
      'בן יהודה': 'Ben Yehuda',
      'נחמני': 'Nahmani',
      'ביאליק': 'Bialik',
      'פרישמן': 'Frishman',
      'גורדון': 'Gordon',
      'מונטיפיורי': 'Montefiori',
      'תל אביב': 'Tel Aviv',
      'יפו': 'Jaffa',
    };

    let translated = hebrewAddress;
    Object.entries(streetMap).forEach(([hebrew, english]) => {
      translated = translated.replace(new RegExp(hebrew, 'g'), english);
    });
    
    return translated;
  };

  // Collect all texts that need translation
  const textsToTranslate = useMemo(() => {
    if (!properties) return [];
    const texts: string[] = [];
    properties.forEach(prop => {
      if (prop.title) texts.push(prop.title);
      if (prop.address) texts.push(prop.address);
      if (prop.description) texts.push(prop.description);
    });
    return [...new Set(texts)]; // Remove duplicates
  }, [properties]);

  const { translations, isLoading: isTranslating } = useTranslation(textsToTranslate);

  const filteredProperties = (properties || []).filter((property) => {
    const translatedAddress = translations[property.address || ''] || property.address || '';
    const matchesSearch = translatedAddress.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const services = [
    {
      icon: <DollarSign className="w-10 h-10 text-primary" />,
      title: "Rent Collection",
      description: "Automated rent collection and financial reporting. Never worry about late payments again.",
    },
    {
      icon: <Wrench className="w-10 h-10 text-primary" />,
      title: "Maintenance",
      description: "24/7 maintenance coordination with vetted contractors. Quick response to tenant needs.",
    },
    {
      icon: <FileText className="w-10 h-10 text-primary" />,
      title: "Legal Compliance",
      description: "Full legal compliance and documentation. Stay protected with expert lease management.",
    },
    {
      icon: <Phone className="w-10 h-10 text-primary" />,
      title: "Tenant Relations",
      description: "Professional tenant screening and communication. Quality tenants, happy owners.",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-primary" />,
      title: "Financial Optimization",
      description: "Maximize your ROI with strategic pricing and cost management.",
    },
    {
      icon: <Shield className="w-10 h-10 text-primary" />,
      title: "Property Protection",
      description: "Regular inspections and preventive maintenance to preserve your investment.",
    },
  ];

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <title>Property Management - City Market Properties | Tel Aviv</title>
        <meta name="description" content="Professional property management services in Tel Aviv. Rent collection, maintenance, legal compliance, and tenant relations. Maximize your ROI with expert management." />
        <meta property="og:title" content="Property Management - City Market Properties" />
        <meta property="og:description" content="Expert property management services - from single apartments to entire buildings." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://citymarket.co.il/en/management" />
      </Helmet>
      <EnglishHeader />

      {/* Hero Section */}
      <FullScreenHero
        title="Property Management"
        backgroundImage="/images/management-lobby.jpg"
        minHeight="60vh"
      />

      {/* Properties Grid */}
      <section className="py-16 bg-muted/50">
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
              {filteredProperties.map((property) => {
                // Translate the address
                const translatedAddress = translateStreetName(property.address || '');
                const streetName = translatedAddress.split(',')[0] || translatedAddress;
                
                // Create English titles based on property data
                const buildingType = property.property_size && property.property_size > 400 
                  ? 'Commercial Building' 
                  : 'Residential Building';
                
                const englishTitle = `${buildingType} on ${streetName}`;
                
                return (
                  <FlippablePropertyCard
                    key={property.id}
                    title={englishTitle}
                    location={translatedAddress}
                    price={property.show_management_badge ? 'Full Management' : 'Property Management'}
                    imageUrl={property.images[0]?.image_url || '/images/properties/building-management-1.jpg'}
                    type={property.property_size ? `${property.property_size} m²` : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No properties found</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
              What We Manage
            </h2>
            <p className="font-montserrat text-lg text-muted-foreground max-w-2xl mx-auto">
              From single apartments to entire buildings, we handle everything
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="font-montserrat text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Ready to Partner with Experts?
          </h2>
          <p className="font-montserrat text-base mb-6 max-w-2xl mx-auto text-muted-foreground">
            Let us handle the details while you enjoy peace of mind and consistent returns
          </p>
           <Button
             size="lg"
             className="font-montserrat font-semibold px-8"
             aria-label="Get a free property management consultation"
             onClick={() => setConsultationModalOpen(true)}
           >
             Get a Free Consultation
           </Button>
        </div>
      </section>

      <ConsultationModal 
        open={consultationModalOpen} 
        onOpenChange={setConsultationModalOpen} 
      />

      <EnglishFooter />
    </div>
  );
};

export default EnglishManagement;
