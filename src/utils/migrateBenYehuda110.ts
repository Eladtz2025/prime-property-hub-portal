import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface SlideData {
  slide_type: string;
  slide_order: number;
  background_image: string;
  slide_data: Json;
  is_visible: boolean;
}

// Full slide content extracted from the hardcoded Ben Yehuda 110 components
const FULL_SLIDES_DATA: SlideData[] = [
  {
    slide_type: 'title',
    slide_order: 1,
    background_image: '/images/ben-yehuda-110/cleaned-property-image (2).png',
    is_visible: true,
    slide_data: {
      main_title: 'BEN YEHUDA 110',
      subtitle: 'CITY MARKET PROPERTIES'
    }
  },
  {
    slide_type: 'property',
    slide_order: 2,
    background_image: '/images/ben-yehuda-110/IMG_5760.JPG',
    is_visible: true,
    slide_data: {
      title: 'Duplex Apartment | 3-Room | Approx. 70 sqm',
      title_mobile: '3-Room Duplex | ~70 sqm',
      apartment_title: 'The Apartment',
      apartment_details: [
        { icon: 'Layers', text: 'Duplex spanning Floors 4 & 5' },
        { icon: 'Square', text: 'Registered interior area: 53.23 sqm' },
        { icon: 'Home', text: 'Registered roof attachment: 19.78 sqm' },
        { icon: 'Maximize', text: 'Weighted area: approx. 69.9 sqm' },
        { icon: 'Sun', text: 'Two private outdoor spaces' },
        { icon: 'Shield', text: 'MAMAD (secure room)' },
        { icon: 'FileCheck', text: 'Full ownership, clear registration' }
      ],
      building_title: 'The Building',
      building_details: [
        { icon: 'Building2', text: 'Boutique residential building' },
        { icon: 'Layers', text: '4 floors | 15 apartments' },
        { icon: 'ArrowUpDown', text: 'Elevator' },
        { icon: 'Sparkles', text: 'Well-maintained residential atmosphere' }
      ]
    }
  },
  {
    slide_type: 'features',
    slide_order: 3,
    background_image: '/images/ben-yehuda-110/cleaned-property-image (4).png',
    is_visible: true,
    slide_data: {
      title: 'Unique Features & Positioning',
      key_features_title: 'Key Features',
      key_features: [
        'True duplex separation between bedroom and living spaces',
        'Private roof terrace with legal registration',
        'Elevated position above street level',
        'Strong natural light and open flow'
      ],
      value_elements_title: 'Value Elements',
      value_elements: [
        'Outdoor space',
        'Secure room',
        'Elevator',
        'Central coastal location'
      ],
      quote: 'A lifestyle-driven urban asset, not a standard apartment.'
    }
  },
  {
    slide_type: 'neighborhood',
    slide_order: 4,
    background_image: '/images/ben-yehuda-110/IMG_5763.JPG',
    is_visible: true,
    slide_data: {
      title: 'Old North | Ben Yehuda · Dizengoff · Gordon',
      beach_distance: '3',
      beach_label: 'min to beach',
      location_title: 'Location Highlights',
      location_highlights: [
        'Steps from the beach and promenade',
        'Fully walkable daily life',
        'Cafés, bakeries, galleries, and neighborhood services'
      ],
      appeals_to_title: 'Appeals to',
      appeals_to: [
        { icon: 'Coffee', text: 'Lifestyle buyers' },
        { icon: 'ShoppingBag', text: 'Foreign residents' },
        { icon: 'TreePalm', text: 'Long-term investors' }
      ],
      map_landmarks: [
        { name: 'Gordon Beach', distance: '3 min', position: 'left' },
        { name: 'Ben Yehuda 110', distance: '', position: 'center' },
        { name: 'Dizengoff St.', distance: '2 min', position: 'right' }
      ]
    }
  },
  {
    slide_type: 'pricing',
    slide_order: 5,
    background_image: '/images/ben-yehuda-110/IMG_5765.JPG',
    is_visible: true,
    slide_data: {
      title: 'Market Context',
      stats: [
        { icon: 'TrendingUp', value: '₪58K', label: 'Price per sqm' },
        { icon: 'BarChart3', value: '₪2.9M–5.7M', label: 'Sales Range' },
        { icon: 'Home', value: '62 sqm', label: 'Average Deal Size' }
      ],
      price_range_title: 'Market Price Range — Ben Yehuda Area 2024',
      min_price: '2.9',
      max_price: '5.7',
      strategic_title: 'Strategic Positioning',
      strategic_positioning: [
        'Priced within the active market band',
        'Reflects current conditions — not peak-cycle pricing'
      ]
    }
  },
  {
    slide_type: 'marketing',
    slide_order: 6,
    background_image: '/images/ben-yehuda-110/IMG_5766.JPG',
    is_visible: true,
    slide_data: {
      title: 'Positioning & Strategy',
      positioning_quote: 'Not just an apartment — a coastal Old North lifestyle asset.',
      columns: [
        {
          icon: 'Camera',
          title: 'Visual Strategy',
          items: [
            'Professional photography and video',
            'Lifestyle-led storytelling'
          ]
        },
        {
          icon: 'Users',
          title: 'Target Audiences',
          items: [
            'Local lifestyle buyers',
            'Foreign residents & overseas buyers'
          ]
        },
        {
          icon: 'Target',
          title: 'Exposure Strategy',
          items: [
            'Curated launch before mass advertising',
            'Private networks and off-market reach'
          ]
        }
      ]
    }
  },
  {
    slide_type: 'timeline',
    slide_order: 7,
    background_image: '/images/ben-yehuda-110/IMG_5305.jpeg',
    is_visible: true,
    slide_data: {
      title: 'Timeline',
      timeline_items: [
        { number: 1, period: 'Week 1', description: 'Pricing validation, positioning', icon: 'FileSearch' },
        { number: 2, period: 'Weeks 2–3', description: 'Soft launch to qualified buyers', icon: 'Users' },
        { number: 3, period: 'Weeks 4–6', description: 'Soft launch to qualified buyers', icon: 'MessageSquare' },
        { number: 4, period: 'Ongoing', description: 'Buyer feedback & negotiations', icon: 'CheckCircle' }
      ]
    }
  },
  {
    slide_type: 'marketing2',
    slide_order: 8,
    background_image: '/images/ben-yehuda-110/WhatsApp Image 2026-01-12 at 18.21.59.jpeg',
    is_visible: true,
    slide_data: {
      title: 'Why City Market',
      opening_statement: 'Buyers at this level respond to clarity, control, and confidence.',
      our_approach: [
        { icon: 'UserCheck', text: 'Pre-screened buyers only' },
        { icon: 'MessageSquare', text: 'Narrative control throughout' },
        { icon: 'Shield', text: 'Strategic negotiation' }
      ],
      bottom_statement: 'We manage buyer behavior, not just listings.'
    }
  },
  {
    slide_type: 'about',
    slide_order: 9,
    background_image: '/images/ben-yehuda-110/WhatsApp Image 2026-01-12 at 18.45.28.jpeg',
    is_visible: true,
    slide_data: {
      title: 'City Market Properties',
      intro_quote: 'Selling in prime Tel Aviv requires more than exposure. It requires local intelligence, precise positioning, and human insight.',
      boutique_title: 'Boutique Approach',
      boutique_approach: [
        'Boutique, limited-client approach',
        'Tailored strategy for each property',
        'Discretion, clarity, and control'
      ],
      team_members: [
        {
          name: 'Elad Tzabari',
          icon: 'Award',
          years: '15+',
          description: 'Tel Aviv market expertise'
        },
        {
          name: 'Tali Silberberg',
          icon: 'Globe',
          years: '10+',
          description: 'International perspective'
        }
      ],
      closing_quote: 'Together, we bridge local authenticity and global demand, positioning homes as places people genuinely want to live.'
    }
  },
  {
    slide_type: 'contact',
    slide_order: 10,
    background_image: '/images/ben-yehuda-110/image-1 (1).png',
    is_visible: true,
    slide_data: {
      title: 'Next Steps',
      step1_label: 'Step 1',
      step2_label: 'Step 2',
      checklist: [
        'Exclusive sales representation',
        'Aligned pricing strategy',
        'Controlled, strategic exposure',
        'Ongoing updates & market feedback'
      ],
      quote: 'Move forward with a focused strategy that protects value and attracts the right buyer.',
      company_name: 'City Market Properties',
      agent_names: 'Tali Silberberg · Elad Tzabari',
      phone: '054-228-4477',
      whatsapp: '972542284477',
      footer_text: 'Licensed Brokerage | Israel'
    }
  }
];

export async function createBenYehuda110New(): Promise<{ success: boolean; deckId?: string; error?: string }> {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if deck with this slug already exists
    const { data: existingDeck } = await supabase
      .from('pitch_decks')
      .select('id')
      .eq('slug', 'ben-yehuda-110-new')
      .maybeSingle();

    if (existingDeck) {
      return { success: false, error: 'Deck with slug "ben-yehuda-110-new" already exists' };
    }

    // Create the new pitch deck
    const { data: newDeck, error: deckError } = await supabase
      .from('pitch_decks')
      .insert({
        title: 'Ben Yehuda 110 (New)',
        slug: 'ben-yehuda-110-new',
        language: 'en',
        is_active: true,
        created_by: user.id,
        contact_phone: '054-228-4477',
        contact_whatsapp: '972542284477',
        agent_names: 'Tali Silberberg · Elad Tzabari',
        theme_color: '#f5c242',
        overlay_opacity: 0.85,
      })
      .select()
      .single();

    if (deckError || !newDeck) {
      console.error('Error creating deck:', deckError);
      return { success: false, error: deckError?.message || 'Failed to create deck' };
    }

    // Create all slides
    const slidesWithDeckId = FULL_SLIDES_DATA.map(slide => ({
      ...slide,
      deck_id: newDeck.id,
    }));

    const { error: slidesError } = await supabase
      .from('pitch_deck_slides')
      .insert(slidesWithDeckId);

    if (slidesError) {
      console.error('Error creating slides:', slidesError);
      // Cleanup: delete the deck if slides failed
      await supabase.from('pitch_decks').delete().eq('id', newDeck.id);
      return { success: false, error: slidesError.message };
    }

    return { success: true, deckId: newDeck.id };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export { FULL_SLIDES_DATA };
