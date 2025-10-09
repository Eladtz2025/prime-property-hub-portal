import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock properties data
const mockRentals = [
  {
    title: 'דירת 4 חדרים משופצת ברחוב דיזנגוף',
    address: 'דיזנגוף 125, תל אביב',
    city: 'תל אביב',
    monthly_rent: 8500,
    rooms: 4,
    property_size: 95,
    description: 'דירה יפהפייה ומשופצת בלב הצפון הישן, תקרות גבוהות, ריצוף מקורי, מרפסת גדולה עם נוף לשדרות. במרחק הליכה מהים, בתי קפה ומסעדות.',
    image: '/images/properties/rental-dizengoff-interior.jpg',
    features: { parking: true, elevator: true, balcony: true }
  },
  {
    title: 'דירת 3 חדרים בשכונת בן יהודה',
    address: 'בן יהודה 43, תל אביב',
    city: 'תל אביב',
    monthly_rent: 7200,
    rooms: 3,
    property_size: 75,
    description: 'דירה מקסימה עם אופי בשכונה שקטה, 2 חדרי שינה מרווחים, מטבח מודרני, מזגן בכל חדר. קרוב לתחבורה ציבורית ולכל השירותים.',
    image: '/images/properties/rental-ben-yehuda-kitchen.jpg',
    features: { parking: false, elevator: false, balcony: true }
  },
  {
    title: 'דירת 3 חדרים משופצת ברחוב גורדון',
    address: 'גורדון 18, תל אביב',
    city: 'תל אביב',
    monthly_rent: 6800,
    rooms: 3,
    property_size: 65,
    description: 'דירה חמודה ומשופצת בשכונת נווה צדק, קרוב לחוף הים, 2 חדרי שינה, סלון מואר, מטבח מעוצב. מתאים לזוג או משפחה קטנה.',
    image: '/images/properties/rental-gordon-bedroom.jpg',
    features: { parking: false, elevator: false, balcony: true }
  },
  {
    title: 'סטודיו מרוהט ברחוב פרישמן',
    address: 'פרישמן 45, תל אביב',
    city: 'תל אביב',
    monthly_rent: 4500,
    rooms: 1,
    property_size: 32,
    description: 'סטודיו מעוצב ומרוהט, מטבח פתוח, אזור מיטה מופרד, מרפסת קטנה. מתאים לעצמאי או זוג צעיר. במרחק הליכה מהים.',
    image: '/images/properties/studio-frishman.jpg',
    features: { parking: false, elevator: true, balcony: true }
  },
  {
    title: 'דירת 2 חדרים ברחוב ביאליק',
    address: 'ביאליק 12, תל אביב',
    city: 'תל אביב',
    monthly_rent: 5500,
    rooms: 2,
    property_size: 55,
    description: 'דירה נעימה במיקום מרכזי, חדר שינה אחד, סלון בהיר, מטבח מאובזר. קרוב לתחנת רכבת ולמרכזי קניות. מתאים ליחיד או זוג.',
    image: '/images/properties/2br-bialik.jpg',
    features: { parking: false, elevator: false, balcony: false }
  }
];

const mockSales = [
  {
    title: 'דירת 5 חדרים משופצת ברחוב רוטשילד',
    address: 'רוטשילד 88, תל אביב',
    city: 'תל אביב',
    price: 5200000,
    rooms: 5,
    property_size: 130,
    description: 'דירת יוקרה בבניין בוטיק משופץ, תקרות גבוהות, חלונות גדולים, מרפסת מרווחה. מיקום פרימיום על השדרה היוקרתית.',
    image: '/images/properties/sale-rothschild-exterior.jpg',
    features: { parking: true, elevator: true, balcony: true }
  },
  {
    title: 'פנטהאוז 4 חדרים ברחוב אלנבי',
    address: 'אלנבי 234, תל אביב',
    city: 'תל אביב',
    price: 6800000,
    rooms: 4,
    property_size: 140,
    description: 'פנטהאוז מדהים עם גג פרטי מרהיב, נוף לעיר, עיצוב מודרני, מטבח שף, 2 חדרי רחצה יוקרתיים. חניה כפולה.',
    image: '/images/properties/penthouse-allenby.jpg',
    features: { parking: true, elevator: true, balcony: true }
  },
  {
    title: 'דירת 3 חדרים בסגנון באוהאוס ברחוב נחמני',
    address: 'נחמני 14, תל אביב',
    city: 'תל אביב',
    price: 3900000,
    rooms: 3,
    property_size: 85,
    description: 'דירה קלאסית בבניין באוהאוס משופץ, שימור אדריכלי, פרקט מקורי, תקרות גבוהות. קרוב לרוטשילד ולבתי קפה טרנדיים.',
    image: '/images/properties/classic-nahmani.jpg',
    features: { parking: false, elevator: false, balcony: true }
  },
  {
    title: 'דירת 4 חדרים עם מרפסת גדולה ברחוב דיזנגוף',
    address: 'דיזנגוף 201, תל אביב',
    city: 'תל אביב',
    price: 4500000,
    rooms: 4,
    property_size: 120,
    description: 'דירת גן משופצת, מרפסת ענקית 60 מ"ר, 3 חדרי שינה, סלון מרווח, מטבח חדש. אידיאלי למשפחה.',
    image: '/images/properties/sale-dizengoff-terrace.jpg',
    features: { parking: true, elevator: true, balcony: true }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ownerName = 'אלעד צברי';
    const ownerPhone = '0545503055';
    let importedCount = 0;

    // Import rental properties
    for (const rental of mockRentals) {
      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          title: rental.title,
          address: rental.address,
          city: rental.city,
          description: rental.description,
          property_type: 'rental',
          rooms: rental.rooms,
          property_size: rental.property_size,
          monthly_rent: rental.monthly_rent,
          parking: rental.features.parking,
          elevator: rental.features.elevator,
          balcony: rental.features.balcony,
          owner_name: ownerName,
          owner_phone: ownerPhone,
          status: 'vacant',
          available: true,
          featured: false
        })
        .select()
        .single();

      if (propertyError) {
        console.error('Error creating property:', propertyError);
        continue;
      }

      // Create property image record (using public path)
      const imageUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.supabase.co${rental.image}`;
      
      const { error: imageError } = await supabase
        .from('property_images')
        .insert({
          property_id: property.id,
          image_url: rental.image, // Store the public path
          alt_text: rental.title,
          is_main: true,
          order_index: 0
        });

      if (imageError) {
        console.error('Error creating image:', imageError);
      } else {
        importedCount++;
      }
    }

    // Import sale properties
    for (const sale of mockSales) {
      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          title: sale.title,
          address: sale.address,
          city: sale.city,
          description: sale.description,
          property_type: 'sale',
          rooms: sale.rooms,
          property_size: sale.property_size,
          monthly_rent: sale.price, // Using monthly_rent field for price (you may want to add a price field later)
          parking: sale.features.parking,
          elevator: sale.features.elevator,
          balcony: sale.features.balcony,
          owner_name: ownerName,
          owner_phone: ownerPhone,
          status: 'vacant',
          available: true,
          featured: false
        })
        .select()
        .single();

      if (propertyError) {
        console.error('Error creating property:', propertyError);
        continue;
      }

      // Create property image record
      const { error: imageError } = await supabase
        .from('property_images')
        .insert({
          property_id: property.id,
          image_url: sale.image, // Store the public path
          alt_text: sale.title,
          is_main: true,
          order_index: 0
        });

      if (imageError) {
        console.error('Error creating image:', imageError);
      } else {
        importedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${importedCount} properties`,
        rentals: mockRentals.length,
        sales: mockSales.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
