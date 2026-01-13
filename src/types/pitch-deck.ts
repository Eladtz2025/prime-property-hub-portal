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
  | 'contact';

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
  subtitle: string;
  location_highlights: Array<{ icon: string; text: string }>;
  appeals_to: Array<{ icon: string; text: string }>;
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
  positioning_quote: string;
  visual_strategy: Array<{ icon: string; text: string }>;
  target_audiences: Array<{ icon: string; text: string }>;
  exposure_strategy: Array<{ icon: string; text: string }>;
}

export interface TimelineSlideData {
  title: string;
  timeline_items: Array<{
    number: string;
    period: string;
    description: string;
    icon: string;
  }>;
}

export interface Marketing2SlideData {
  title: string;
  opening_statement: string;
  approach_items: Array<{ icon: string; text: string }>;
  bottom_statement: string;
}

export interface AboutUsSlideData {
  title: string;
  boutique_quote: string;
  team_members: Array<{
    name: string;
    title: string;
    phone: string;
    image?: string;
  }>;
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

export type SlideData = 
  | TitleSlideData
  | PropertySlideData
  | FeaturesSlideData
  | NeighborhoodSlideData
  | PricingSlideData
  | MarketingSlideData
  | TimelineSlideData
  | Marketing2SlideData
  | AboutUsSlideData
  | ContactSlideData
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
};

export const DEFAULT_SLIDES: Omit<PitchDeckSlide, 'id' | 'deck_id' | 'created_at' | 'updated_at'>[] = [
  {
    slide_type: 'title',
    slide_order: 0,
    is_visible: true,
    slide_data: {
      main_title: 'Property Name',
      subtitle: 'CITY MARKET PROPERTIES',
    } as TitleSlideData,
  },
  {
    slide_type: 'property',
    slide_order: 1,
    is_visible: true,
    slide_data: {
      title: 'Duplex Apartment | 3-Room | Approx. 70 sqm',
      apartment_details: [
        { icon: 'Layers', text: 'Duplex spanning two floors' },
        { icon: 'Square', text: 'Interior area: ~70 sqm' },
        { icon: 'Trees', text: 'Private roof terrace' },
        { icon: 'Shield', text: 'Secure room (mamad)' },
      ],
      building_details: [
        { icon: 'Building2', text: 'Boutique residential building' },
        { icon: 'Layers', text: '5 floors' },
        { icon: 'ArrowUp', text: 'Elevator available' },
        { icon: 'Home', text: 'Well-maintained atmosphere' },
      ],
    } as PropertySlideData,
  },
  {
    slide_type: 'features',
    slide_order: 2,
    is_visible: true,
    slide_data: {
      title: 'Unique Features & Positioning',
      key_features: [
        'True duplex separation between bedroom and living spaces',
        'Private roof terrace with legal registration',
        'Elevated position above street level',
        'Strong natural light and open flow',
      ],
      value_elements: ['Outdoor space', 'Secure room', 'Elevator', 'Central coastal location'],
      quote: 'A lifestyle-driven urban asset, not a standard apartment.',
    } as FeaturesSlideData,
  },
  {
    slide_type: 'neighborhood',
    slide_order: 3,
    is_visible: true,
    slide_data: {
      title: 'Old North',
      subtitle: 'Ben Yehuda · Dizengoff · Gordon',
      location_highlights: [
        { icon: 'Waves', text: '3 min walk to beach' },
        { icon: 'MapPin', text: 'Prime residential street' },
        { icon: 'Coffee', text: 'Cafes & restaurants' },
        { icon: 'ShoppingBag', text: 'Boutique shopping' },
      ],
      appeals_to: [
        { icon: 'Users', text: 'Young professionals' },
        { icon: 'Briefcase', text: 'Investors' },
        { icon: 'TreePalm', text: 'Beach lifestyle seekers' },
      ],
    } as NeighborhoodSlideData,
  },
  {
    slide_type: 'pricing',
    slide_order: 4,
    is_visible: true,
    slide_data: {
      title: 'Market Context',
      price_per_sqm: '₪58K',
      sales_range: '₪2.9M–5.7M',
      avg_deal_size: '62 sqm',
      min_price: 2.9,
      max_price: 5.7,
      strategic_points: [
        'Priced within the active market band',
        'Reflects current conditions and comparable recent sales',
      ],
    } as PricingSlideData,
  },
  {
    slide_type: 'marketing',
    slide_order: 5,
    is_visible: true,
    slide_data: {
      title: 'Marketing Strategy',
      positioning_quote: 'Positioned as a lifestyle asset for buyers seeking character, light, and space in a central location.',
      visual_strategy: [
        { icon: 'Camera', text: 'Professional photography' },
        { icon: 'Video', text: 'Video walkthrough' },
        { icon: 'Palette', text: 'Premium branding' },
      ],
      target_audiences: [
        { icon: 'User', text: 'Young professionals' },
        { icon: 'Users', text: 'Couples upgrading' },
        { icon: 'TrendingUp', text: 'Investors' },
      ],
      exposure_strategy: [
        { icon: 'Globe', text: 'Digital platforms' },
        { icon: 'Building2', text: 'Broker network' },
        { icon: 'Target', text: 'Direct outreach' },
      ],
    } as MarketingSlideData,
  },
  {
    slide_type: 'timeline',
    slide_order: 6,
    is_visible: true,
    slide_data: {
      title: 'Timeline',
      timeline_items: [
        { number: '1', period: 'Week 1-2', description: 'Preparation & Photography', icon: 'Camera' },
        { number: '2', period: 'Week 2-4', description: 'Launch & Marketing', icon: 'Megaphone' },
        { number: '3', period: 'Week 4-8', description: 'Showings & Offers', icon: 'Users' },
        { number: '4', period: 'Week 8+', description: 'Negotiation & Close', icon: 'Handshake' },
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
      approach_items: [
        { icon: 'UserCheck', text: 'Pre-screened buyers only' },
        { icon: 'MessageSquare', text: 'Narrative control throughout' },
        { icon: 'Shield', text: 'Strategic negotiation' },
      ],
      bottom_statement: 'We manage buyer behavior, not just listings.',
    } as Marketing2SlideData,
  },
  {
    slide_type: 'about',
    slide_order: 8,
    is_visible: true,
    slide_data: {
      title: 'About Us',
      boutique_quote: 'As a boutique team, we ensure consistent, senior-level engagement throughout every transaction.',
      team_members: [
        { name: 'Eli Cohen', title: 'Senior Broker', phone: '+972-50-000-0000' },
        { name: 'Dana Levi', title: 'Associate Broker', phone: '+972-50-000-0001' },
      ],
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
];
