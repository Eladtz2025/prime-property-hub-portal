/**
 * Static Hebrew-English translation dictionary for real estate
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * This dictionary provides translations without AI calls
 */

// ============================================
// Cities (from locations.ts)
// ============================================

export const CITIES_HE_EN: Record<string, string> = {
  // Main cities
  'תל אביב יפו': 'Tel Aviv-Jaffa',
  'תל אביב': 'Tel Aviv',
  'תל-אביב': 'Tel Aviv',
  'ת"א': 'Tel Aviv',
  'רמת גן': 'Ramat Gan',
  'רמת-גן': 'Ramat Gan',
  'גבעתיים': 'Givatayim',
  'גבעת יים': 'Givatayim',
  'הרצליה': 'Herzliya',
  'רעננה': 'Ra\'anana',
  'פתח תקווה': 'Petah Tikva',
  'פתח-תקווה': 'Petah Tikva',
  'פ"ת': 'Petah Tikva',
  'ראשון לציון': 'Rishon LeZion',
  'ראשון-לציון': 'Rishon LeZion',
  'ראשל"צ': 'Rishon LeZion',
  'חולון': 'Holon',
  'בת ים': 'Bat Yam',
  'בת-ים': 'Bat Yam',
  'נתניה': 'Netanya',
  'בני ברק': 'Bnei Brak',
  'בני-ברק': 'Bnei Brak',
  'כפר סבא': 'Kfar Saba',
  'כפר-סבא': 'Kfar Saba',
  'הוד השרון': 'Hod HaSharon',
  'הוד-השרון': 'Hod HaSharon',
  'רמת השרון': 'Ramat HaSharon',
  'רמת-השרון': 'Ramat HaSharon',
  'אשדוד': 'Ashdod',
  'אשקלון': 'Ashkelon',
};

// ============================================
// Tel Aviv Neighborhoods (from locations.ts)
// ============================================

export const TEL_AVIV_NEIGHBORHOODS_HE_EN: Record<string, string> = {
  // צפון ישן
  'צפון ישן': 'Old North',
  'הצפון הישן': 'Old North',
  'הצפון הישן - צפון': 'Old North',
  'הצפון הישן - דרום': 'Old North',
  'הצפון הישן החלק הצפוני': 'Old North',
  'הצפון הישן החלק המרכזי': 'Old North',
  
  // צפון חדש
  'צפון חדש': 'New North',
  'הצפון החדש': 'New North',
  'הצפון החדש - צפון': 'New North',
  'הצפון החדש - דרום': 'New North',
  'הצפון החדש החלק הצפוני': 'New North',
  'הצפון החדש החלק הדרומי': 'New North',
  'לואי מרשל': 'Louis Marshall',
  
  // מרכז העיר
  'מרכז העיר': 'City Center',
  'לב העיר': 'City Center',
  'לב תל אביב': 'Tel Aviv Center',
  'לב העיר צפון': 'City Center North',
  'לב העיר דרום': 'City Center South',
  
  // פלורנטין
  'פלורנטין': 'Florentin',
  'דרום פלורנטין': 'South Florentin',
  'נחלת בנימין': 'Nahalat Binyamin',
  
  // נווה צדק
  'נווה צדק': 'Neve Tzedek',
  'נוה צדק': 'Neve Tzedek',
  
  // רוטשילד
  'רוטשילד': 'Rothschild',
  'דרום רוטשילד': 'South Rothschild',
  'מונטיפיורי': 'Montefiore',
  'שרונה': 'Sarona',
  'גני שרונה': 'Sarona Gardens',
  'קרית הממשלה': 'Government Complex',
  
  // כרם התימנים
  'כרם התימנים': 'Kerem HaTeimanim',
  'הירקון': 'HaYarkon',
  
  // כיכר המדינה
  'כיכר המדינה': 'Kikar HaMedina',
  'אזור ככר המדינה': 'Kikar HaMedina Area',
  
  // רמת אביב
  'רמת אביב': 'Ramat Aviv',
  'רמת אביב החדשה': 'Ramat Aviv HaHadasha',
  'רמת אביב ג': 'Ramat Aviv Gimel',
  'נופי ים': 'Nofei Yam',
  'הגוש הגדול': 'HaGush HaGadol',
  
  // יפו
  'יפו': 'Jaffa',
  'יפו ג': 'Jaffa C',
  'יפו ד': 'Jaffa D',
  'יפו העתיקה': 'Old Jaffa',
  'עג\'מי': 'Ajami',
  'מרכז יפו': 'Central Jaffa',
  'צפון יפו': 'North Jaffa',
  
  // צהלה
  'צהלה': 'Tzahala',
  'גני צהלה': 'Ganei Tzahala',
  'צהלון': 'Tzahalon',
  'רמות צהלה': 'Ramot Tzahala',
  'כוכב הצפון': 'Kochav HaTzafon',
  
  // בבלי
  'בבלי': 'Bavli',
  'שיכון בבלי': 'Shikun Bavli',
  'הבשן': 'HaBashan',
  
  // נמל תל אביב
  'נמל תל אביב': 'Tel Aviv Port',
  'יורדי הסירה': 'Yordei HaSira',
  'ירמיהו': 'Yirmiyahu',
  'התערוכה': 'HaTa\'arucha',
  
  // תל ברוך
  'תל ברוך': 'Tel Baruch',
  'תל ברוך צפון': 'Tel Baruch North',
  'תל ברוך דרום': 'Tel Baruch South',
  
  // דרום תל אביב
  'דרום תל אביב': 'South Tel Aviv',
  'שפירא': 'Shapira',
  'נווה שאנן': 'Neve Sha\'anan',
  'התקווה': 'HaTikva',
  'שכונת התקווה': 'HaTikva Neighborhood',
  'כפר שלם': 'Kfar Shalem',
  'יד אליהו': 'Yad Eliyahu',
  
  // אחרות
  'אזורי חן': 'Azorei Chen',
  'גימל החדשה': 'Gimel HaHadasha',
  'נווה אביבים': 'Neve Avivim',
  'נוה אביבים': 'Neve Avivim',
  'הדר יוסף': 'Hadar Yosef',
  'נווה שרת': 'Neve Sharet',
  'נוה שרת': 'Neve Sharet',
};

// ============================================
// Other Neighborhoods
// ============================================

export const OTHER_NEIGHBORHOODS_HE_EN: Record<string, string> = {
  // רמת גן
  'מרכז רמת גן': 'Ramat Gan Center',
  'אזור הבורסה': 'Diamond Exchange Area',
  'הבורסה': 'Diamond Exchange',
  'יהודה המכבי': 'Yehuda HaMaccabi',
  'רמת חן': 'Ramat Chen',
  'תל בנימין': 'Tel Binyamin',
  'נחלת גנים': 'Nahalat Ganim',
  
  // גבעתיים
  'מרכז גבעתיים': 'Givatayim Center',
  'בורוכוב': 'Borochov',
  
  // הרצליה
  'הרצליה פיתוח': 'Herzliya Pituach',
  'מרכז הרצליה': 'Herzliya Center',
};

// ============================================
// Property Types
// ============================================

export const PROPERTY_TYPES_HE_EN: Record<string, string> = {
  'דירה': 'Apartment',
  'דירת': 'Apartment',
  'פנטהאוז': 'Penthouse',
  'פנטהאוס': 'Penthouse',
  'דירת גן': 'Garden Apartment',
  'דירת גג': 'Rooftop Apartment',
  'סטודיו': 'Studio',
  'קוטג\'': 'Cottage',
  'קוטג': 'Cottage',
  'בית פרטי': 'Private House',
  'בית': 'House',
  'דופלקס': 'Duplex',
  'טריפלקס': 'Triplex',
  'יחידת דיור': 'Housing Unit',
  'מיני פנטהאוז': 'Mini Penthouse',
  'לופט': 'Loft',
  'וילה': 'Villa',
};

// ============================================
// Property Features
// ============================================

export const PROPERTY_FEATURES_HE_EN: Record<string, string> = {
  // Rooms
  'חדר': 'room',
  'חדרים': 'rooms',
  'חדר שינה': 'bedroom',
  'חדרי שינה': 'bedrooms',
  'סלון': 'living room',
  'מטבח': 'kitchen',
  'אמבטיה': 'bathroom',
  'שירותים': 'restroom',
  'מקלחת': 'shower',
  
  // Outdoor
  'מרפסת': 'balcony',
  'מרפסת שמש': 'sun balcony',
  'גינה': 'garden',
  'חצר': 'yard',
  'גג': 'roof',
  'גג פרטי': 'private roof',
  
  // Safety & Infrastructure
  'ממ"ד': 'safe room',
  'ממד': 'safe room',
  'מחסן': 'storage',
  'מחסן פרטי': 'private storage',
  'חניה': 'parking',
  'חנייה': 'parking',
  'חניה פרטית': 'private parking',
  'חניון': 'parking garage',
  'מעלית': 'elevator',
  
  // Climate
  'מיזוג': 'air conditioning',
  'מיזוג אוויר': 'air conditioning',
  'מזגן': 'AC unit',
  'מזגנים': 'AC units',
  'חימום': 'heating',
  'רדיאטור': 'radiator',
  
  // Furnishing
  'מרוהטת': 'furnished',
  'מרוהט': 'furnished',
  'ריהוט מלא': 'fully furnished',
  'ריהוט חלקי': 'partially furnished',
  'ללא ריהוט': 'unfurnished',
  
  // Building
  'קומה': 'floor',
  'קומת קרקע': 'ground floor',
  'קומה ראשונה': 'first floor',
  'מ"ר': 'sqm',
  'מטר': 'meter',
  'בניין': 'building',
  'בניין חדש': 'new building',
  'משותף': 'shared',
  
  // Views
  'נוף': 'view',
  'נוף לים': 'sea view',
  'נוף לעיר': 'city view',
  'נוף פתוח': 'open view',
};

// ============================================
// Transaction Terms
// ============================================

export const TRANSACTION_TERMS_HE_EN: Record<string, string> = {
  'להשכרה': 'for rent',
  'לשכירות': 'for rent',
  'שכירות': 'rent',
  'למכירה': 'for sale',
  'מכירה': 'sale',
  'כניסה מיידית': 'immediate entry',
  'כניסה גמישה': 'flexible entry',
  'פנוי': 'available',
  'פנויה': 'available',
  'מיידי': 'immediate',
  'מושכר': 'rented',
  'מושכרת': 'rented',
  
  // Condition
  'משופץ': 'renovated',
  'משופצת': 'renovated',
  'שיפוץ מלא': 'fully renovated',
  'חדש': 'new',
  'חדשה': 'new',
  'חדש מקבלן': 'new from developer',
  'יד שנייה': 'second hand',
  'יד ראשונה': 'first hand',
  'לפני מסירה': 'before handover',
  
  // Price
  'שכר דירה': 'rent',
  'מחיר': 'price',
  'ש"ח': 'NIS',
  'שקל': 'shekel',
  'שקלים': 'shekels',
  'לחודש': 'per month',
  'כולל': 'including',
  'לא כולל': 'not including',
  'ארנונה': 'property tax',
  'ועד בית': 'building committee fee',
};

// ============================================
// Common Phrases
// ============================================

export const COMMON_PHRASES_HE_EN: Record<string, string> = {
  'דירה יפה': 'beautiful apartment',
  'דירה מרווחת': 'spacious apartment',
  'דירה מוארת': 'bright apartment',
  'דירה שקטה': 'quiet apartment',
  'רחוב שקט': 'quiet street',
  'אזור מבוקש': 'sought-after area',
  'מיקום מעולה': 'excellent location',
  'קרוב לים': 'close to the beach',
  'קרוב לפארק': 'close to the park',
  'קרוב לתחבורה': 'close to transportation',
  'נוף פתוח': 'open view',
  'ללא תיווך': 'no broker',
  'בלעדי': 'exclusive',
  'דמי תיווך': 'broker fee',
  'ללא מתווך': 'no broker',
  'פרטי': 'private',
  'בעלים': 'owner',
};

// ============================================
// Combined Dictionary
// ============================================

export const FULL_DICTIONARY_HE_EN: Record<string, string> = {
  ...CITIES_HE_EN,
  ...TEL_AVIV_NEIGHBORHOODS_HE_EN,
  ...OTHER_NEIGHBORHOODS_HE_EN,
  ...PROPERTY_TYPES_HE_EN,
  ...PROPERTY_FEATURES_HE_EN,
  ...TRANSACTION_TERMS_HE_EN,
  ...COMMON_PHRASES_HE_EN,
};

// ============================================
// Reverse Dictionary (EN -> HE)
// ============================================

export const FULL_DICTIONARY_EN_HE: Record<string, string> = Object.fromEntries(
  Object.entries(FULL_DICTIONARY_HE_EN).map(([he, en]) => [en.toLowerCase(), he])
);

// ============================================
// Statistics
// ============================================

export const DICTIONARY_STATS = {
  cities: Object.keys(CITIES_HE_EN).length,
  tel_aviv_neighborhoods: Object.keys(TEL_AVIV_NEIGHBORHOODS_HE_EN).length,
  other_neighborhoods: Object.keys(OTHER_NEIGHBORHOODS_HE_EN).length,
  property_types: Object.keys(PROPERTY_TYPES_HE_EN).length,
  property_features: Object.keys(PROPERTY_FEATURES_HE_EN).length,
  transaction_terms: Object.keys(TRANSACTION_TERMS_HE_EN).length,
  common_phrases: Object.keys(COMMON_PHRASES_HE_EN).length,
  total: Object.keys(FULL_DICTIONARY_HE_EN).length,
};
