import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MapPin, Home, Bath, Square, Building2, Phone, Facebook, Copy, Check, Car, MoveUp, TreePine, ChevronLeft, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ImageCarousel } from '@/components/ImageCarousel';
import { PropertyImage } from '@/types/property';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { usePublicProperty } from '@/hooks/usePublicProperty';
import { Skeleton } from '@/components/ui/skeleton';
import HebrewFooter from '@/components/he/Footer';
import { removeAddressNumber } from '@/lib/utils';
import { extractIdFromSlug, createPropertySlug } from '@/utils/slugify';

const PropertyDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Extract ID from slug
  const id = slug ? extractIdFromSlug(slug) : undefined;

  // Load property from database
  const { data: property, isLoading, error } = usePublicProperty(id);


  // Convert property images to PropertyImage format with cache busting
  const propertyImages: PropertyImage[] = property?.images.map(img => ({
    id: img.id,
    name: img.alt_text || 'תמונת נכס',
    url: `${img.image_url}?t=${Date.now()}`,
    isPrimary: img.is_main,
    uploadedAt: new Date().toISOString(),
  })) || [];

  const handleWhatsApp = () => {
    const phone = '972545503055';
    const message = `שלום אנו מתעניינים לגבי הדירה ב${property?.title}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:0545503055';
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'copy') => {
    const url = window.location.href;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(url);
      toast({
        title: "קישור הועתק",
        description: "הקישור הועתק ללוח. אפשר להדביק באינסטגרם",
      });
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "הקישור הועתק",
        description: "הקישור הועתק ללוח",
      });
      setTimeout(() => setCopied(false), 2000);
    }
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
          <h1 className="text-2xl font-bold mb-4">נכס לא נמצא</h1>
          <Button onClick={() => navigate('/')}>חזרה לעמוד הבית</Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const getPropertyTypeLabel = () => {
    if (property.property_type === 'rental') return 'להשכרה';
    if (property.property_type === 'sale') return 'למכירה';
    return '';
  };

  const getPriceDisplay = () => {
    if (property.property_type === 'rental' && property.monthly_rent) {
      return `₪${property.monthly_rent.toLocaleString()}/חודש`;
    }
    if (property.property_type === 'sale' && property.price) {
      return `₪${property.price.toLocaleString()}`;
    }
    return '';
  };

  const getKeyPoints = () => {
    const points = [];
    if (property.rooms) points.push(`${property.rooms} חדרים`);
    if (property.bathrooms) points.push(`${property.bathrooms} חדרי רחצה`);
    if (property.floor !== null && property.floor !== undefined) points.push(`קומה ${property.floor}`);
    if (property.property_size) points.push(`${property.property_size} מ"ר`);
    return points;
  };

  // Prepare meta tags
  const mainImage = property.images.find(img => img.is_main)?.image_url 
    || property.images[0]?.image_url 
    || '/city-market-logo.png';
  
  const pageTitle = `${property.title} - City Market Properties`;
  const pageDescription = property.description?.substring(0, 160) || 
    `${property.rooms} חדרים ב${property.address}, ${property.city}. ${getPriceDisplay()}`;
  
  const currentUrl = window.location.href;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={mainImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={mainImage} />
      </Helmet>
      
      <div className="min-h-screen bg-background" dir="rtl">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Back Button */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה
            </Button>
          </div>
        </div>

        {/* Image Carousel */}
        <div className="relative">
          <ImageCarousel images={propertyImages} />
        </div>

        {/* Property Info */}
        <div className="container px-4 py-6 space-y-6">
          {/* Header */}
          <div>
            <Badge className="mb-2">{getPropertyTypeLabel()}</Badge>
            <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{removeAddressNumber(property.address)}, {property.city}</span>
            </div>
            <div className="text-2xl font-bold mt-4 text-primary">
              {getPriceDisplay()}
            </div>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4">
            {property.rooms && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">חדרים</div>
                  <div className="font-semibold">{property.rooms}</div>
                </div>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Bath className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">חדרי רחצה</div>
                  <div className="font-semibold">{property.bathrooms}</div>
                </div>
              </div>
            )}
            {property.floor !== null && property.floor !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">קומה</div>
                  <div className="font-semibold">{property.floor}</div>
                </div>
              </div>
            )}
            {property.property_size && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Square className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">גודל</div>
                  <div className="font-semibold">{property.property_size} מ"ר</div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          {(property.parking || property.elevator || property.balcony || property.yard) && (
            <div>
              <h2 className="text-lg font-semibold mb-3">מאפיינים</h2>
              <div className="flex flex-wrap gap-2">
                {property.parking && (
                  <Badge variant="secondary" className="gap-2">
                    <Car className="h-3 w-3" />
                    חנייה
                  </Badge>
                )}
                {property.elevator && (
                  <Badge variant="secondary" className="gap-2">
                    <MoveUp className="h-3 w-3" />
                    מעלית
                  </Badge>
                )}
                {property.balcony && (
                  <Badge variant="secondary" className="gap-2">
                    <TreePine className="h-3 w-3" />
                    {property.balcony_yard_size 
                      ? `מרפסת (${property.balcony_yard_size} מ"ר)`
                      : 'מרפסת'
                    }
                  </Badge>
                )}
                {property.yard && (
                  <Badge variant="secondary" className="gap-2">
                    <Trees className="h-3 w-3" />
                    {property.balcony_yard_size 
                      ? `חצר (${property.balcony_yard_size} מ"ר)`
                      : 'חצר'
                    }
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div>
              <h2 className="text-lg font-semibold mb-3">תיאור</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          {/* Key Points */}
          <div>
            <h2 className="text-lg font-semibold mb-3">נקודות מפתח</h2>
            <ul className="space-y-2">
              {getKeyPoints().map((point, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleWhatsApp}
              className="w-full gap-2"
              size="lg"
            >
              <MessageCircle className="h-5 w-5" />
              שלח הודעת WhatsApp
            </Button>
            <Button 
              onClick={handleCall}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <Phone className="h-5 w-5" />
              התקשרו אלינו
            </Button>
          </div>

          {/* Share Options */}
          <div>
            <h3 className="text-sm font-semibold mb-3">שתף נכס זה</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('whatsapp')}
              >
                <MessageCircle className="h-4 w-4" />
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
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Images and Description */}
            <div className="space-y-6">
              <ImageCarousel images={propertyImages} />
              
              {property.description && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">תיאור הנכס</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Key Points */}
              <div>
                <h2 className="text-2xl font-bold mb-4">נקודות מפתח</h2>
                <ul className="space-y-3">
                  {getKeyPoints().map((point, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-lg text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Details and Contact */}
            <div className="space-y-6">
              {/* Property Header */}
              <div>
                <Badge className="mb-3">{getPropertyTypeLabel()}</Badge>
                <h1 className="text-4xl font-bold mb-3">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{removeAddressNumber(property.address)}, {property.city}</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {getPriceDisplay()}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {property.rooms && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Home className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">חדרים</div>
                      <div className="text-xl font-semibold">{property.rooms}</div>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Bath className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">חדרי רחצה</div>
                      <div className="text-xl font-semibold">{property.bathrooms}</div>
                    </div>
                  </div>
                )}
                {property.floor !== null && property.floor !== undefined && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">קומה</div>
                      <div className="text-xl font-semibold">{property.floor}</div>
                    </div>
                  </div>
                )}
                {property.property_size && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Square className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">גודל</div>
                      <div className="text-xl font-semibold">{property.property_size} מ"ר</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              {(property.parking || property.elevator || property.balcony || property.yard) && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">מאפיינים</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.parking && (
                      <Badge variant="secondary" className="gap-2 text-sm py-2 px-3">
                        <Car className="h-4 w-4" />
                        חנייה
                      </Badge>
                    )}
                    {property.elevator && (
                      <Badge variant="secondary" className="gap-2 text-sm py-2 px-3">
                        <MoveUp className="h-4 w-4" />
                        מעלית
                      </Badge>
                    )}
                    {property.balcony && (
                      <Badge variant="secondary" className="gap-2 text-sm py-2 px-3">
                        <TreePine className="h-4 w-4" />
                        {property.balcony_yard_size 
                          ? `מרפסת (${property.balcony_yard_size} מ"ר)`
                          : 'מרפסת'
                        }
                      </Badge>
                    )}
                    {property.yard && (
                      <Badge variant="secondary" className="gap-2 text-sm py-2 px-3">
                        <Trees className="h-4 w-4" />
                        {property.balcony_yard_size 
                          ? `חצר (${property.balcony_yard_size} מ"ר)`
                          : 'חצר'
                        }
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleWhatsApp}
                  className="w-full gap-2"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  שלח הודעת WhatsApp
                </Button>
                <Button 
                  onClick={handleCall}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <Phone className="h-5 w-5" />
                  התקשרו אלינו
                </Button>
              </div>

              {/* Share Section */}
              <div>
                <h3 className="font-semibold mb-3">שתף נכס זה</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare('whatsapp')}
                  >
                    <MessageCircle className="h-4 w-4" />
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
              </div>

              {/* Contact Form */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">השאירו פרטים ונחזור אליכם</h3>
                <form className="space-y-4">
                  <Input placeholder="שם מלא" />
                  <Input type="tel" placeholder="טלפון" />
                  <Input type="email" placeholder="אימייל" />
                  <Input placeholder="הודעה (אופציונלי)" />
                  <Button type="submit" className="w-full">
                    שלח פנייה
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <HebrewFooter />
    </div>
    </>
  );
};

export default PropertyDetailPage;
