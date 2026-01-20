// Static translations for pitch deck UI elements
export const pitchDeckTranslations = {
  en: {
    // Property slide
    theApartment: "The Apartment",
    theBuilding: "The Building",
    rooms: "Rooms",
    sqm: "sqm",
    floor: "Floor",
    parking: "Parking",
    elevator: "Elevator",
    balcony: "Balcony",
    mamad: "Safe Room",
    storage: "Storage",
    renovated: "Renovated",
    airConditioning: "A/C",
    
    // Features slide
    keyFeatures: "Key Features",
    valueElements: "Value Elements",
    
    // Neighborhood slide
    theNeighborhood: "The Neighborhood",
    locationAdvantages: "Location Advantages",
    nearbyAmenities: "Nearby Amenities",
    
    // Pricing slide
    pricingStrategies: "Pricing Strategies",
    marketAnalysis: "Market Analysis",
    recentlySold: "Recently Sold",
    currentlyOnMarket: "Currently on Market",
    suggestedPrice: "Suggested Price",
    
    // Marketing slide
    marketingStrategy: "Marketing Strategy",
    visualStrategy: "Visual Strategy",
    targetAudiences: "Target Audiences",
    exposureStrategy: "Exposure Strategy",
    
    // Timeline slide
    timeline: "Timeline",
    nextSteps: "Next Steps",
    week: "Week",
    
    // Marketing II slide
    ourApproach: "Our Approach",
    
    // Why Us slide
    whyChooseUs: "Why Choose Us",
    ourAdvantages: "Our Advantages",
    
    // About Us slide
    aboutUs: "About Us",
    meetTheTeam: "Meet The Team",
    yearsExperience: "Years Experience",
    
    // Differentiators slide
    whatMakesUsDifferent: "What Makes Us Different",
    ourDifferentiators: "Our Differentiators",
    
    // Contact slide
    contactUs: "Contact Us",
    getInTouch: "Get In Touch",
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    
    // Step 1 Pricing
    step1Title: "Step 1: Pricing Strategy",
    comparativeAnalysis: "Comparative Analysis",
    pricePerSqm: "Price per sqm",
    
    // Step 2 Exclusivity
    step2Title: "Step 2: Exclusivity Agreement",
    exclusivityBenefits: "Exclusivity Benefits",
    
    // Common
    learnMore: "Learn More",
    viewDetails: "View Details",
    close: "Close",
  },
  he: {
    // Property slide
    theApartment: "הדירה",
    theBuilding: "הבניין",
    rooms: "חדרים",
    sqm: "מ״ר",
    floor: "קומה",
    parking: "חניה",
    elevator: "מעלית",
    balcony: "מרפסת",
    mamad: "ממ״ד",
    storage: "מחסן",
    renovated: "משופצת",
    airConditioning: "מיזוג",
    
    // Features slide
    keyFeatures: "תכונות מפתח",
    valueElements: "ערכים מוספים",
    
    // Neighborhood slide
    theNeighborhood: "השכונה",
    locationAdvantages: "יתרונות מיקום",
    nearbyAmenities: "שירותים בקרבת מקום",
    
    // Pricing slide
    pricingStrategies: "אסטרטגיות תמחור",
    marketAnalysis: "ניתוח שוק",
    recentlySold: "נמכרו לאחרונה",
    currentlyOnMarket: "כרגע בשוק",
    suggestedPrice: "מחיר מומלץ",
    
    // Marketing slide
    marketingStrategy: "אסטרטגיית שיווק",
    visualStrategy: "אסטרטגיה ויזואלית",
    targetAudiences: "קהלי יעד",
    exposureStrategy: "אסטרטגיית חשיפה",
    
    // Timeline slide
    timeline: "לוח זמנים",
    nextSteps: "השלבים הבאים",
    week: "שבוע",
    
    // Marketing II slide
    ourApproach: "הגישה שלנו",
    
    // Why Us slide
    whyChooseUs: "למה לבחור בנו",
    ourAdvantages: "היתרונות שלנו",
    
    // About Us slide
    aboutUs: "אודותינו",
    meetTheTeam: "הכירו את הצוות",
    yearsExperience: "שנות ניסיון",
    
    // Differentiators slide
    whatMakesUsDifferent: "מה מייחד אותנו",
    ourDifferentiators: "הייחודיות שלנו",
    
    // Contact slide
    contactUs: "צור קשר",
    getInTouch: "בואו נדבר",
    phone: "טלפון",
    email: "אימייל",
    whatsapp: "וואטסאפ",
    
    // Step 1 Pricing
    step1Title: "שלב 1: אסטרטגיית תמחור",
    comparativeAnalysis: "ניתוח השוואתי",
    pricePerSqm: "מחיר למ״ר",
    
    // Step 2 Exclusivity
    step2Title: "שלב 2: הסכם בלעדיות",
    exclusivityBenefits: "יתרונות הבלעדיות",
    
    // Common
    learnMore: "למידע נוסף",
    viewDetails: "לפרטים",
    close: "סגור",
  }
} as const;

export type Language = 'en' | 'he';
export type TranslationKey = keyof typeof pitchDeckTranslations.en;

export const getTranslation = (language: Language, key: TranslationKey): string => {
  return pitchDeckTranslations[language][key];
};

export const t = (language: Language) => (key: TranslationKey): string => {
  return pitchDeckTranslations[language][key];
};
