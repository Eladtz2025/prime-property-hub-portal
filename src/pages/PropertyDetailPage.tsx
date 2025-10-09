import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, MapPin, Bed, Bath, Square, Building2, Phone, MessageCircle,
  Share2, ChevronLeft, ChevronRight, Facebook
} from 'lucide-react';
import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/ContactForm';
import ContactSection from '@/components/ContactSection';
import { useToast } from '@/hooks/use-toast';

const PropertyDetailPage = () => {
  const { division, id } = useParams<{ division: string; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property-detail', id],
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
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const images = property?.property_images?.sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return (a.order_index || 0) - (b.order_index || 0);
  }) || [];

  const divisionLabels: Record<string, string> = {
    rentals: 'השכרות',
    sales: 'מכירות',
    management: 'ניהול נכסים',
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = `${property?.title || property?.address} - City Market Properties`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: 'הקישור הועתק',
          description: 'הקישור הועתק ללוח',
        });
        break;
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">הנכס לא נמצא</h2>
          <Button onClick={() => navigate(`/${division}`)}>חזרה לרשימה</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs & Back Button */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: divisionLabels[division || 'rentals'], href: `/${division}` },
              { label: property.title || property.address, href: '#' },
            ]}
          />
          <Button
            variant="ghost"
            onClick={() => navigate(`/${division}`)}
            className="mt-2"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לרשימה
          </Button>
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-8">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={images[currentImageIndex]?.image_url}
                alt={images[currentImageIndex]?.alt_text || property.title}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-video rounded-lg overflow-hidden ${
                      index === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `תמונה ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{property.title || property.address}</h1>
                <Badge>{division === 'rentals' ? 'להשכרה' : division === 'sales' ? 'למכירה' : 'בניהול'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{property.address}, {property.city}</span>
              </div>
              {property.monthly_rent && (
                <div className="text-4xl font-bold text-primary mb-6">
                  ₪{property.monthly_rent.toLocaleString()}
                  {division === 'rentals' && '/חודש'}
                </div>
              )}
            </div>

            {/* Property Features */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">פרטי הנכס</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.rooms && (
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Bed className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">חדרים</span>
                    <span className="font-bold">{property.rooms}</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Bath className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">חדרי רחצה</span>
                    <span className="font-bold">{property.bathrooms}</span>
                  </div>
                )}
                {property.property_size && (
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Square className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">גודל</span>
                    <span className="font-bold">{property.property_size} מ"ר</span>
                  </div>
                )}
                {property.floor !== null && (
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Building2 className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">קומה</span>
                    <span className="font-bold">{property.floor}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {property.parking && <Badge variant="outline">חניה</Badge>}
                {property.elevator && <Badge variant="outline">מעלית</Badge>}
                {property.balcony && <Badge variant="outline">מרפסת</Badge>}
              </div>
            </Card>

            {/* Description */}
            {property.description && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">תיאור</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
              </Card>
            )}

            {/* Contact Buttons */}
            <div className="flex gap-4">
              <Button size="lg" className="flex-1" asChild>
                <a href={`tel:${property.contact_phone || '0545503055'}`}>
                  <Phone className="h-5 w-5 ml-2" />
                  התקשר עכשיו
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const phone = property.contact_phone?.replace(/\D/g, '') || '972545503055';
                  const message = `שלום, מעוניין/ת במידע על ${property.title || property.address}`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                WhatsApp
              </Button>
            </div>

            {/* Share Buttons */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">שתף את הנכס</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleShare('whatsapp')}>
                  <MessageCircle className="h-4 w-4 ml-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={() => handleShare('facebook')}>
                  <Facebook className="h-4 w-4 ml-2" />
                  Facebook
                </Button>
                <Button variant="outline" onClick={() => handleShare('copy')}>
                  <Share2 className="h-4 w-4 ml-2" />
                  העתק קישור
                </Button>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ContactForm
              propertyId={property.id}
              propertyTitle={property.title || property.address}
            />
          </div>
        </div>
      </div>

      <ContactSection />
    </div>
  );
};

export default PropertyDetailPage;