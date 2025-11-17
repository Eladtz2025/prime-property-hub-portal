import { useParams, useNavigate, Link } from 'react-router-dom';
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

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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
      // Instagram doesn't support direct link sharing, so we copy the link
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
    const points = [
      `מיקום מעולה ב${property.city}`,
      property.rooms ? `${property.rooms} חדרים מרווחים` : 'שטח מרווח',
      `${property.property_size} מ"ר שטח`,
    ];

    if (property.parking) points.push('חניה פרטית');
    if (property.elevator) points.push('מעלית בבניין');
    if (property.balcony) points.push('מרפסת');
    if (property.yard) points.push('חצר פרטית');

    return points;
  };

  return (
    <div className="min-h-screen english-luxury" dir="rtl">

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Breadcrumbs */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 border-b">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-row-reverse" aria-label="Breadcrumb" dir="rtl">
            <Link to="/" className="hover:text-primary transition-colors">
              דף הבית
            </Link>
            <ChevronLeft className="h-4 w-4" />
          <Link to={property.property_type === 'sale' ? '/he/sales' : '/he/rentals'} className="hover:text-primary transition-colors">
            {property.property_type === 'sale' ? 'למכירה' : 'להשכרה'}
          </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">{property.title}</span>
          </nav>
        </div>

        {/* Image with Price Badge */}
        <div className="relative">
          <ImageCarousel images={propertyImages} priceLabel="" />
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-lg">
            {getPriceDisplay()}
          </div>
        </div>

        {/* Property Info */}
        <div className="px-4 py-6 space-y-6">
          {/* Title and Address */}
          <div>
            <Badge className="mb-3 bg-primary text-white">{getPropertyTypeLabel()}</Badge>
            <h1 className="text-2xl font-bold mb-3">{property.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{removeAddressNumber(property.address)}, {property.city}</span>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Bath className="h-5 w-5 text-primary" />
              <span>{property.bathrooms} חדרי רחצה</span>
            </div>
            {property.rooms && (
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <span>{property.rooms} חדרים</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span>קומה {property.floor === 0 ? 'קרקע' : property.floor}</span>
            </div>
            <div className="flex items-center gap-3">
              <Square className="h-5 w-5 text-primary" />
              <span>{property.property_size} מ"ר</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex gap-2 flex-wrap">
            {property.parking && (
              <Badge variant="secondary" className="text-sm">
                <Car className="h-3 w-3 ml-1" />
                חניה
              </Badge>
            )}
            {property.elevator && (
              <Badge variant="secondary" className="text-sm">
                <MoveUp className="h-3 w-3 ml-1" />
                מעלית
              </Badge>
            )}
            {property.balcony && (
              <Badge variant="secondary" className="text-sm">
                <TreePine className="h-3 w-3 ml-1" />
                מרפסת{property.balcony_yard_size ? ` (${property.balcony_yard_size} מ"ר)` : ''}
              </Badge>
            )}
            {property.yard && (
              <Badge variant="secondary" className="text-sm">
                <Trees className="h-3 w-3 ml-1" />
                חצר{property.balcony_yard_size && !property.balcony ? ` (${property.balcony_yard_size} מ"ר)` : ''}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">תיאור הנכס</h3>
            <p className="text-muted-foreground leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Key Points */}
          <div>
            <h3 className="text-lg font-semibold mb-3">נקודות מרכזיות</h3>
            <div className="space-y-2">
              {getKeyPoints().map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90 h-12" onClick={handleWhatsApp}>
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
            <Button variant="outline" className="w-full gap-2 h-12" onClick={handleCall}>
              <Phone className="h-5 w-5" />
              התקשר
            </Button>
          </div>

          {/* Share */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">שתף נכס זה</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('whatsapp')}
                title="שתף בווטסאפ"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('facebook')}
                title="שתף בפייסבוק"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('copy')}
                title="העתק קישור"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-row-reverse mb-6" aria-label="Breadcrumb" dir="rtl">
          <Link to="/" className="hover:text-primary transition-colors">
            דף הבית
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <Link to={property.property_type === 'sale' ? '/he/sales' : '/he/rentals'} className="hover:text-primary transition-colors">
            {property.property_type === 'sale' ? 'למכירה' : 'להשכרה'}
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Right Column - Image Gallery */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <ImageCarousel images={propertyImages} priceLabel={getPriceDisplay()} />
          </div>

          {/* Left Column - Property Details */}
          <div className="space-y-6 order-2 lg:order-2">
            {/* Badge and Title */}
            <div className="text-right">
              <div className="mb-3">
                <Badge className="bg-primary text-white">{getPropertyTypeLabel()}</Badge>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-right">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4 flex-row-reverse justify-end">
                <span className="text-base">{removeAddressNumber(property.address)}, {property.city}</span>
                <MapPin className="h-4 w-4" />
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-row-reverse justify-end">
                <span className="text-sm">
                  {property.bathrooms} {property.bathrooms === 1 ? 'חדר רחצה' : 'חדרי רחצה'}
                </span>
                <Bath className="h-5 w-5 text-primary" />
              </div>
              {property.rooms && (
                <div className="flex items-center gap-3 flex-row-reverse justify-end">
                  <span className="text-sm">{property.rooms} חדרים</span>
                  <Home className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex items-center gap-3 flex-row-reverse justify-end">
                <span className="text-sm">
                  קומה {property.floor === 0 ? 'קרקע' : property.floor}
                </span>
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-3 flex-row-reverse justify-end">
                <span className="text-sm">{property.property_size} מ"ר</span>
                <Square className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap justify-end">
              {property.parking && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90">
                  חניה
                  <Car className="h-3 w-3 mr-1" />
                </Badge>
              )}
              {property.elevator && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90">
                  מעלית
                  <MoveUp className="h-3 w-3 mr-1" />
                </Badge>
              )}
              {property.balcony && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90">
                  מרפסת{property.balcony_yard_size ? ` (${property.balcony_yard_size} מ"ר)` : ''}
                  <TreePine className="h-3 w-3 mr-1" />
                </Badge>
              )}
              {property.yard && (
                <Badge className="bg-secondary text-white hover:bg-secondary/90">
                  חצר{property.balcony_yard_size && !property.balcony ? ` (${property.balcony_yard_size} מ"ר)` : ''}
                  <Trees className="h-3 w-3 mr-1" />
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleCall}>
                <Phone className="h-4 w-4" />
                התקשר
              </Button>
            </div>

            {/* Share */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-sm text-right">שתף נכס זה</h3>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('whatsapp')}
                  title="שתף בווטסאפ"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('facebook')}
                  title="שתף בפייסבוק"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('copy')}
                  title="העתק קישור"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* אודות הנכס */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-right">אודות הנכס</h2>
          <p className="text-muted-foreground leading-relaxed mb-6 text-right">
            {property.description}
          </p>

          <h3 className="text-xl font-semibold mb-4 text-right">נקודות מרכזיות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getKeyPoints().map((point, index) => (
              <div key={index} className="flex items-center gap-2 flex-row-reverse">
                <span>{point}</span>
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        {/* טופס יצירת קשר */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 text-right">צור קשר</h2>
          <p className="text-muted-foreground mb-6 text-right">
            מעוניינים בנכס? דירת 4 חדרים משופצת ברחוב דיזנגוף? השאירו פרטים ואנחנו נחזור אליכם בהקדם
          </p>
          
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast({
              title: "הטופס נשלח בהצלחה",
              description: "נחזור אליך בהקדם",
            });
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">שם מלא *</label>
                <Input placeholder="הכנס שם מלא" required className="text-right" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">אימייל *</label>
                <Input type="email" placeholder="example@email.com" required className="text-right" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-right">טלפון</label>
              <Input type="tel" placeholder="050-1234567" className="text-right" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-right">הודעה *</label>
              <textarea 
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-right text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ספר לנו על מה אתה מחפש..."
                required
              />
            </div>

            <Button type="submit" className="w-full">
              שלח פנייה
            </Button>
          </form>
        </Card>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default PropertyDetailPage;
