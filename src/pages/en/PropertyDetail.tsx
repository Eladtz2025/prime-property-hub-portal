import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Home, Bath, Square, Building2, Phone, Share2, Facebook, Copy, Check, Car, MoveUp, TreePine, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ImageCarousel } from "@/components/ImageCarousel";
import { PropertyImage } from "@/types/property";
import { useState, useMemo } from "react";
import { usePublicProperty } from "@/hooks/usePublicProperty";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";

const EnglishPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Load property from database
  const { data: property, isLoading, error } = usePublicProperty(id);

  // Prepare texts for translation
  const textsToTranslate = useMemo(() => {
    if (!property) return [];
    return [
      property.title || '',
      property.description || '',
      property.address || '',
      property.city || ''
    ].filter(Boolean);
  }, [property]);

  // Use translation hook
  const { translations, isLoading: isTranslating } = useTranslation(textsToTranslate);

  // Convert property images to PropertyImage format
  const propertyImages: PropertyImage[] = property?.images.map(img => ({
    id: img.id,
    name: img.alt_text || 'Property Image',
    url: img.image_url,
    isPrimary: img.is_main,
    uploadedAt: new Date().toISOString(),
  })) || [];

  const handleWhatsApp = () => {
    const phone = '972545503055';
    const message = `Hello, I'm interested in ${property?.title}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:0545503055';
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'copy') => {
    const url = window.location.href;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || isTranslating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (!property || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => navigate('/en')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const getBackLink = () => {
    if (window.location.pathname.includes('rentals')) return '/en/rentals';
    if (window.location.pathname.includes('sales')) return '/en/sales';
    if (window.location.pathname.includes('management')) return '/en/management';
    return '/en';
  };

  const getPropertyTypeLabel = () => {
    if (property.property_type === 'rental') return 'For Rent';
    if (property.property_type === 'sale') return 'For Sale';
    return '';
  };

  const getPriceDisplay = () => {
    if (property.property_type === 'rental' && property.monthly_rent) {
      return `₪${property.monthly_rent.toLocaleString()}/month`;
    }
    if (property.property_type === 'sale' && property.price) {
      return `₪${property.price.toLocaleString()}`;
    }
    return '';
  };

  const getKeyPoints = () => {
    const translatedCity = translations[property.city] || property.city;
    const points = [
      `Excellent location in ${translatedCity}`,
      property.rooms ? `${property.rooms} spacious rooms` : 'Spacious area',
      `${property.property_size} sqm`,
    ];

    if (property.parking) points.push('Private parking');
    if (property.elevator) points.push('Elevator in building');
    if (property.balcony) points.push('Balcony');

    return points;
  };

  // Get translated texts
  const translatedTitle = translations[property.title] || property.title;
  const translatedDescription = translations[property.description] || property.description;
  const translatedAddress = translations[property.address] || property.address;
  const translatedCity = translations[property.city] || property.city;

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Back Button */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 font-montserrat"
            onClick={() => navigate(getBackLink())}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Button>
        </div>

        {/* Image with Price Badge */}
        <div className="relative">
          <ImageCarousel images={propertyImages} priceLabel="" />
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-lg font-montserrat">
            {getPriceDisplay()}
          </div>
        </div>

        {/* Property Info */}
        <div className="px-4 py-6 space-y-6">
          {/* Title and Address */}
          <div>
            <Badge className="mb-3 bg-primary text-white font-montserrat">{getPropertyTypeLabel()}</Badge>
            <h1 className="text-2xl font-playfair font-bold mb-3">{translatedTitle}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span className="font-montserrat">{translatedAddress}, {translatedCity}</span>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Bath className="h-5 w-5 text-primary" />
              <span className="font-montserrat">{property.bathrooms} Bathrooms</span>
            </div>
            {property.rooms && (
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <span className="font-montserrat">{property.rooms} Rooms</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-montserrat">Floor {property.floor === 0 ? 'Ground' : property.floor}</span>
            </div>
            <div className="flex items-center gap-3">
              <Square className="h-5 w-5 text-primary" />
              <span className="font-montserrat">{property.property_size} sqm</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex gap-2 flex-wrap">
            {property.parking && (
              <Badge variant="secondary" className="text-sm font-montserrat">
                <Car className="h-3 w-3 mr-1" />
                Parking
              </Badge>
            )}
            {property.elevator && (
              <Badge variant="secondary" className="text-sm font-montserrat">
                <MoveUp className="h-3 w-3 mr-1" />
                Elevator
              </Badge>
            )}
            {property.balcony && (
              <Badge variant="secondary" className="text-sm font-montserrat">
                <TreePine className="h-3 w-3 mr-1" />
                Balcony
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-playfair font-semibold mb-3">Property Description</h3>
            <p className="text-muted-foreground font-montserrat leading-relaxed">
              {translatedDescription}
            </p>
          </div>

          {/* Key Points */}
          <div>
            <h3 className="text-lg font-playfair font-semibold mb-3">Key Features</h3>
            <div className="space-y-2">
              {getKeyPoints().map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-montserrat">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pb-4">
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90 h-12 font-montserrat" onClick={handleWhatsApp}>
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
            <Button variant="outline" className="w-full gap-2 h-12 font-montserrat" onClick={handleCall}>
              <Phone className="h-5 w-5" />
              Call Us
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2 font-montserrat"
          onClick={() => navigate(getBackLink())}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Badge and Title */}
            <div>
              <Badge className="mb-3 bg-primary text-white font-montserrat">{getPropertyTypeLabel()}</Badge>
              <h1 className="text-2xl font-playfair font-bold mb-2">{translatedTitle}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span className="text-base font-montserrat">{translatedAddress}, {translatedCity}</span>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Bath className="h-5 w-5 text-primary" />
                <span className="text-sm font-montserrat">
                  {property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                </span>
              </div>
              {property.rooms && (
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="text-sm font-montserrat">{property.rooms} Rooms</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-montserrat">
                  Floor {property.floor === 0 ? 'Ground' : property.floor}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Square className="h-5 w-5 text-primary" />
                <span className="text-sm font-montserrat">{property.property_size} sqm</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {property.parking && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90 font-montserrat">
                  <Car className="h-3 w-3 mr-1" />
                  Parking
                </Badge>
              )}
              {property.elevator && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90 font-montserrat">
                  <MoveUp className="h-3 w-3 mr-1" />
                  Elevator
                </Badge>
              )}
              {property.balcony && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90 font-montserrat">
                  <TreePine className="h-3 w-3 mr-1" />
                  Balcony
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90 font-montserrat" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" className="w-full gap-2 font-montserrat" onClick={handleCall}>
                <Phone className="h-4 w-4" />
                Call Us
              </Button>
            </div>

            {/* Share */}
            <Card className="p-4">
              <h3 className="font-playfair font-semibold mb-3 text-sm">Share This Property</h3>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('whatsapp')}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('facebook')}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('copy')}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Image Gallery */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <ImageCarousel images={propertyImages} priceLabel={getPriceDisplay()} />
          </div>
        </div>

        {/* About Property */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-playfair font-bold mb-4">About This Property</h2>
          <p className="text-muted-foreground font-montserrat leading-relaxed mb-6">
            {translatedDescription}
          </p>

          <h3 className="text-xl font-playfair font-semibold mb-4">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getKeyPoints().map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="font-montserrat">{point}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-playfair font-bold mb-6">Get In Touch</h2>
          <p className="text-muted-foreground font-montserrat mb-6">
            Interested in this property? Leave your details and we'll get back to you soon.
          </p>
          
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast({
              title: "Form Submitted Successfully",
              description: "We'll get back to you soon",
            });
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 font-montserrat">Full Name *</label>
                <Input placeholder="Enter your full name" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 font-montserrat">Email *</label>
                <Input type="email" placeholder="example@email.com" required />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-montserrat">Phone</label>
              <Input type="tel" placeholder="050-1234567" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-montserrat">Message *</label>
              <textarea 
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-montserrat ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell us what you're looking for..."
                required
              />
            </div>

            <Button type="submit" className="w-full font-montserrat">
              Send Inquiry
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EnglishPropertyDetail;
