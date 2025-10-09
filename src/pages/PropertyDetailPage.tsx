import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, MapPin, Bed, Bath, Square, Building2, Phone, Mail, Share2, Facebook, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { useState } from 'react';

const PropertyDetailPage = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Mock data - בפועל זה יגיע מה-database
  const rentalProperties = [
    {
      id: '1',
      title: 'דירת 4 חדרים משופצת ברחוב דיזנגוף',
      address: 'דיזנגוף 125',
      city: 'תל אביב',
      monthly_rent: 8500,
      rooms: 4,
      bathrooms: 2,
      property_size: 95,
      floor: 3,
      building_floors: 4,
      description: 'דירה יפהפייה ומשופצת בלב הצפון הישן, תקרות גבוהות, ריצוף מקורי, מרפסת גדולה עם נוף לשדרות. במרחק הליכה מהים, בתי קפה ומסעדות.',
      parking: true,
      elevator: true,
      balcony: true,
      property_type: 'rental'
    },
    {
      id: '2',
      title: 'דירת 3 חדרים בשכונת בן יהודה',
      address: 'בן יהודה 43',
      city: 'תל אביב',
      monthly_rent: 7200,
      rooms: 3,
      bathrooms: 1,
      property_size: 75,
      floor: 2,
      building_floors: 3,
      description: 'דירה מקסימה עם אופי בשכונה שקטה, 2 חדרי שינה מרווחים, מטבח מודרני, מזגן בכל חדר. קרוב לתחבורה ציבורית ולכל השירותים.',
      parking: false,
      elevator: false,
      balcony: true,
      property_type: 'rental'
    },
    {
      id: '3',
      title: 'דירת 3 חדרים משופצת ברחוב גורדון',
      address: 'גורדון 18',
      city: 'תל אביב',
      monthly_rent: 6800,
      rooms: 3,
      bathrooms: 1,
      property_size: 65,
      floor: 1,
      building_floors: 3,
      description: 'דירה חמודה ומשופצת בשכונת נווה צדק, קרוב לחוף הים, 2 חדרי שינה, סלון מואר, מטבח מעוצב. מתאים לזוג או משפחה קטנה.',
      parking: false,
      elevator: false,
      balcony: true,
      property_type: 'rental'
    },
    {
      id: '4',
      title: 'סטודיו מרוהט ברחוב פרישמן',
      address: 'פרישמן 45',
      city: 'תל אביב',
      monthly_rent: 4500,
      rooms: 1,
      bathrooms: 1,
      property_size: 32,
      floor: 4,
      building_floors: 5,
      description: 'סטודיו מעוצב ומרוהט, מטבח פתוח, אזור מיטה מופרד, מרפסת קטנה. מתאים לעצמאי או זוג צעיר. במרחק הליכה מהים.',
      parking: false,
      elevator: true,
      balcony: true,
      property_type: 'rental'
    },
    {
      id: '5',
      title: 'דירת 2 חדרים ברחוב ביאליק',
      address: 'ביאליק 12',
      city: 'תל אביב',
      monthly_rent: 5500,
      rooms: 2,
      bathrooms: 1,
      property_size: 55,
      floor: 2,
      building_floors: 4,
      description: 'דירה נעימה במיקום מרכזי, חדר שינה אחד, סלון בהיר, מטבח מאובזר. קרוב לתחנת רכבת ולמרכזי קניות. מתאים ליחיד או זוג.',
      parking: false,
      elevator: false,
      balcony: false,
      property_type: 'rental'
    }
  ];

  const saleProperties = [
    {
      id: '1',
      title: 'דירת 5 חדרים משופצת ברחוב רוטשילד',
      address: 'רוטשילד 88',
      city: 'תל אביב',
      price: 5200000,
      rooms: 5,
      bathrooms: 2,
      property_size: 130,
      floor: 3,
      building_floors: 4,
      description: 'דירת יוקרה בבניין בוטיק משופץ, תקרות גבוהות, חלונות גדולים, מרפסת מרווחה. מיקום פרימיום על השדרה היוקרתית.',
      parking: true,
      elevator: true,
      balcony: true,
      property_type: 'sale'
    },
    {
      id: '2',
      title: 'פנטהאוז 4 חדרים ברחוב אלנבי',
      address: 'אלנבי 234',
      city: 'תל אביב',
      price: 6800000,
      rooms: 4,
      bathrooms: 2,
      property_size: 140,
      floor: 5,
      building_floors: 5,
      description: 'פנטהאוז מדהים עם גג פרטי מרהיב, נוף לעיר, עיצוב מודרני, מטבח שף, 2 חדרי רחצה יוקרתיים. חניה כפולה.',
      parking: true,
      elevator: true,
      balcony: true,
      property_type: 'sale'
    },
    {
      id: '3',
      title: 'דירת 3 חדרים בסגנון באוהאוס ברחוב נחמני',
      address: 'נחמני 14',
      city: 'תל אביב',
      price: 3900000,
      rooms: 3,
      bathrooms: 1,
      property_size: 85,
      floor: 2,
      building_floors: 3,
      description: 'דירה קלאסית בבניין באוהאוס משופץ, שימור אדריכלי, פרקט מקורי, תקרות גבוהות. קרוב לרוטשילד ולבתי קפה טרנדיים.',
      parking: false,
      elevator: false,
      balcony: true,
      property_type: 'sale'
    },
    {
      id: '4',
      title: 'דירת 4 חדרים עם מרפסת גדולה ברחוב דיזנגוף',
      address: 'דיזנגוף 201',
      city: 'תל אביב',
      price: 4500000,
      rooms: 4,
      bathrooms: 2,
      property_size: 120,
      floor: 1,
      building_floors: 4,
      description: 'דירת גן משופצת, מרפסת ענקית 60 מ"ר, 3 חדרי שינה, סלון מרווח, מטבח חדש. אידיאלי למשפחה.',
      parking: true,
      elevator: true,
      balcony: true,
      property_type: 'sale'
    }
  ];

  const managementProperties = [
    {
      id: '1',
      title: 'בניין מגורים 12 יחידות ברחוב שיינקין',
      address: 'שיינקין 87',
      city: 'תל אביב',
      units: 12,
      bathrooms: 12,
      property_size: 850,
      floor: 0,
      building_floors: 3,
      description: 'בניין בוטיק מתחזק ומשופץ, 12 דירות להשכרה, כולן מושכרות, ניהול מלא כולל תחזוקה, גביה ודיווח. תפוסה 100%.',
      parking: true,
      elevator: false,
      balcony: false,
      property_type: 'management'
    },
    {
      id: '2',
      title: 'בניין מגורים 8 יחידות ברחוב מונטיפיורי',
      address: 'מונטיפיורי 23',
      city: 'תל אביב',
      units: 8,
      bathrooms: 8,
      property_size: 520,
      floor: 0,
      building_floors: 3,
      description: 'בניין בוטיק משופץ ומתוחזק, 8 דירות, כולן מושכרות, ניהול מקצועי כולל גביה ותחזוקה שוטפת. דיירים איכותיים ויציבים.',
      parking: true,
      elevator: false,
      balcony: false,
      property_type: 'management'
    },
    {
      id: '3',
      title: 'בניין משרדים ומסחר ברחוב אלנבי',
      address: 'אלנבי 112',
      city: 'תל אביב',
      units: 8,
      bathrooms: 8,
      property_size: 650,
      floor: 0,
      building_floors: 4,
      description: 'בניין היסטורי מתוחזק, משרדים וחנויות, ניהול מקצועי כולל אחזקה שוטפת, ליווי דיירים ותיאום עבודות. מיקום מרכזי.',
      parking: true,
      elevator: true,
      balcony: false,
      property_type: 'management'
    }
  ];

  const allProperties = [...rentalProperties, ...saleProperties, ...managementProperties];
  const property = allProperties.find(p => p.id === id);

  const handleWhatsApp = () => {
    const phone = '972545503055';
    const message = `שלום, מעוניין/ת במידע על ${property?.title}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:0507222221';
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
        title: "הקישור הועתק",
        description: "הקישור הועתק ללוח",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">נכס לא נמצא</h1>
          <Button onClick={() => navigate('/')}>חזרה לעמוד הבית</Button>
        </div>
      </div>
    );
  }

  const getBackLink = () => {
    if (window.location.pathname.includes('rentals')) return '/rentals';
    if (window.location.pathname.includes('sales')) return '/sales';
    if (window.location.pathname.includes('management')) return '/management';
    return '/';
  };

  const getPropertyTypeLabel = () => {
    if (property.property_type === 'rental') return 'להשכרה';
    if (property.property_type === 'sale') return 'למכירה';
    if (property.property_type === 'management') return 'בניהול';
    return '';
  };

  const getPriceDisplay = () => {
    if (property.property_type === 'rental' && 'monthly_rent' in property) {
      return `₪${property.monthly_rent.toLocaleString()}/חודש`;
    }
    if (property.property_type === 'sale' && 'price' in property) {
      return `₪${property.price.toLocaleString()}`;
    }
    if (property.property_type === 'management') {
      return 'ניהול מלא';
    }
    return '';
  };

  const getKeyPoints = () => {
    const points = [
      `מיקום מעולה ב${property.city}`,
      'units' in property && property.property_type === 'management'
        ? `${property.units} יח' דיור`
        : 'rooms' in property ? `${property.rooms} חדרים מרווחים` : 'שטח מרווח',
      `${property.property_size} מ"ר שטח`,
    ];

    if (property.parking) points.push('חניה פרטית');
    if (property.elevator) points.push('מעלית בבניין');
    if (property.balcony) points.push('מרפסת');

    return points;
  };

  return (
    <div className="min-h-screen bg-background">
      <WhatsAppFloat />

      <div className="container mx-auto px-4 py-8">
        {/* כפתור חזרה */}
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(getBackLink())}
        >
          <ArrowRight className="h-4 w-4" />
          חזרה לרשימת נכסים
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* עמודה ימנית - פרטי הנכס */}
          <div className="lg:col-span-2 space-y-6">
            {/* תגית וכותרת */}
            <div>
              <Badge className="mb-3 bg-primary">{getPropertyTypeLabel()}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{property.address}, {property.city}</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-6">
                {getPriceDisplay()}
              </div>
            </div>

            {/* פרטים טכניים */}
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  {property.property_type === 'management' ? (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Bed className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {property.property_type === 'management' ? 'יח\' דיור' : 'חדרים'}
                    </div>
                    <div className="font-semibold">
                      {'units' in property && property.property_type === 'management'
                        ? property.units
                        : 'rooms' in property ? property.rooms : 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">חדרי רחצה</div>
                    <div className="font-semibold">{property.bathrooms}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">שטח</div>
                    <div className="font-semibold">{property.property_size} מ"ר</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">קומה</div>
                    <div className="font-semibold">
                      {property.floor === 0 ? 'קרקע' : `${property.floor} מתוך ${property.building_floors}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 flex-wrap">
                {property.parking && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500">
                    חניה
                  </Badge>
                )}
                {property.elevator && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500">
                    מעלית
                  </Badge>
                )}
                {property.balcony && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500">
                    מרפסת
                  </Badge>
                )}
              </div>
            </Card>

            {/* אודות הנכס */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">אודות הנכס</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {property.description}
              </p>

              <h3 className="text-xl font-semibold mb-4">נקודות מרכזיות</h3>
              <ul className="space-y-2">
                {getKeyPoints().map((point, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* עמודה שמאלית - כפתורי פעולה ושיתוף */}
          <div className="space-y-6">
            {/* כפתורי פעולה */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">צור קשר</h3>
              <div className="space-y-3">
                <Button className="w-full gap-2" onClick={handleWhatsApp}>
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={handleCall}>
                  <Phone className="h-4 w-4" />
                  התקשר
                </Button>
              </div>
            </Card>

            {/* שיתוף */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">שתף נכס זה</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('whatsapp')}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('facebook')}
                  className="flex-1"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('copy')}
                  className="flex-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>

            {/* פרטי קשר */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">פרטי קשר</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">טלפון</div>
                    <a href="tel:0507222221" className="font-medium hover:text-primary">
                      050-722-2221
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">אימייל</div>
                    <a href="mailto:info@citymarket.co.il" className="font-medium hover:text-primary">
                      info@citymarket.co.il
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">WhatsApp</div>
                    <button onClick={handleWhatsApp} className="font-medium hover:text-primary">
                      שלחו לנו הודעה
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">כתובת</div>
                    <div className="font-medium">תל אביב, ישראל</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* שעות פעילות */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">שעות פעילות</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ראשון - חמישי:</span>
                  <span className="font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שישי:</span>
                  <span className="font-medium">09:00 - 13:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שבת:</span>
                  <span className="font-medium">סגור</span>
                </div>
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  📞 זמינות טלפונית 24/7 במקרי חירום
                </div>
              </div>
            </Card>

            {/* קישורים מהירים */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">קישורים מהירים</h3>
              <div className="space-y-2">
                <Link to="/" className="block hover:text-primary">
                  עמוד הבית
                </Link>
                <Link to="/rentals" className="block hover:text-primary">
                  השכרות
                </Link>
                <Link to="/sales" className="block hover:text-primary">
                  מכירות
                </Link>
                <Link to="/management" className="block hover:text-primary">
                  ניהול נכסים
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
