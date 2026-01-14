export interface PitchDeck {
  id: string;
  property_id?: string;
  title: string;
  slug: string;
  language: 'he' | 'en';
  is_active: boolean;
  theme_color: string;
  overlay_opacity: number;
  contact_phone?: string;
  contact_whatsapp?: string;
  agent_names?: string;
  views_count: number;
  last_viewed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title?: string;
    address: string;
    city: string;
    rooms?: number;
    property_size?: number;
    floor?: number;
    elevator?: boolean;
    parking?: boolean;
    balcony?: boolean;
    owner_name?: string;
    owner_phone?: string;
    owner_email?: string;
  };
  slides?: PitchDeckSlide[];
}

export type SlideType = 
  | 'title'
  | 'property'
  | 'features'
  | 'neighborhood'
  | 'pricing'
  | 'marketing'
  | 'timeline'
  | 'marketing2'
  | 'about'
  | 'contact'
  | 'step1_pricing';

export interface PitchDeckSlide {
  id: string;
  deck_id: string;
  slide_type: SlideType;
  slide_order: number;
  background_image?: string;
  slide_data: SlideData;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// Slide data types
export interface TitleSlideData {
  main_title: string;
  subtitle: string;
}

export interface PropertySlideData {
  title: string;
  title_mobile?: string;
  apartment_details: Array<{ icon: string; text: string }>;
  building_details: Array<{ icon: string; text: string }>;
}

export interface FeaturesSlideData {
  title: string;
  key_features: string[];
  value_elements: string[];
  quote: string;
}

export interface NeighborhoodSlideData {
  title: string;
  subtitle?: string;
  beach_distance?: number;
  location_highlights?: string[];
  appeals_to?: string[];
  // Map fields
  property_name?: string;
  left_landmark?: string;
  left_distance?: string;
  right_landmark?: string;
  right_distance?: string;
}

export interface PricingSlideData {
  title: string;
  price_per_sqm: string;
  sales_range: string;
  avg_deal_size: string;
  min_price: number;
  max_price: number;
  strategic_points: string[];
}

export interface MarketingSlideData {
  title: string;
  positioning_quote?: string;
  visual_strategy?: string[];
  target_audiences?: string[];
  exposure_strategy?: string[];
}

export interface TimelineSlideData {
  title: string;
  timeline_items?: Array<{
    number: number;
    period: string;
    description: string;
    icon: string;
  }>;
}

export interface MarketingIISlideData {
  title: string;
  opening_statement?: string;
  our_approach?: Array<{ icon: string; text: string }>;
  bottom_statement?: string;
}

export interface AboutUsSlideData {
  title: string;
  boutique_quote?: string;
  boutique_approach?: string[];
  team_members?: Array<{
    name: string;
    years: string;
    expertise: string;
    icon: string;
  }>;
  closing_quote?: string;
}

export interface ContactSlideData {
  title: string;
  checklist: string[];
  quote: string;
  step1_label: string;
  step1_link: string;
  step2_label: string;
  step2_link: string;
}

export interface Step1PricingSlideData {
  title: string;
  subtitle: string;
  option_a_price: string;
  option_a_description: string;
  option_a_months_min: number;
  option_a_months_max: number;
  option_b_price: string;
  option_b_description: string;
  option_b_months_min: number;
  option_b_months_max: number;
  recently_sold: Array<{ address: string; price: string; size: string }>;
  currently_for_sale: Array<{ address: string; price: string; size: string }>;
}

export type SlideData = 
  | TitleSlideData
  | PropertySlideData
  | FeaturesSlideData
  | NeighborhoodSlideData
  | PricingSlideData
  | MarketingSlideData
  | TimelineSlideData
  | MarketingIISlideData
  | AboutUsSlideData
  | ContactSlideData
  | Step1PricingSlideData
  | Record<string, unknown>;

export const SLIDE_TYPE_LABELS: Record<SlideType, { he: string; en: string }> = {
  title: { he: 'כותרת', en: 'Title' },
  property: { he: 'פרטי הנכס', en: 'Property' },
  features: { he: 'תכונות ייחודיות', en: 'Features' },
  neighborhood: { he: 'שכונה', en: 'Neighborhood' },
  pricing: { he: 'תמחור', en: 'Pricing' },
  marketing: { he: 'אסטרטגיה שיווקית', en: 'Marketing' },
  timeline: { he: 'ציר זמן', en: 'Timeline' },
  marketing2: { he: 'למה אנחנו', en: 'Why Us' },
  about: { he: 'אודותינו', en: 'About Us' },
  contact: { he: 'יצירת קשר', en: 'Contact' },
  step1_pricing: { he: 'Step 1 - תמחור', en: 'Step 1 - Pricing' },
};

export const DEFAULT_SLIDES: Omit<PitchDeckSlide, 'id' | 'deck_id' | 'created_at' | 'updated_at'>[] = [
  {
    slide_type: 'title',
    slide_order: 0,
    is_visible: true,
    slide_data: {
      main_title: '',
      subtitle: 'CITY MARKET PROPERTIES',
    } as TitleSlideData,
  },
  {
    slide_type: 'property',
    slide_order: 1,
    is_visible: true,
    slide_data: {
      title: '',
      apartment_details: [],
      building_details: [],
    } as PropertySlideData,
  },
  {
    slide_type: 'features',
    slide_order: 2,
    is_visible: true,
    slide_data: {
      title: 'Unique Features & Positioning',
      key_features: [],
      value_elements: [],
      quote: '',
    } as FeaturesSlideData,
  },
  {
    slide_type: 'neighborhood',
    slide_order: 3,
    is_visible: true,
    slide_data: {
      title: '',
      subtitle: '',
      beach_distance: 0,
      location_highlights: [],
      appeals_to: [],
    } as NeighborhoodSlideData,
  },
  {
    slide_type: 'pricing',
    slide_order: 4,
    is_visible: true,
    slide_data: {
      title: 'Market Context',
      price_per_sqm: '',
      sales_range: '',
      avg_deal_size: '',
      min_price: 0,
      max_price: 0,
      strategic_points: [],
    } as PricingSlideData,
  },
  {
    slide_type: 'marketing',
    slide_order: 5,
    is_visible: true,
    slide_data: {
      title: 'Marketing Strategy',
      positioning_quote: '',
      visual_strategy: [],
      target_audiences: [],
      exposure_strategy: [],
    } as MarketingSlideData,
  },
  {
    slide_type: 'timeline',
    slide_order: 6,
    is_visible: true,
    slide_data: {
      title: 'Timeline',
      timeline_items: [
        { number: 1, period: 'Week 1-2', description: 'Preparation & Photography', icon: 'FileSearch' },
        { number: 2, period: 'Week 2-4', description: 'Launch & Marketing', icon: 'Users' },
        { number: 3, period: 'Week 4-8', description: 'Showings & Offers', icon: 'MessageSquare' },
        { number: 4, period: 'Week 8+', description: 'Negotiation & Close', icon: 'CheckCircle' },
      ],
    } as TimelineSlideData,
  },
  {
    slide_type: 'marketing2',
    slide_order: 7,
    is_visible: true,
    slide_data: {
      title: 'Why City Market',
      opening_statement: 'Buyers at this level respond to clarity, control, and confidence.',
      our_approach: [
        { icon: 'UserCheck', text: 'Pre-screened buyers only' },
        { icon: 'MessageSquare', text: 'Narrative control throughout' },
        { icon: 'Shield', text: 'Strategic negotiation' },
      ],
      bottom_statement: 'We manage buyer behavior, not just listings.',
    } as MarketingIISlideData,
  },
  {
    slide_type: 'about',
    slide_order: 8,
    is_visible: true,
    slide_data: {
      title: 'City Market Properties',
      boutique_quote: 'As a boutique team, we ensure consistent, senior-level engagement throughout every transaction.',
      boutique_approach: ['Boutique, limited-client approach', 'Tailored strategy for each property', 'Discretion, clarity, and control'],
      team_members: [
        { name: 'Elad Tzabari', years: '15+', expertise: 'Tel Aviv market expertise', icon: 'Award' },
        { name: 'Tali Silberberg', years: '10+', expertise: 'International perspective', icon: 'Globe' },
      ],
      closing_quote: 'Together, we bridge local authenticity and global demand.',
    } as AboutUsSlideData,
  },
  {
    slide_type: 'contact',
    slide_order: 9,
    is_visible: true,
    slide_data: {
      title: 'Next Steps',
      checklist: [
        'Exclusive sales representation',
        'Aligned pricing strategy',
        'Professional presentation',
        'Targeted marketing plan',
      ],
      quote: 'Move forward with a focused strategy that reflects the property\'s positioning.',
      step1_label: 'Pricing',
      step1_link: '/pricing',
      step2_label: 'Exclusivity',
      step2_link: '/exclusivity',
    } as ContactSlideData,
  },
  {
    slide_type: 'step1_pricing',
    slide_order: 10,
    is_visible: true,
    slide_data: {
      title: 'אסטרטגיית תמחור',
      subtitle: 'ניתוח שוק ומיצוב מומלץ',
      option_a_price: '₪4,250,000',
      option_a_description: 'מחיר פרימיום למיקום וחידוש',
      option_a_months_min: 7,
      option_a_months_max: 11,
      option_b_price: '₪3,950,000',
      option_b_description: 'מחיר תחרותי למכירה מהירה',
      option_b_months_min: 3,
      option_b_months_max: 5,
      recently_sold: [
        { address: 'Ben Yehuda 98', price: '₪4.1M', size: '60 sqm' },
        { address: 'Dizengoff 145', price: '₪3.8M', size: '55 sqm' },
        { address: 'Ben Yehuda 122', price: '₪4.3M', size: '65 sqm' },
      ],
      currently_for_sale: [
        { address: 'Ben Yehuda 95', price: '₪4.4M', size: '62 sqm' },
        { address: 'Dizengoff 130', price: '₪4.0M', size: '58 sqm' },
      ],
    } as Step1PricingSlideData,
  },
];
