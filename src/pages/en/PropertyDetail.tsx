import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Home, Bath, Square, Building2, Phone, Check, Car, MoveUp, TreePine, MessageCircle, ChevronRight, Trees, DollarSign, Share2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ImageCarousel } from "@/components/ImageCarousel";
import { PropertyImage } from "@/types/property";
import { usePublicProperty } from "@/hooks/usePublicProperty";
import { Skeleton } from "@/components/ui/skeleton";
import EnglishFooter from "@/components/en/Footer";
import EnglishHeader from "@/components/en/Header";

import { Helmet } from "react-helmet";
const EnglishPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load property from database
  const { data: property, isLoading, error } = usePublicProperty(id);

  // Get English texts from database
  const translatedTitle = property?.title_en || property?.title || '';
  const translatedDescription = property?.description_en || property?.description || '';
  const translatedNeighborhood = property?.neighborhood_en || property?.neighborhood || property?.city || '';

  // Convert property images to PropertyImage format
  const allImages: (PropertyImage & { isFurnished?: boolean })[] = property?.images.map(img => ({
    id: img.id,
    name: img.alt_text || 'Property Image',
    url: img.image_url,
    isPrimary: img.is_main,
    uploadedAt: new Date().toISOString(),
    mediaType: img.media_type || 'image',
    isFurnished: img.is_furnished || false,
  })) || [];

  const propertyImages = allImages.filter(img => !img.isFurnished);
  const furnishedImages = allImages.filter(img => img.isFurnished);

  const handleWhatsApp = () => {
    const agentPhone = property?.agent?.phone;
    const phone = agentPhone 
      ? agentPhone.replace(/^0/, '972').replace(/\D/g, '') 
      : '972545503055';
    const message = `שלום אנו מתעניינים לגבי הדירה ב${translatedTitle}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    const agentPhone = property?.agent?.phone;
    const phone = agentPhone || '0545503055';
    window.location.href = `tel:${phone}`;
  };

  const getShareUrl = () => {
    const baseEdgeFunctionUrl = 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-property';
    return `${baseEdgeFunctionUrl}?id=${id}&lang=en`;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Link copied to clipboard",
    });
  };

  if (isLoading) {
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

  const handleBack = () => {
    navigate(-1);
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
    const points = [
      `Excellent location in ${translatedNeighborhood}`,
      property.rooms ? `${property.rooms} spacious rooms` : 'Spacious area',
      `${property.property_size} sqm`,
    ];

    if (property.parking) points.push('Private parking');
    if (property.elevator) points.push('Elevator in building');
    if (property.balcony) points.push('Balcony');
    if (property.yard) points.push('Private yard');

    return points;
  };

  const ogImage = property.images[0]?.image_url || 'https://www.ctmarketproperties.com/city-market-logo.png';
  const ogDescription = translatedDescription || `${property.rooms} rooms in ${translatedNeighborhood}`;
  
  return (
    <div className="min-h-screen english-luxury pt-16" dir="ltr">
      <EnglishHeader />
      <Helmet>
        <title>{translatedTitle} - City Market Properties</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={translatedTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={translatedTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Breadcrumbs */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 border-b">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/en" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={property.property_type === 'sale' ? '/en/sales' : '/en/rentals'} className="hover:text-primary transition-colors">
              {property.property_type === 'sale' ? 'For Sale' : 'For Rent'}
            </Link>
          <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Property #{property.property_number}</span>
          </nav>
        </div>

        {/* Image Gallery */}
        <ImageCarousel images={propertyImages} furnishedImages={furnishedImages} priceLabel="" furnishedButtonLabel="Show me the apartment furnished" backButtonLabel="Back to original photos" />

        {/* Property Info */}
        <div className="px-4 py-6 space-y-6">
          {/* Title and Address */}
          <div>
            <h1 className="text-2xl font-playfair font-bold mb-3">{translatedTitle}</h1>
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 font-montserrat">{getPropertyTypeLabel()}</Badge>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span className="font-montserrat">{translatedNeighborhood}</span>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div className="flex items-center gap-3 col-span-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold font-montserrat">{getPriceDisplay()}</span>
            </div>
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
                Balcony{property.balcony_yard_size ? ` (${property.balcony_yard_size} sqm)` : ''}
              </Badge>
            )}
            {property.yard && (
              <Badge variant="secondary" className="text-sm font-montserrat">
                <Trees className="h-3 w-3 mr-1" />
                Yard{property.balcony_yard_size && !property.balcony ? ` (${property.balcony_yard_size} sqm)` : ''}
              </Badge>
            )}
            {property.mamad && (
              <Badge variant="secondary" className="text-sm font-montserrat">
                <Shield className="h-3 w-3 mr-1" />
                Safe Room
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
          <div className="space-y-2">
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90 h-12 font-montserrat" onClick={handleWhatsApp}>
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
            <Button variant="outline" className="w-full gap-2 h-12 font-montserrat" onClick={handleCall}>
              <Phone className="h-5 w-5" />
              Call Us
            </Button>
          </div>

          {/* Share */}
          <Button 
            variant="outline" 
            className="w-full gap-2 font-montserrat"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Share Property
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/en" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={property.property_type === 'sale' ? '/en/sales' : '/en/rentals'} className="hover:text-primary transition-colors">
            {property.property_type === 'sale' ? 'For Sale' : 'For Rent'}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Property #{property.property_number}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Badge and Title */}
            <div>
              <Badge className="mb-3 bg-primary text-white font-montserrat">{getPropertyTypeLabel()}</Badge>
              <h1 className="text-2xl font-playfair font-bold mb-2">{translatedTitle}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span className="text-base font-montserrat">{translatedNeighborhood}</span>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-3">
              {/* Price */}
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold font-montserrat">{getPriceDisplay()}</span>
              </div>
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
                  Balcony{property.balcony_yard_size ? ` (${property.balcony_yard_size} sqm)` : ''}
                </Badge>
              )}
              {property.yard && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90 font-montserrat">
                  <Trees className="h-3 w-3 mr-1" />
                  Yard{property.balcony_yard_size && !property.balcony ? ` (${property.balcony_yard_size} sqm)` : ''}
                </Badge>
              )}
              {property.mamad && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90 font-montserrat">
                  <Shield className="h-3 w-3 mr-1" />
                  Safe Room
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
            <Button 
              variant="outline" 
              className="w-full gap-2 font-montserrat"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share Property
            </Button>
          </div>

          {/* Right Column - Image Gallery */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <ImageCarousel images={propertyImages} furnishedImages={furnishedImages} priceLabel={getPriceDisplay()} furnishedButtonLabel="Show me the apartment furnished" backButtonLabel="Back to original photos" />
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

      <EnglishFooter />
    </div>
  );
};

export default EnglishPropertyDetail;
